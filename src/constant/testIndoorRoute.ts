import { LatLng, segmentLength } from '@utils/routePath';
import {
  DUMMY_GUIDANCE_STEPS,
  DUMMY_ROUTE_MAP,
  DUMMY_ROUTE_PATH,
  GuidanceStep,
  RouteResult,
  RouteStep,
} from './dummyRouteResults';

/**
 * 실내 길찾기 테스트용 경로: R동 카페나무 → C동 816호. 구간(stage)마다 노드를 개발용 경로 노드 찍기 모드
 * (DevRouteNodePicker)로 지도에서 직접 탭해 모으고, Metro의 "[ROUTE_NODES]" 로그 JSON을
 * testRouteNodes.json에 붙여넣는다. 길찾기에서 출발/도착을 아래 두 라벨로 고르면 이 경로가 나온다.
 * 실제 경로 탐색 API 연동 전까지 쓰는 더미.
 */
export const TEST_ROUTE_DEPARTURE_LABEL = 'R동 홍문관 카페나무';
export const TEST_ROUTE_DESTINATION_LABEL = 'C동 인문사회관 816호';
export const TEST_ROUTE_ID = 'route-test-r-cafe-to-c816';

export interface TestRouteStage {
  key: string;
  /** 이 구간 노드를 찍을 때 지도에 깔아줄 평면도 층. 바깥 구간은 null */
  floorId: string | null;
  /** 찍기 패널/경로 카드에 쓰는 구간 이름 */
  title: string;
  from: string;
  to: string;
  /** 이 구간이 끝나고 다음 구간으로 넘어갈 때의 층 이동. 다음 구간이 같은 층 높이면 생략 */
  transition?: { type: 'stairs' | 'elevator'; from: string; to: string };
}

export const TEST_ROUTE_STAGES: TestRouteStage[] = [
  {
    key: 'R_L',
    floorId: 'R_L',
    title: 'R동 로비층',
    from: '카페나무',
    to: '계단',
    transition: { type: 'stairs', from: 'R동 로비층', to: '1층' },
  },
  { key: 'R_1', floorId: 'R_1', title: 'R동 1층', from: '계단', to: 'R동 출입구' },
  { key: 'outdoor', floorId: null, title: '바깥', from: 'R동 출입구', to: 'C동 출입구' },
  {
    key: 'C_1',
    floorId: 'C_1',
    title: 'C동 1층',
    from: '출입구',
    to: '엘리베이터',
    transition: { type: 'elevator', from: 'C동 1층', to: '8층' },
  },
  { key: 'C_8', floorId: 'C_8', title: 'C동 8층', from: '엘리베이터', to: '816호' },
];

/** 구간 key → 그 구간에서 순서대로 찍은 노드 위경도 */
export type TestRouteNodes = Record<string, LatLng[]>;

export const TEST_ROUTE_NODES = require('./testRouteNodes.json') as TestRouteNodes;

// 개발용 노드 찍기 모드가 방금 찍은 노드. 파일 저장/HMR을 기다리지 않고 길찾기에서 바로 쓰려고 들고 있는다.
let runtimeNodes: TestRouteNodes = TEST_ROUTE_NODES;
export function setTestRouteNodes(nodes: TestRouteNodes) {
  runtimeNodes = nodes;
}

/** 노드가 2개 미만이라 아직 덜 찍은 구간 */
export function getIncompleteStages(nodes: TestRouteNodes = runtimeNodes) {
  return TEST_ROUTE_STAGES.filter(stage => (nodes[stage.key]?.length ?? 0) < 2);
}

// 위도 1도의 길이(m). routePath의 segmentLength가 위도 단위 길이를 돌려준다.
const METERS_PER_DEGREE = 111320;
const WALK_METERS_PER_MINUTE = 70;
// 층 이동 소요시간(분) — 계단은 한 층, 엘리베이터는 대기 포함 대략값
const TRANSITION_MINUTES = { stairs: 1, elevator: 2 };

function pathMeters(path: LatLng[]) {
  return path.slice(1).reduce((sum, point, i) => sum + segmentLength(path[i], point) * METERS_PER_DEGREE, 0);
}

/** 경로선 중 한 층에 해당하는 구간 (전체 길이 대비 진행 비율 0~1) */
export interface FloorPathSegment {
  floorId: string;
  from: number;
  to: number;
}

export interface TestRoute {
  result: RouteResult;
  floorSegments: FloorPathSegment[];
  /** 전 구간 노드를 이어붙인 경로선 (층이 바뀌어도 지도 위에선 한 줄로 그린다) */
  path: LatLng[];
  guidance: GuidanceStep[];
}

/**
 * 찍어둔 노드로 경로 카드/경로선/구간 안내를 만든다. 노드가 2개 미만인 구간이 있으면 아직 덜 찍은
 * 것이라 null을 돌려준다(길찾기 화면은 그때 기존 더미 경로를 보여준다).
 */
export function buildTestRoute(nodes: TestRouteNodes = runtimeNodes): TestRoute | null {
  if (getIncompleteStages(nodes).length > 0) return null;

  const path: LatLng[] = [];
  const steps: RouteStep[] = [];
  // 구간 안내 카드마다 "이 안내를 볼 때 서 있는 위치" = 그 구간이 시작되는 지점까지의 경로 길이
  const stepStarts: { step: RouteStep; pathLength: number; floorId: string | null }[] = [];
  const floorRanges: { floorId: string; from: number; to: number }[] = [];
  let indoorMeters = 0;
  let stairsCount = 0;
  let elevatorCount = 0;

  TEST_ROUTE_STAGES.forEach(stage => {
    const stageNodes = nodes[stage.key];
    const startLength = path.length > 0 ? pathMeters(path) : 0;
    // 앞 구간 끝 노드를 그대로 이어 찍었으면(층 이동 지점) 겹치는 점을 빼고 잇는다.
    const last = path[path.length - 1];
    const first = stageNodes[0];
    const skipFirst = last && last.latitude === first.latitude && last.longitude === first.longitude;
    path.push(...(skipFirst ? stageNodes.slice(1) : stageNodes));

    if (stage.floorId) floorRanges.push({ floorId: stage.floorId, from: startLength, to: pathMeters(path) });

    const meters = Math.round(pathMeters(stageNodes));
    if (stage.floorId) indoorMeters += meters;
    const walk: RouteStep = {
      id: `${stage.key}-walk`,
      type: 'walk',
      label: stage.floorId ? '실내 이동' : '도보 이동',
      from: stage.floorId ? `${stage.title} ${stage.from}` : stage.from,
      to: stage.to,
      distanceMeters: meters,
      durationMinutes: Math.max(1, Math.round(meters / WALK_METERS_PER_MINUTE)),
    };
    steps.push(walk);
    stepStarts.push({ step: walk, pathLength: startLength, floorId: stage.floorId });

    if (stage.transition) {
      const { type, from, to } = stage.transition;
      if (type === 'stairs') stairsCount += 1;
      else elevatorCount += 1;
      const move: RouteStep = {
        id: `${stage.key}-${type}`,
        // RouteStep엔 계단 타입이 없어서 도보 아이콘 + "계단 이동" 라벨로 보여준다.
        type: type === 'elevator' ? 'elevator' : 'walk',
        label: type === 'elevator' ? '엘리베이터' : '계단 이동',
        from,
        to,
        distanceMeters: 0,
        durationMinutes: TRANSITION_MINUTES[type],
      };
      steps.push(move);
      // 계단/엘리베이터를 타러 가는 동안은 아직 출발 층에 있다.
      stepStarts.push({ step: move, pathLength: pathMeters(path), floorId: stage.floorId });
    }
  });

  const distanceMeters = Math.round(pathMeters(path));
  const total = pathMeters(path) || 1;

  const guidance: GuidanceStep[] = stepStarts.map(({ step, pathLength, floorId }) => {
    const isStairs = step.label === '계단 이동';
    return {
      id: `g-${step.id}`,
      moveType: step.type === 'elevator' ? 'elevator' : isStairs ? 'stairs' : 'walk',
      title:
        step.type === 'elevator'
          ? `엘리베이터로\n${step.to}까지 이동`
          : isStairs
            ? `계단으로\n${step.to}까지 이동`
            : `${step.from}에서\n${step.to}까지 ${step.distanceMeters}m 이동`,
      durationText: `약 ${step.durationMinutes}분 소요`,
      progress: pathLength / total,
      ...(floorId ? { floorId } : {}),
    };
  });

  return {
    result: {
      id: TEST_ROUTE_ID,
      option: 'shortest',
      durationMinutes: steps.reduce((sum, step) => sum + step.durationMinutes, 0),
      distanceMeters,
      indoorPercent: Math.round((indoorMeters / (distanceMeters || 1)) * 100),
      stairsCount,
      elevatorCount,
      steps,
    },
    path,
    guidance,
    floorSegments: floorRanges.map(range => ({ ...range, from: range.from / total, to: range.to / total })),
  };
}

/** 길찾기에서 고른 출발/도착이 테스트 경로 쌍인지 */
export function isTestRoutePair(departure: string, destination: string) {
  return departure === TEST_ROUTE_DEPARTURE_LABEL && destination === TEST_ROUTE_DESTINATION_LABEL;
}

export interface RouteMapData {
  path: LatLng[];
  start: LatLng & { label: string };
  end: LatLng & { label: string };
  guidance: GuidanceStep[];
  /** 층별 경로 구간. 실내 길 안내에서 지금 층 구간만 그릴 때 쓴다(더미 경로는 없음) */
  floorSegments: FloorPathSegment[];
  /** 경로 보기 카메라 — 경로 바운딩 박스 중앙, 경로 길이에 맞춘 줌 */
  camera: LatLng & { zoom: number };
}

function toCamera(path: LatLng[], zoom: number) {
  const lats = path.map(p => p.latitude);
  const lngs = path.map(p => p.longitude);
  return {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    zoom,
  };
}

/**
 * 경로 id로 지도에 그릴 경로선/출발·도착 핀/구간 안내/카메라를 돌려준다. 테스트 경로면 찍은 노드로,
 * 아니면 기존 더미(DUMMY_ROUTE_MAP/PATH, DUMMY_GUIDANCE_STEPS)로 만든다.
 */
export function getRouteMapData(routeId: string | null | undefined): RouteMapData {
  const testRoute = routeId === TEST_ROUTE_ID ? buildTestRoute() : null;
  if (testRoute) {
    const { path, guidance, floorSegments } = testRoute;
    const first = TEST_ROUTE_STAGES[0];
    const last = TEST_ROUTE_STAGES[TEST_ROUTE_STAGES.length - 1];
    // R동 → C동처럼 건물을 건너가는 경로는 줌 17로는 한 화면에 안 들어와서, 길이에 맞춰 줌을 낮춘다.
    const lats = path.map(p => p.latitude);
    const lngs = path.map(p => p.longitude);
    const southWest = { latitude: Math.min(...lats), longitude: Math.min(...lngs) };
    const spanMeters = Math.max(
      segmentLength(southWest, { ...southWest, latitude: Math.max(...lats) }),
      segmentLength(southWest, { ...southWest, longitude: Math.max(...lngs) }),
    ) * METERS_PER_DEGREE;
    const zoom = Math.min(17, Math.max(15, 17 - Math.log2(Math.max(spanMeters, 1) / 200)));
    return {
      path,
      start: { ...path[0], label: first.from },
      end: { ...path[path.length - 1], label: last.to },
      guidance,
      floorSegments,
      camera: toCamera(path, zoom),
    };
  }
  return {
    path: DUMMY_ROUTE_PATH,
    start: { latitude: DUMMY_ROUTE_MAP.startLatitude, longitude: DUMMY_ROUTE_MAP.startLongitude, label: DUMMY_ROUTE_MAP.startLabel },
    end: { latitude: DUMMY_ROUTE_MAP.endLatitude, longitude: DUMMY_ROUTE_MAP.endLongitude, label: DUMMY_ROUTE_MAP.endLabel },
    guidance: DUMMY_GUIDANCE_STEPS,
    floorSegments: [],
    camera: {
      latitude: (DUMMY_ROUTE_MAP.startLatitude + DUMMY_ROUTE_MAP.endLatitude) / 2,
      longitude: (DUMMY_ROUTE_MAP.startLongitude + DUMMY_ROUTE_MAP.endLongitude) / 2,
      zoom: 17,
    },
  };
}
