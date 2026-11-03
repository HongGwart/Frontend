import { useEffect, useState } from 'react';

// 이만큼 기다려도 응답이 없으면 "응답이 늦어지고 있어요"로 안내를 바꾼다. 요청 타임아웃(10초)과 재시도까지 더하면
// 경로 요청은 최대 약 20초, 그 밖의 요청은 30초 넘게 걸릴 수 있어서 그 전에 기다리는 중임을 알린다.
const SLOW_REQUEST_MS = 5000;

/** active(불러오는 중)가 delayMs 넘게 이어지면 true. active가 꺼지면 바로 false로 돌아간다. */
export function useSlowRequest(active: boolean, delayMs = SLOW_REQUEST_MS) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) {
      setSlow(false);
      return;
    }
    const id = setTimeout(() => setSlow(true), delayMs);
    return () => clearTimeout(id);
  }, [active, delayMs]);
  return slow;
}
