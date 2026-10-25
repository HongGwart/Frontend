import { useEffect, useState } from 'react';

/**
 * 지금 시각. 다음 분이 시작될 때마다 갱신돼서, 화면을 켜 둔 채 마감 시각이 지나면 "운영 중" → "운영 종료"가
 * 바뀐다(운영 상태 계산: utils/operatingHours).
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const msToNextMinute = 60_000 - (Date.now() % 60_000);
      timer = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, msToNextMinute + 50);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);
  return now;
}
