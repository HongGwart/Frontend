import type { RouteOptionKey } from '@constant/routeOptions';
import type { LatLng } from '@utils/routePath';

// 길찾기 경로 카드·길 안내 화면 모델 타입. 서버 경로 응답을 toRouteView가 이 모양으로 바꾼다.
export interface RouteStep {
  id: string;
  /** 구간 목록 아이콘을 고르는 이동 방식 — walk는 실외 도보 */
  type: 'walk' | 'indoor' | 'stairs' | 'elevator';
  /** 이동 수단 라벨 (예: "도보 이동", "구름다리 이동", "엘리베이터") */
  label: string;
  from: string;
  /** 비어 있으면 화살표 없이 from만 한 줄로 보여준다(층 정보를 모르는 층 이동) */
  to: string;
  distanceMeters: number;
  /** 소요 시간 문구 ("3분", 1분이 안 되면 "30초"처럼 10초 단위) */
  durationText: string;
  /** 엘리베이터 구간의 혼잡 예상(서버 meta.congested) — 구간 목록에 경고 아이콘을 붙인다 */
  congested?: boolean;
}

export interface RouteResult {
  id: string;
  option: RouteOptionKey;
  durationMinutes: number;
  distanceMeters: number;
  /** 실내 보행 비율(%) — 서버 summary.indoorPercent. 값이 없는 응답(구버전 서버)이면 0%로 단정하지 않고 표시를 뺀다 */
  indoorPercent?: number;
  stairsCount?: number;
  elevatorCount?: number;
  /**
   * 엘리베이터 혼잡으로 대기가 생길 수 있다는 경고가 붙는지 — 서버 summary.elevatorCongested. 실시간이 아니라
   * 평일 정각 직전 10분을 혼잡으로 보는 시간표 기준 예상이다. 경로 카드(RouteResultCard)가 엘리베이터 횟수 옆에
   * 경고 아이콘으로 보여준다.
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

/** 경로선 중 한 층에 해당하는 구간 (전체 길이 대비 진행 비율 0~1) */
export interface FloorPathSegment {
  floorId: string;
  from: number;
  to: number;
}

/** 경로 보기·길 안내 지도에 그릴 경로선/출발·도착 핀/구간 안내/카메라 */
export interface RouteMapData {
  path: LatLng[];
  start: LatLng & { label: string };
  end: LatLng & { label: string };
  guidance: GuidanceStep[];
  /** 층별 경로 구간. 실내 길 안내에서 지금 층 구간만 그릴 때 쓴다 */
  floorSegments: FloorPathSegment[];
  /** 경로 보기 카메라 — 경로 바운딩 박스 중앙, 경로 길이에 맞춘 줌 */
  camera: LatLng & { zoom: number };
}
