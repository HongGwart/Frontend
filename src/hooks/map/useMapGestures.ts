import { RoomShape } from '@appTypes/room';
import { findRoomAtPoint } from '@utils/geometry';
import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
  withTiming,
  withSpring,
  withDecay,
} from 'react-native-reanimated';

/**
 * 확대 한계를 넘어갔다가 손을 뗄 때 튕겨 돌아오는 스프링.
 * stiffness=200, mass=0.5 기준 임계감쇠(진동 없이 멈추는 경계)는 damping=20인데,
 * 그러면 그냥 스무스하게 멈추기만 하고 "바운스" 느낌이 안 나서 그보다 낮게 잡아
 * 살짝 되튕겼다가 자리잡도록 한다.
 */
const BOUNCE_SPRING_CONFIG = { damping: 12, stiffness: 200, mass: 0.5 };
/** 한 손가락 팬을 손에서 놓았을 때 관성으로 미끄러지는 정도. 1에 가까울수록 오래 미끄러짐 */
const PAN_DECELERATION = 0.9975;
/**
 * 핀치를 놓는 순간 손가락 속도를 얼마나 확대 관성에 반영할지. RNGH의 핀치 velocity는
 * "배율이 초당 얼마나 변하는지"의 비율값이라, scale.value를 곱해서 절대 배율/초 단위로
 * 바꾼 다음 이 계수로 한번 더 눌러서 네이버지도처럼 "살짝만" 더 나아가는 정도로 맞춘다.
 */
const ZOOM_MOMENTUM_FACTOR = 0.6;
/** 확대 관성이 멎는 속도. 팬보다 살짝 빠르게 멎도록 조금 더 낮게 잡았다 */
const ZOOM_DECELERATION = 0.996;
/**
 * 처음 화면을 열었을 때(그리고 리셋 버튼을 눌렀을 때) 지도 양옆 끝과 화면 끝 사이에 둘 간격(px).
 * 지도마다 가로세로 비율이 달라서 fitScale*배율 방식으로는 지도마다 이 간격이 들쭉날쭉했다 —
 * 대신 이 값으로 "가로 폭이 containerWidth - margin*2가 되는 배율"을 직접 계산해서 고정한다.
 */
const DEFAULT_HORIZONTAL_MARGIN = 20;

interface UseMapGesturesOptions {
  rooms: RoomShape[];
  /** 지도 탭 시 호출. 방을 찾았으면 그 방, 빈 공간을 탭했으면 null이 온다 (선택 해제용) */
  onMapTap: (room: RoomShape | null) => void;
  /** 원본 SVG(=mapData) 크기. contentBounds가 없을 때의 fallback 및 pivot 계산에 쓰인다 */
  mapWidth: number;
  mapHeight: number;
  /**
   * 실제로 그려진 건물 도면(네이비색 테두리)의 원본 SVG 좌표계 기준 바운딩 박스.
   * SVG 캔버스(mapWidth/mapHeight)는 도면 크기와 무관하게 항상 같은 크기라, 이 값이
   * 없으면 작은 도면일수록 fitToContainer가 여백을 훨씬 크게 잡는다. 생략 시 캔버스
   * 전체({0,0,mapWidth,mapHeight})를 도면으로 간주한다.
   */
  contentBounds?: { minX: number; minY: number; width: number; height: number };
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
  onMapTap,
  mapWidth,
  mapHeight,
  contentBounds,
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
  // 처음 화면을 열었을 때(그리고 리셋 버튼을 눌렀을 때) 보여줄 배율. "지도 전체가 다 보이는"
  // minScaleShared보다 살짝 더 확대된 값 — 지도가 화면을 더 꽉 채워 보이도록. 사용자는
  // 여기서 더 확대할 수도, minScaleShared까지 축소해서 전체를 볼 수도 있다.
  const defaultScaleShared = useSharedValue(minScale);
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
  // true인 동안에는 아래 useAnimatedReaction이 scale/rotation이 바뀔 때마다 pivotLocalX/Y
  // 기준으로 translate를 다시 계산한다. 손가락으로 직접 핀치/회전하는 동안은 물론, 손을 뗀
  // 뒤에 이어지는 관성/바운스 애니메이션이 scale.value를 계속 바꾸는 동안에도 켜둬야
  // 그 애니메이션 내내 축이 안 흔들린다. resetTransform이나 새 팬 제스처처럼 pivot과
  // 무관하게 translate를 직접 다루는 곳에서는 꺼야 서로 안 부딪힌다.
  const pivotActive = useSharedValue(false);

  const clamp = (value: number, min: number, max: number) => {
    'worklet';
    return Math.min(Math.max(value, min), max);
  };

  // 확대 한계(min/max)를 살짝 넘어가도 딱 멈추지 않고 고무줄처럼 저항하며 조금 더 늘어나게 한다.
  // resistance가 작을수록 한계 밖에서 더 뻑뻑하게(조금만) 움직인다.
  const rubberBandClamp = (value: number, min: number, max: number) => {
    'worklet';
    const resistance = 0.55;
    if (value < min) return min - (min - value) * resistance;
    if (value > max) return max + (value - max) * resistance;
    return value;
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

  // pivotLocalX/Y를 주어진 scale로 투영했을 때의 translate를 계산한다 (화면 중앙에 고정).
  // 아래 useAnimatedReaction(매 프레임)과 핀치 종료 시 한계 밖이면 튕겨 돌아갈 목표 지점
  // 계산에 공용으로 쓴다.
  const computePivotTranslate = (targetScale: number) => {
    'worklet';
    const cx = containerWidthShared.value / 2;
    const cy = containerHeightShared.value / 2;
    const cos = Math.cos(rotation.value);
    const sin = Math.sin(rotation.value);
    const rotatedX = pivotLocalX.value * cos - pivotLocalY.value * sin;
    const rotatedY = pivotLocalX.value * sin + pivotLocalY.value * cos;
    return { x: cx - rotatedX * targetScale, y: cy - rotatedY * targetScale };
  };

  // pivotActive가 켜져 있는 동안 scale/rotation이 바뀔 때마다(제스처든, 관성/바운스
  // 애니메이션이든) pivotLocalX/Y가 항상 화면 중앙에 오도록 translate를 자동으로 다시 계산.
  // withDecay/withSpring처럼 "여러 프레임에 걸쳐 scale.value를 계속 바꾸는" 상황에서도
  // 매 프레임 따라가야 해서, 제스처 콜백에서 수동으로 호출하는 대신 반응형으로 처리한다.
  useAnimatedReaction(
    () => ({ scale: scale.value, rotation: rotation.value }),
    (current) => {
      if (!pivotActive.value) return;
      if (!containerWidthShared.value || !containerHeightShared.value) return;
      const { x, y } = computePivotTranslate(current.scale);
      translateX.value = x;
      translateY.value = y;
    }
  );

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      // 직전 확대 관성/바운스 애니메이션이 아직 진행 중일 수 있으니, 지금 값에서 멈추고
      // saved를 현재 위치로 맞춘 다음 새 pivot을 잡는다.
      scale.value = scale.value;
      savedScale.value = scale.value;
      capturePivot();
      pivotActive.value = true;
    })
    .onUpdate((e) => {
      // 한계 안쪽에서는 그대로, 살짝 넘어가면 고무줄처럼 저항하며 더 늘어난다.
      // translate는 위 useAnimatedReaction이 scale 변화를 보고 자동으로 따라간다.
      scale.value = rubberBandClamp(savedScale.value * e.scale, minScaleShared.value, maxScaleShared.value);
    })
    .onEnd((e) => {
      const clampedScale = clamp(scale.value, minScaleShared.value, maxScaleShared.value);
      const stopTracking = (finished?: boolean) => {
        'worklet';
        if (finished !== false) pivotActive.value = false;
      };
      if (clampedScale !== scale.value) {
        // 손을 뗄 때 한계 밖에 있었다면(고무줄 늘어난 상태) 정확한 한계값으로 스프링처럼
        // 튕겨 돌아간다. translate는 반응형으로 같이 따라오니 scale만 스프링시키면 된다.
        scale.value = withSpring(clampedScale, BOUNCE_SPRING_CONFIG, stopTracking);
        savedScale.value = clampedScale;
      } else {
        // 한계 안에서 손을 뗐으면, 네이버지도처럼 놓는 순간 속도만큼 살짝 더 나아가다
        // 멎는 확대 관성을 준다. RNGH의 pinch velocity는 배율의 초당 변화율(비율)이라
        // scale.value를 곱해 절대 배율/초로 바꾼 뒤 계수를 곱해 정도를 조절한다.
        const absoluteVelocity = e.velocity * scale.value * ZOOM_MOMENTUM_FACTOR;
        scale.value = withDecay(
          {
            velocity: absoluteVelocity,
            deceleration: ZOOM_DECELERATION,
            clamp: [minScaleShared.value, maxScaleShared.value],
          },
          stopTracking
        );
        savedScale.value = clampedScale;
      }
    });

  const panGesture = Gesture.Pan()
    // 두 손가락 팬은 핀치/회전 쪽(화면 중앙 축 고정)이 전담하므로 여기서는 한 손가락만 받는다.
    // 안 그러면 두 제스처가 같은 프레임에 translateX/Y를 서로 다른 공식으로 덮어써서 떨린다.
    .minPointers(1)
    .maxPointers(1)
    // 손가락이 이 정도 움직여야 팬으로 인정 -> 그 전까지는 탭 제스처에 기회를 준다
    .minDistance(6)
    .onStart(() => {
      // 직전 관성 스크롤(withDecay)이 아직 굴러가는 중일 수 있으므로, 지금 값 그대로
      // 자기 자신에 대입해서 진행 중이던 애니메이션을 멈추고 saved를 현재 위치로 맞춘다.
      translateX.value = translateX.value;
      translateY.value = translateY.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      // 확대 관성/바운스가 아직 안 끝났는데 사용자가 직접 팬을 시작하면, 그쪽이 계속
      // translate를 다시 계산하며 이 팬 업데이트와 충돌하니 여기서 넘겨받는다.
      pivotActive.value = false;
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd((e) => {
      // 손을 뗄 때 속도가 남아있으면 그 방향으로 서서히 미끄러지다 멈춘다 (관성 스크롤)
      translateX.value = withDecay({ velocity: e.velocityX, deceleration: PAN_DECELERATION });
      translateY.value = withDecay({ velocity: e.velocityY, deceleration: PAN_DECELERATION });
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const rotationGesture = Gesture.Rotation()
    .onStart(() => {
      capturePivot();
      pivotActive.value = true;
    })
    .onUpdate((e) => {
      // translate는 위 useAnimatedReaction이 rotation 변화를 보고 자동으로 따라간다.
      rotation.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      // pivotActive를 여기서 끄지 않는다: 회전은 손가락 2개짜리 제스처라 핀치와 항상
      // 같은 손 뗌에 같이 끝나는데, 어느 쪽 onEnd가 먼저 불릴지는 보장이 없다.
      // 핀치 쪽엔 항상 확대 관성/바운스 스프링이 뒤따르므로, pivotActive를 언제 끌지는
      // pinchGesture.onEnd가 그 애니메이션 완료 콜백에서 전담해서 결정한다.
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      // 방을 못 찾으면 null -> 빈 공간 탭으로 선택 해제
      const room = findRoomAtPoint(e.x, e.y, rooms);
      runOnJS(onMapTap)(room);
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
    // 여기서 scale/translate를 직접 목표로 애니메이션하므로, pivot 반응형 추적은 꺼서
    // useAnimatedReaction이 옛 pivotLocalX/Y 기준으로 translate를 덮어쓰지 않게 한다.
    pivotActive.value = false;
    scale.value = withTiming(defaultScaleShared.value, { duration: 300 });
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
    savedScale.value = defaultScaleShared.value;
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
    defaultScaleShared,
    fitOffsetX,
    fitOffsetY,
    pivotActive,
  ]);

  /**
   * 컨테이너(화면에 실제로 보이는 영역) 크기를 알게 되는 시점(onLayout)에 호출.
   * 지도 전체가 화면 안에 들어오도록 초기 배율/위치를 계산하고, 그보다 더
   * 축소는 못 하게 minScale도 같이 끌어올린다.
   */
  const fitToContainer = useCallback(
    (containerWidth: number, containerHeight: number) => {
      if (!containerWidth || !containerHeight || !mapWidth || !mapHeight) return;
      // fitScale/여백 계산은 SVG 캔버스 전체가 아니라 실제 도면(네이비 테두리) 바운딩 박스
      // 기준으로 해야, 캔버스 안에서 도면이 작게 그려진 층(=여백처럼 보이는 빈 공간이 큰 층)도
      // 다른 층과 같은 배율/여백으로 보인다.
      const { minX: contentMinX, minY: contentMinY, width: contentWidth, height: contentHeight } =
        contentBounds ?? { minX: 0, minY: 0, width: mapWidth, height: mapHeight };
      // "전체 도면이 다 보이는" 축소 한계. pinch-out으로 더는 못 나가는 하한이자,
      // widthFitScale이 이보다 작을 때(도면이 세로로 긴 층 등) 기본 배율의 하한으로도 쓴다.
      const fitScale = Math.min(containerWidth / contentWidth, containerHeight / contentHeight) * 0.98;
      // 처음 보여줄 배율은 도면 가로 폭이 "화면 폭 - 좌우 여백*2"가 되도록 직접 계산한다.
      // fitScale*배율 방식이나 fitScale과 max를 취하는 방식은 지도마다 가로세로 비율이 달라
      // (특히 캔버스 안에서 도면이 작게 그려진 층일수록) 실제 여백이 20px에서 계속 어긋났다 —
      // 이 값을 그대로 기본 배율로 써야 어떤 층이든 항상 정확히 20px가 나온다.
      const widthFitScale = (containerWidth - DEFAULT_HORIZONTAL_MARGIN * 2) / contentWidth;
      // maxScale(prop 기본값 1.5)에 막혀 목표 여백까지 못 커지는 일이 없도록 widthFitScale도
      // 같이 고려해서 pinch 확대 상한을 정한다 — 그래야 아래 min()이 widthFitScale을 깎지 않는다.
      const maxScaleValue = Math.max(maxScale, fitScale * 5, widthFitScale);
      const initialScale = Math.min(widthFitScale, maxScaleValue);
      // 도면 바운딩 박스를 컨테이너 중앙에 놓는 translate. 캔버스 원점(0,0)이 도면 시작점과
      // 다를 수 있어서(contentMinX/Y) 그만큼 먼저 빼준다.
      const offsetX = (containerWidth - contentWidth * initialScale) / 2 - contentMinX * initialScale;
      const offsetY = (containerHeight - contentHeight * initialScale) / 2 - contentMinY * initialScale;

      // pinch-out 하한은 "전체가 다 보이는" fitScale과 기본 배율 중 더 작은 쪽으로 잡는다.
      // widthFitScale이 fitScale보다 작은 층(도면이 세로로 길어 높이가 먼저 꽉 차는 경우)에서
      // 기본 배율보다 더 못 축소되는 상황을 막는다.
      minScaleShared.value = Math.min(fitScale, initialScale);
      maxScaleShared.value = maxScaleValue;
      defaultScaleShared.value = initialScale;
      containerWidthShared.value = containerWidth;
      containerHeightShared.value = containerHeight;
      fitOffsetX.value = offsetX;
      fitOffsetY.value = offsetY;

      scale.value = savedScale.value = initialScale;
      translateX.value = savedTranslateX.value = offsetX;
      translateY.value = savedTranslateY.value = offsetY;
      rotation.value = savedRotation.value = 0;
    },
    [
      mapWidth,
      mapHeight,
      contentBounds,
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
      defaultScaleShared,
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