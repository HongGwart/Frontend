interface Options {
  from: number;
  to: number;
  durationMs: number;
  delayMs?: number;
  /** 0~1 진행도를 받아 0~1로 돌려주는 easing. 기본은 ease-out cubic. */
  easing?: (t: number) => number;
  onUpdate: (value: number) => void;
  onEnd?: () => void;
}

export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * requestAnimationFrame으로 값을 from → to까지 매 프레임 흘려보낸다. 네이버 지도 오버레이
 * (경로선 좌표, 마커 alpha, 원 반지름 등)처럼 Reanimated로 직접 못 움직이는 네이티브 prop을
 * JS 상태로 애니메이션할 때 쓴다. 반환값을 호출하면 진행 중인 애니메이션을 멈춘다.
 */
export function animateValue({ from, to, durationMs, delayMs = 0, easing = easeOutCubic, onUpdate, onEnd }: Options) {
  let frameId = 0;
  let startedAt = 0;
  const tick = () => {
    const t = Math.min(1, (Date.now() - startedAt) / durationMs);
    onUpdate(from + (to - from) * easing(t));
    if (t < 1) frameId = requestAnimationFrame(tick);
    else onEnd?.();
  };
  const timeoutId = setTimeout(() => {
    startedAt = Date.now();
    frameId = requestAnimationFrame(tick);
  }, delayMs);
  return () => {
    clearTimeout(timeoutId);
    cancelAnimationFrame(frameId);
  };
}
