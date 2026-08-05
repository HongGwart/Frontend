import { RoomShape } from '@appTypes/room';
import { findRoomAtPoint } from '@utils/geometry';
import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';

interface UseMapGesturesOptions {
  rooms: RoomShape[];
  onRoomTap: (room: RoomShape) => void;
  /** 원본 SVG(=mapData) 크기. fitToContainer 계산에 필요 */
  mapWidth: number;
  mapHeight: number;
  minScale?: number;
  maxScale?: number;
}

/**
 * GestureDetector에 붙일 composedGesture와, 지도를 감싸는 Animated.View에 붙일
 * animatedStyle을 반환한다.
 *
 * 방 탭 판정은 SVG <Path onPress>가 아니라 Tap 제스처의 로컬 좌표 + point-in-polygon으로
 * 직접 처리한다. GestureDetector가 이미 responder를 점유하는 상태에서 자식 SVG의
 * onPress가 씹히는 문제를 피하기 위함. Tap 제스처의 e.x/e.y는 GestureDetector가 붙은
 * 뷰(=배경 SVG와 동일한, transform 적용 "전" 좌표계) 기준이라 원본 SVG 좌표와 그대로 맞는다.
 */
export function useMapGestures({
  rooms,
  onRoomTap,
  mapWidth,
  mapHeight,
  minScale = 1,
  maxScale = 5,
}: UseMapGesturesOptions) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  // 라디안 단위. 두 손가락 회전 제스처로 갱신됨
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);
  // 화면에 맞춘 배율보다 더 축소하지 못하게, fitToContainer가 호출되면 여기가 갱신됨
  const minScaleShared = useSharedValue(minScale);
  const maxScaleShared = useSharedValue(maxScale);
  // fitToContainer(onLayout)에서 갱신. 핀치/회전 축을 화면 중앙으로 잡을 때 필요
  const containerWidthShared = useSharedValue(0);
  const containerHeightShared = useSharedValue(0);
  // fitToContainer가 계산한 "화면에 꽉 맞춘" 상태의 translate. resetTransform이 (0,0)이
  // 아니라 여기로 돌아가야 지도가 다시 정확히 화면 중앙에 맞춰진다.
  const fitOffsetX = useSharedValue(0);
  const fitOffsetY = useSharedValue(0);
  // 두 손가락 제스처가 시작된 시점에 "화면 중앙"이 가리키던 지도 좌표(원본 SVG 기준).
  // 확대/회전 도중 이 지도 좌표가 항상 화면 중앙에 그대로 있도록 매 프레임 translate를
  // 다시 풀어서, "지도 한쪽 구석(원점) 기준으로 도는" 대신 "화면 중앙 기준으로 도는" 느낌을 만든다.
  const pivotLocalX = useSharedValue(0);
  const pivotLocalY = useSharedValue(0);

  const clamp = (value: number, min: number, max: number) => {
    'worklet';
    return Math.min(Math.max(value, min), max);
  };

  // 지금 화면 중앙에 있는 지도 좌표를 pivotLocalX/Y에 기록한다. 핀치/회전 제스처가
  // 시작될 때(두 손가락이 처음 닿는 순간) 한 번만 호출해서 회전축을 고정한다.
  const capturePivot = () => {
    'worklet';
    if (!containerWidthShared.value || !containerHeightShared.value) return;
    const cx = containerWidthShared.value / 2;
    const cy = containerHeightShared.value / 2;
    const cos = Math.cos(rotation.value);
    const sin = Math.sin(rotation.value);
    const dx = (cx - translateX.value) / scale.value;
    const dy = (cy - translateY.value) / scale.value;
    // R(-rotation) * (dx, dy) : 화면 좌표 -> "회전 안 된" 지도 좌표로 역변환
    pivotLocalX.value = dx * cos + dy * sin;
    pivotLocalY.value = -dx * sin + dy * cos;
  };

  // pivotLocalX/Y가 scale/rotation이 얼마든 항상 화면 중앙에 오도록 translate를 다시 계산.
  // scale.value/rotation.value를 갱신한 "다음"에 호출해야 한다.
  const applyPivot = () => {
    'worklet';
    if (!containerWidthShared.value || !containerHeightShared.value) return;
    const cx = containerWidthShared.value / 2;
    const cy = containerHeightShared.value / 2;
    const cos = Math.cos(rotation.value);
    const sin = Math.sin(rotation.value);
    const rotatedX = pivotLocalX.value * cos - pivotLocalY.value * sin;
    const rotatedY = pivotLocalX.value * sin + pivotLocalY.value * cos;
    translateX.value = cx - rotatedX * scale.value;
    translateY.value = cy - rotatedY * scale.value;
  };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      capturePivot();
    })
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, minScaleShared.value, maxScaleShared.value);
      applyPivot();
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const panGesture = Gesture.Pan()
    // 두 손가락 팬은 핀치/회전 쪽(화면 중앙 축 고정)이 전담하므로 여기서는 한 손가락만 받는다.
    // 안 그러면 두 제스처가 같은 프레임에 translateX/Y를 서로 다른 공식으로 덮어써서 떨린다.
    .minPointers(1)
    .maxPointers(1)
    // 손가락이 이 정도 움직여야 팬으로 인정 -> 그 전까지는 탭 제스처에 기회를 준다
    .minDistance(6)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const rotationGesture = Gesture.Rotation()
    .onStart(() => {
      capturePivot();
    })
    .onUpdate((e) => {
      rotation.value = savedRotation.value + e.rotation;
      applyPivot();
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      const room = findRoomAtPoint(e.x, e.y, rooms);
      if (room) {
        runOnJS(onRoomTap)(room);
      }
    });

  // 핀치/팬/회전은 동시에 굴러가야 하고, 탭은 그것들과 경합(Race)해서 움직임이 없을 때만 이긴다
  const composedGesture = Gesture.Race(
    Gesture.Simultaneous(pinchGesture, panGesture, rotationGesture),
    tapGesture
  );

  // transformOrigin '0 0' 기준, 순서가 곧 공식이다: 자식 좌표 p에 scale -> rotate -> translate
  // 순으로 적용돼서 최종 화면좌표 = translate + Rotate(rotation) * (p * scale) 가 된다.
  // IconMarkersLayer/RoomLabelsLayer가 아이콘·라벨 위치를 계산할 때 이 공식을 그대로 재사용한다.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}rad` },
      { scale: scale.value },
    ],
  }));

  /** 확대/이동/회전을 fitToContainer가 마지막으로 계산한 "화면에 꽉 맞춘" 상태로 되돌린다.
   *  뚝 끊기지 않도록 withTiming으로 부드럽게 애니메이션한다. */
  const resetTransform = useCallback(() => {
    scale.value = withTiming(minScaleShared.value, { duration: 300 });
    translateX.value = withTiming(fitOffsetX.value, { duration: 300 });
    translateY.value = withTiming(fitOffsetY.value, { duration: 300 });
    // 예: 350도 회전한 상태에서 0으로 애니메이션하면 큰 원을 그리며 돌아간다.
    // -180~180도 범위의 동일한 각으로 먼저 순간 이동(시각적으로 티 안 남)시켜서
    // 항상 더 짧은 방향으로 0에 수렴하게 만든다.
    const twoPi = Math.PI * 2;
    let normalized = rotation.value % twoPi;
    if (normalized > Math.PI) normalized -= twoPi;
    if (normalized < -Math.PI) normalized += twoPi;
    rotation.value = normalized;
    rotation.value = withTiming(0, { duration: 300 });
    savedScale.value = minScaleShared.value;
    savedTranslateX.value = fitOffsetX.value;
    savedTranslateY.value = fitOffsetY.value;
    savedRotation.value = 0;
  }, [
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
    rotation,
    savedRotation,
    minScaleShared,
    fitOffsetX,
    fitOffsetY,
  ]);

  /**
   * 컨테이너(화면에 실제로 보이는 영역) 크기를 알게 되는 시점(onLayout)에 호출.
   * 지도 전체가 화면 안에 들어오도록 초기 배율/위치를 계산하고, 그보다 더
   * 축소는 못 하게 minScale도 같이 끌어올린다.
   */
  const fitToContainer = useCallback(
    (containerWidth: number, containerHeight: number) => {
      if (!containerWidth || !containerHeight || !mapWidth || !mapHeight) return;
      const fitScale = Math.min(containerWidth / mapWidth, containerHeight / mapHeight) * 0.98;
      const offsetX = (containerWidth - mapWidth * fitScale) / 2;
      const offsetY = (containerHeight - mapHeight * fitScale) / 2;

      minScaleShared.value = fitScale;
      maxScaleShared.value = Math.max(maxScale, fitScale * 5);
      containerWidthShared.value = containerWidth;
      containerHeightShared.value = containerHeight;
      fitOffsetX.value = offsetX;
      fitOffsetY.value = offsetY;

      scale.value = savedScale.value = fitScale;
      translateX.value = savedTranslateX.value = offsetX;
      translateY.value = savedTranslateY.value = offsetY;
      rotation.value = savedRotation.value = 0;
    },
    [
      mapWidth,
      mapHeight,
      maxScale,
      scale,
      savedScale,
      translateX,
      translateY,
      savedTranslateX,
      savedTranslateY,
      rotation,
      savedRotation,
      minScaleShared,
      maxScaleShared,
      containerWidthShared,
      containerHeightShared,
      fitOffsetX,
      fitOffsetY,
    ]
  );

  return {
    composedGesture,
    animatedStyle,
    resetTransform,
    fitToContainer,
    // 아이콘/라벨 오버레이 레이어가 mapLayer와 같은 translate+rotate+scale 공식으로
    // 화면 좌표를 계산해야 해서 shared value 자체를 그대로 노출한다.
    scale,
    translateX,
    translateY,
    rotation,
  };
}