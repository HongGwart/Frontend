import { RoomShape } from '@appTypes/room';
import { findRoomAtPoint } from '@utils/geometry';
import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
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

  const clamp = (value: number, min: number, max: number) => {
    'worklet';
    return Math.min(Math.max(value, min), max);
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, minScaleShared.value, maxScaleShared.value);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
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
    .onUpdate((e) => {
      rotation.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
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

  const resetTransform = useCallback(() => {
    scale.value = savedScale.value = minScaleShared.value;
    translateX.value = savedTranslateX.value = 0;
    translateY.value = savedTranslateY.value = 0;
    rotation.value = savedRotation.value = 0;
  }, [scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY, rotation, savedRotation, minScaleShared]);

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