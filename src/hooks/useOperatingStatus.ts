import { getOperatingStatus, OperatingHours, OperatingStatus } from '@utils/operatingHours';
import { useNow } from './useNow';

/** 운영 시간 원자료 → 지금 시각 기준 운영 상태(1분마다 갱신). 운영 시간이 없으면 undefined(화면은 그 줄을 숨긴다). */
export function useOperatingStatus(hours: OperatingHours | undefined): OperatingStatus | undefined {
  const now = useNow();
  return hours ? getOperatingStatus(hours, now) : undefined;
}
