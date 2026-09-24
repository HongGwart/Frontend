import { RouteOptionKey } from './routeOptions';

// 길찾기 출발/도착지를 모두 설정하면 보여줄 경로 목록. Figma "길 찾기_경로 선택"(720:10860)의
// 카드 3개를 옵션별로 나눠 담았다(최단 경로/비 회피=실내 위주/계단 회피). 실제 경로 탐색
// API 연동 전까지 쓰는 더미 데이터.
export interface RouteResult {
  id: string;
  option: RouteOptionKey;
  durationMinutes: number;
  distanceMeters: number;
  indoorPercent: number;
  stairsCount?: number;
  elevatorCount?: number;
  /** 엘리베이터 혼잡 등으로 대기가 생길 수 있다는 경고가 붙는지 */
  elevatorWarning?: boolean;
}

export const DUMMY_ROUTE_RESULTS: RouteResult[] = [
  {
    id: 'route-shortest',
    option: 'shortest',
    durationMinutes: 8,
    distanceMeters: 650,
    indoorPercent: 40,
    stairsCount: 2,
  },
  {
    id: 'route-avoid-rain',
    option: 'avoidRain',
    durationMinutes: 12,
    distanceMeters: 820,
    indoorPercent: 60,
    elevatorCount: 1,
    elevatorWarning: true,
  },
  {
    id: 'route-avoid-stairs',
    option: 'avoidStairs',
    durationMinutes: 12,
    distanceMeters: 820,
    indoorPercent: 60,
    elevatorCount: 1,
    elevatorWarning: true,
  },
];

// 위 더미 경로 중 엘리베이터 혼잡 경고가 하나라도 있으면, 화면 하단에 이 안내를 띄운다.
// Figma 예시 문구를 그대로 썼고, 실제로는 경고가 걸린 경로의 건물명이 들어가야 한다.
export const DUMMY_ELEVATOR_WARNING_MESSAGE = 'T동 엘리베이터 혼잡으로 대기가 생길 수 있어요.';
