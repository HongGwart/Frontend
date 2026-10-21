import { RouteOptionKey } from './routeOptions';

// 길찾기 경로 카드·길 안내 화면 모델 타입. 서버 경로 응답을 toRouteView가 이 모양으로 바꾼다.
export interface RouteStep {
  id: string;
  type: 'walk' | 'elevator';
  /** 이동 수단 라벨 (예: "도보 이동", "구름다리 이동", "엘리베이터") */
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
  /**
   * 엘리베이터 혼잡 등으로 대기가 생길 수 있다는 경고가 붙는지. 경로 카드(RouteResultCard)가 엘리베이터 횟수 옆에
   * 경고 아이콘으로 보여준다(Figma 디자인). 지금 서버 경로 응답엔 혼잡 정보가 없어서 채우는 곳이 없다 —
   * 서버가 혼잡 정보를 주면 toRouteView에서 채운다.
   */
  elevatorWarning?: boolean;
  steps: RouteStep[];
}

export type GuidanceMoveType = 'walk' | 'elevator' | 'stairs' | 'entrance';

// 경로 안내 중 상단 "move info" 카드에 한 장씩 보여줄 구간 안내.
export interface GuidanceStep {
  id: string;
  moveType: GuidanceMoveType;
  /** 카드 문구. Figma처럼 끊고 싶은 지점에 "\n"을 넣는다. */
  title: string;
  durationText: string;
  /** 이 안내를 보여줄 때의 현재 위치 — 경로선 전체 길이 중 진행 비율(0~1). */
  progress: number;
  /** 이 구간을 지나는 동안 있는 층(floorMaps 키, 예: "R_L"). 실외 구간이면 생략 — 길 안내 지도에 그 층 평면도를 깐다. */
  floorId?: string;
}
