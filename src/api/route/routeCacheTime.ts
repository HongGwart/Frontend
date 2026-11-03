// 서버 경로 응답을 얼마나 재사용해도 되는지 계산한다. 같은 출발·도착이면 경로는 서버 길 데이터가 바뀌기 전까지 같고,
// 시각에 따라 바뀌는 건 엘리베이터 혼잡 예상(meta.congested·summary.elevatorCongested)뿐이다. 서버는 혼잡을
// 경로 탐색에 쓰지 않고 표시만 한다(백엔드 ElevatorCongestion: "탐색 비용이나 이동 시간에는 영향을 주지 않는다").

// 서울은 서머타임이 없어 항상 UTC+9다.
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
// 혼잡 시간: 평일 08:50~09:00, 09:50~10:00, …, 17:50~18:00 (백엔드 ElevatorCongestion.isCongestedAt과 같은 시간표)
const FIRST_CONGESTED_HOUR = 8;
const LAST_CONGESTED_HOUR = 17;
const CONGESTION_START_MINUTE = 50;
// 기기 시계와 서버 시계가 조금 어긋나도 경계를 넘긴 응답을 쓰지 않게 앞당겨 만료시킨다.
const CLOCK_MARGIN_MS = 60 * 1000;
// 평일 경계는 주말을 건너도 3일 안에 나온다. 넉넉히 일주일까지만 찾는다.
const SEARCH_DAYS = 7;
// 혼잡 경계가 멀어도(밤·주말) 그사이 서버 길 데이터가 바뀌어 배포됐을 수 있어서, 이보다 오래 재사용하지 않는다.
// 길찾기 화면을 띄운 채 둔 쿼리는 gcTime이 적용되지 않으니 여기서 막는다(useRouteSearch의 gcTime과 같은 30분).
const MAX_FRESH_MS = 30 * 60 * 1000;

/** fetchedAt 뒤로 처음 오는 혼잡 시간 시작·끝 시각(ms). */
function nextCongestionBoundary(fetchedAt: number): number {
  const seoul = new Date(fetchedAt + SEOUL_OFFSET_MS);
  for (let day = 0; day <= SEARCH_DAYS; day++) {
    const date = new Date(Date.UTC(seoul.getUTCFullYear(), seoul.getUTCMonth(), seoul.getUTCDate() + day));
    const weekday = date.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (let hour = FIRST_CONGESTED_HOUR; hour <= LAST_CONGESTED_HOUR; hour++) {
      for (const [h, m] of [
        [hour, CONGESTION_START_MINUTE],
        [hour + 1, 0],
      ]) {
        const boundary = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), h, m) - SEOUL_OFFSET_MS;
        if (boundary > fetchedAt) return boundary;
      }
    }
  }
  return fetchedAt + SEARCH_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * fetchedAt에 받은 경로 응답을 다시 요청하지 않고 써도 되는 시간(ms). 혼잡은 엘리베이터에 도착하는 시각으로
 * 판정해서, 지금 출발해 도착할 때까지(최대 longestRouteSeconds) 다음 혼잡 경계를 넘을 수 있으면 응답이 달라질 수
 * 있다. 그래서 "다음 경계 − 가장 긴 경로 소요 시간"까지만 재사용한다. 예) 화요일 14:10에 받은 6분 경로 → 14:40까지
 * (경계 기준 14:43이지만 최대 30분 상한). 밤·주말처럼 경계가 멀어도 최대 30분(MAX_FRESH_MS)까지만 재사용한다.
 */
export function routeFreshMs(fetchedAt: number, longestRouteSeconds: number): number {
  const reusableUntil = nextCongestionBoundary(fetchedAt) - longestRouteSeconds * 1000 - CLOCK_MARGIN_MS;
  return Math.min(MAX_FRESH_MS, Math.max(0, reusableUntil - fetchedAt));
}
