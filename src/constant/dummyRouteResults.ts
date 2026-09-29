import { RouteOptionKey } from './routeOptions';

// 길찾기 출발/도착지를 모두 설정하면 보여줄 경로 목록. Figma "길 찾기_경로 선택"(720:10860)의
// 카드 3개를 옵션별로 나눠 담았다(최단 경로/비 회피=실내 위주/계단 회피). 실제 경로 탐색
// API 연동 전까지 쓰는 더미 데이터.
export interface RouteStep {
  id: string;
  type: 'walk' | 'elevator';
  /** 이동 수단 라벨 (예: "도보 이동", "구름 다리 이동", "엘리베이터") */
  label: string;
  from: string;
  to: string;
  distanceMeters: number;
  durationMinutes: number;
}

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
  steps: RouteStep[];
}

export const DUMMY_ROUTE_RESULTS: RouteResult[] = [
  {
    id: 'route-shortest',
    option: 'shortest',
    durationMinutes: 8,
    distanceMeters: 650,
    indoorPercent: 40,
    stairsCount: 2,
    steps: [
      { id: 's1', type: 'walk', label: '도보 이동', from: '현재 위치', to: 'Z1동 앞', distanceMeters: 120, durationMinutes: 2 },
      { id: 's2', type: 'walk', label: '구름 다리 이동', from: 'Z1동', to: '홍문관 2층', distanceMeters: 80, durationMinutes: 1 },
      { id: 's3', type: 'elevator', label: '엘리베이터', from: '홍문관 2층', to: '1층', distanceMeters: 120, durationMinutes: 2 },
      { id: 's4', type: 'walk', label: '도보 이동', from: '홍문관', to: 'T동 정문', distanceMeters: 120, durationMinutes: 2 },
      { id: 's5', type: 'elevator', label: '엘리베이터', from: 'T동 1층', to: '3층', distanceMeters: 120, durationMinutes: 2 },
    ],
  },
  {
    id: 'route-avoid-rain',
    option: 'avoidRain',
    durationMinutes: 12,
    distanceMeters: 820,
    indoorPercent: 60,
    elevatorCount: 1,
    elevatorWarning: true,
    steps: [
      { id: 'r1', type: 'walk', label: '도보 이동', from: '현재 위치', to: 'Z1동 앞', distanceMeters: 120, durationMinutes: 2 },
      { id: 'r2', type: 'walk', label: '실내 통로 이동', from: 'Z1동', to: '홍문관 지하 1층', distanceMeters: 220, durationMinutes: 4 },
      { id: 'r3', type: 'elevator', label: '엘리베이터', from: '홍문관 지하 1층', to: '1층', distanceMeters: 120, durationMinutes: 2 },
      { id: 'r4', type: 'walk', label: '실내 통로 이동', from: '홍문관', to: 'T동', distanceMeters: 260, durationMinutes: 3 },
      { id: 'r5', type: 'elevator', label: '엘리베이터', from: 'T동 1층', to: '3층', distanceMeters: 100, durationMinutes: 1 },
    ],
  },
  {
    id: 'route-avoid-stairs',
    option: 'avoidStairs',
    durationMinutes: 12,
    distanceMeters: 820,
    indoorPercent: 60,
    elevatorCount: 1,
    elevatorWarning: true,
    steps: [
      { id: 'a1', type: 'walk', label: '도보 이동', from: '현재 위치', to: 'Z1동 앞', distanceMeters: 120, durationMinutes: 2 },
      { id: 'a2', type: 'walk', label: '구름 다리 이동', from: 'Z1동', to: '홍문관 2층', distanceMeters: 80, durationMinutes: 1 },
      { id: 'a3', type: 'elevator', label: '엘리베이터', from: '홍문관 2층', to: '1층', distanceMeters: 120, durationMinutes: 2 },
      { id: 'a4', type: 'walk', label: '도보 이동', from: '홍문관', to: 'T동 정문', distanceMeters: 380, durationMinutes: 5 },
      { id: 'a5', type: 'elevator', label: '엘리베이터', from: 'T동 1층', to: '3층', distanceMeters: 120, durationMinutes: 2 },
    ],
  },
];

// 위 더미 경로 중 엘리베이터 혼잡 경고가 하나라도 있으면, 화면 하단에 이 안내를 띄운다.
// Figma 예시 문구를 그대로 썼고, 실제로는 경고가 걸린 경로의 건물명이 들어가야 한다.
export const DUMMY_ELEVATOR_WARNING_MESSAGE = 'T동 엘리베이터 혼잡으로 대기가 생길 수 있어요.';

// 길찾기 지도(경로 보기)에 찍을 출발/도착 더미 좌표. Figma "길 찾기_경로 보기"(733:2584)의
// G동 → R동 예시를 그대로 썼다. 실제로는 선택한 출발지/도착지 검색 결과의 좌표를 써야 한다.
export const DUMMY_ROUTE_MAP = {
  startLabel: 'G동',
  startLatitude: 37.5498,
  startLongitude: 126.9241,
  endLabel: 'R동',
  endLatitude: 37.5512,
  endLongitude: 126.9243,
};

// 경로선 좌표. Figma(733:2584)의 경로선은 출발-도착을 직선으로 잇지 않고, 세로로 올라가다
// 꺾여서 가로로 이어지는 L자 형태다 — 실제 캠퍼스 통로를 따라가는 모양을 흉내 내기 위해
// 중간에 꺾이는 지점(도착지의 위도 + 출발지의 경도) 좌표를 하나 끼워 넣는다.
export const DUMMY_ROUTE_PATH = [
  { latitude: DUMMY_ROUTE_MAP.startLatitude, longitude: DUMMY_ROUTE_MAP.startLongitude },
  { latitude: DUMMY_ROUTE_MAP.endLatitude, longitude: DUMMY_ROUTE_MAP.startLongitude },
  { latitude: DUMMY_ROUTE_MAP.endLatitude, longitude: DUMMY_ROUTE_MAP.endLongitude },
];

export type GuidanceMoveType = 'walk' | 'elevator' | 'stairs' | 'entrance';

// 경로 안내 중 상단 "move info" 카드에 한 장씩 보여줄 구간 안내.
export interface GuidanceStep {
  id: string;
  moveType: GuidanceMoveType;
  /** 카드 문구. Figma처럼 끊고 싶은 지점에 "\n"을 넣는다. */
  title: string;
  durationText: string;
  /** 이 안내를 보여줄 때의 현재 위치 — DUMMY_ROUTE_PATH 전체 길이 중 진행 비율(0~1). */
  progress: number;
}

// Figma "길 안내_걷기"(784:4466)의 카드(점 3개 = 구간 3개) 예시를 바탕으로 한 더미 안내.
// 실제로는 선택한 경로의 구간 정보와 현재 위치로 만들어야 한다.
export const DUMMY_GUIDANCE_STEPS: GuidanceStep[] = [
  {
    id: 'g1',
    moveType: 'walk',
    title: '엘리베이터에서 내려\n왼쪽 복도로 30m 이동',
    durationText: '약 1분 소요',
    progress: 0.3,
  },
  {
    id: 'g2',
    moveType: 'walk',
    title: '복도 끝에서\n오른쪽으로 20m 이동',
    durationText: '약 1분 소요',
    progress: 0.7,
  },
  {
    id: 'g3',
    moveType: 'entrance',
    title: 'R동 출입구로\n들어가세요',
    durationText: '약 1분 소요',
    progress: 0.95,
  },
];
