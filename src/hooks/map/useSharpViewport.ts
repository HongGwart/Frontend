import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAnimatedReaction, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/** 이 간격(ms)으로 두 번 연속 transform이 같으면 "멈췄다"고 보고 선명한 레이어를 다시 그린다. */
const SETTLE_CHECK_MS = 120;
/** 멈춘 상태에서도 부동소수점 오차로 값이 미세하게 다를 수 있어 이 정도는 같은 값으로 본다. */
const EPSILON = 1e-4;

export interface MapTransform {
  scale: number;
  translateX: number;
  translateY: number;
  rotation: number;
}

export interface SharpViewport {
  /** 덮개 레이어(View)의 컨테이너 기준 위치/크기와 회전(라디안). 회전 중심은 컨테이너 중앙. */
  left: number;
  top: number;
  width: number;
  height: number;
  rotation: number;
  /** 그 레이어에 그릴 원본 SVG 좌표계 영역 */
  viewBox: { x: number; y: number; width: number; height: number };
}

function sameTransform(a: MapTransform, b: MapTransform) {
  'worklet';
  return (
    Math.abs(a.scale - b.scale) < EPSILON &&
    Math.abs(a.translateX - b.translateX) < EPSILON &&
    Math.abs(a.translateY - b.translateY) < EPSILON &&
    Math.abs(a.rotation - b.rotation) < EPSILON
  );
}

/**
 * 지도 레이어 공식(screen = translate + R(rotation) * (p * scale), useMapGestures 참고)과 똑같이
 * 보이도록, 컨테이너를 빈틈없이 덮는 "지도 축 방향" 사각형과 거기에 그릴 원본 좌표 영역을 구한다.
 * 회전돼 있으면 컨테이너를 덮으려고 사각형이 커지고(w' = W|cos| + H|sin| ...), 그 사각형을
 * 컨테이너 중앙 기준으로 같은 각도만큼 돌려서 얹는다.
 */
function computeViewport(t: MapTransform, containerWidth: number, containerHeight: number): SharpViewport {
  const cos = Math.cos(t.rotation);
  const sin = Math.sin(t.rotation);
  const width = containerWidth * Math.abs(cos) + containerHeight * Math.abs(sin);
  const height = containerWidth * Math.abs(sin) + containerHeight * Math.abs(cos);
  // 덮개 레이어 로컬 좌표 q가 화면에서 c + R(θ)(q - 크기/2)에 오고, 지도 좌표 p는 q = p*scale + k에
  // 그려진다고 두면 두 공식이 같아지는 k = 크기/2 + R(-θ)(translate - c).
  const dx = t.translateX - containerWidth / 2;
  const dy = t.translateY - containerHeight / 2;
  const kx = width / 2 + dx * cos + dy * sin;
  const ky = height / 2 - dx * sin + dy * cos;
  return {
    left: containerWidth / 2 - width / 2,
    top: containerHeight / 2 - height / 2,
    width,
    height,
    rotation: t.rotation,
    viewBox: { x: -kx / t.scale, y: -ky / t.scale, width: width / t.scale, height: height / t.scale },
  };
}

interface TransformValues {
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  rotation: SharedValue<number>;
}

/**
 * 확대하면 도면이 흐려지는 문제의 보정 중 "무엇을 보여줄지" 부분. 평면도 SVG는 벡터지만
 * react-native-svg가 레이아웃 크기의 비트맵으로 한 번 그린 뒤 부모 transform(scale)으로 늘리기
 * 때문에, 크게 확대할수록 픽셀이 늘어난다. 제스처·관성이 멈추면 SharpViewportLayer가 지금 보이는
 * 영역만 화면 해상도로 다시 그리고, 그게 화면에 반영되면 shownTransform에 그 시점 transform을 적는다.
 *
 * 지금 transform이 shownTransform과 같으면 덮개를 보이고 원래 지도 레이어는 숨긴다(흐린 가장자리가
 * 덮개 밑으로 번져 보이지 않게). 다시 움직이기 시작하면 같은 프레임에 반대로 바뀐다 — 두 스타일이 같은
 * 조건으로 UI 스레드에서 계산되므로 어긋나는 프레임이 없다.
 */
export function useSharpViewportVisibility({ scale, translateX, translateY, rotation }: TransformValues) {
  const shownTransform = useSharedValue<MapTransform | null>(null);

  // 주의: Reanimated는 스타일/리액션 함수 안에서 "직접" 읽은 shared value만 추적해서 다시 계산한다.
  // 비교를 별도 헬퍼 함수 안에서만 읽게 두면 추적이 안 돼서 opacity가 처음 값에 굳는다 — 그래서
  // 여섯 값을 각 함수 본문에서 직접 읽고, 순수 비교만 sameTransform에 맡긴다.
  const overlayStyle = useAnimatedStyle(() => {
    const shown = shownTransform.value;
    const current = { scale: scale.value, translateX: translateX.value, translateY: translateY.value, rotation: rotation.value };
    return { opacity: shown && sameTransform(shown, current) ? 1 : 0 };
  });
  const baseStyle = useAnimatedStyle(() => {
    const shown = shownTransform.value;
    const current = { scale: scale.value, translateX: translateX.value, translateY: translateY.value, rotation: rotation.value };
    return { opacity: shown && sameTransform(shown, current) ? 0 : 1 };
  });

  return { shownTransform, overlayStyle, baseStyle };
}

interface SettledViewportOptions extends TransformValues {
  shownTransform: SharedValue<MapTransform | null>;
  containerWidth: number;
  containerHeight: number;
}

/**
 * 덮개를 "언제, 어디를" 다시 그릴지. transform이 바뀌기 시작하면 멈출 때까지 기다렸다가 그 시점의
 * 보이는 영역(viewport)을 돌려준다. 이 state는 덮개 컴포넌트(SharpViewportLayer) 안에만 두어서,
 * 멈출 때마다 IndoorMapView 전체(제스처 포함)가 다시 렌더되지 않게 한다.
 */
export function useSettledViewport({
  scale,
  translateX,
  translateY,
  rotation,
  shownTransform,
  containerWidth,
  containerHeight,
}: SettledViewportOptions) {
  const [settledTransform, setSettledTransform] = useState<MapTransform | null>(null);
  // transform이 바뀐 걸 JS에 이미 알렸는지. 관성 애니메이션 중 매 프레임 JS를 부르지 않도록 한 번만 알린다.
  const changeReported = useSharedValue(false);
  const settleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const readTransform = useCallback(
    (): MapTransform => ({
      scale: scale.value,
      translateX: translateX.value,
      translateY: translateY.value,
      rotation: rotation.value,
    }),
    [scale, translateX, translateY, rotation]
  );

  // transform이 바뀌기 시작하면 불린다. 값이 한 번 더 확인해도 그대로일 때까지 기다렸다가 그 값으로 다시 그린다.
  const watchUntilSettled = useCallback(() => {
    if (settleTimerRef.current) return;
    let previous = readTransform();
    settleTimerRef.current = setInterval(() => {
      const current = readTransform();
      if (!sameTransform(current, previous)) {
        previous = current;
        return;
      }
      if (settleTimerRef.current) clearInterval(settleTimerRef.current);
      settleTimerRef.current = null;
      // 여기서부터 생기는 변화는 다시 알려받는다. 그리는 사이에 또 움직이면 shownTransform과
      // 달라져서 덮개는 자동으로 숨겨지고, 멈추면 새 값으로 다시 그린다.
      changeReported.value = false;
      setSettledTransform(current);
    }, SETTLE_CHECK_MS);
  }, [readTransform, changeReported]);

  useEffect(
    () => () => {
      if (settleTimerRef.current) clearInterval(settleTimerRef.current);
    },
    []
  );

  useAnimatedReaction(
    () => [scale.value, translateX.value, translateY.value, rotation.value],
    () => {
      if (changeReported.value) return;
      changeReported.value = true;
      scheduleOnRN(watchUntilSettled);
    }
  );

  const viewport = useMemo(
    () =>
      settledTransform && containerWidth > 0 && containerHeight > 0
        ? computeViewport(settledTransform, containerWidth, containerHeight)
        : null,
    [settledTransform, containerWidth, containerHeight]
  );

  // 새 영역으로 덮개를 다시 그린 커밋이 화면에 반영된 뒤(두 프레임 뒤)에 보여준다. 먼저 보여주면
  // 원래 레이어는 이미 숨었는데 덮개가 아직 안 그려진 순간이 생겨 깜빡일 수 있다.
  useEffect(() => {
    if (!viewport || !settledTransform) return;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        shownTransform.value = settledTransform;
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [viewport, settledTransform, shownTransform]);

  return viewport;
}
