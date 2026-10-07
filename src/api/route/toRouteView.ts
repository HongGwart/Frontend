import type { RouteDto, StepDto } from '@api/generated/model';
import type { GuidanceMoveType, GuidanceStep, RouteResult, RouteStep } from '@constant/dummyRouteResults';
import type { RouteOptionKey } from '@constant/routeOptions';
import { FloorPathSegment, pathMeters, RouteMapData, routeCamera } from '@constant/testIndoorRoute';
import type { LatLng } from '@utils/routePath';

/** 서버 경로 모드 → 경로 옵션 칩. 모르는 모드는 최단 경로로 본다. */
const MODE_TO_OPTION: Record<string, RouteOptionKey> = {
  SHORTEST: 'shortest',
  INDOOR_PREFERRED: 'avoidRain',
  STAIR_AVOIDANCE: 'avoidStairs',
};

// 이보다 짧은 걷기는 안내 문구에 거리를 붙이지 않는다(엘리베이터 문 앞 몇 m 등).
const MIN_WALK_TEXT_METERS = 5;

/** 경로 카드/구간 목록 + 지도에 그릴 경로선·안내를 한 번에 담은 화면 모델 */
export interface RouteView {
  result: RouteResult;
  map: RouteMapData;
}

/** "L" → "로비층", "B1" → "지하 1층", "3" → "3층" */
export function floorLabel(floor?: string) {
  if (!floor) return '';
  if (floor === 'L') return '로비층';
  const basement = floor.match(/^B(\d+)$/);
  if (basement) return `지하 ${basement[1]}층`;
  return `${floor}층`;
}

/** "R동" + "L" → floorMaps 키 "R_L". 건물/층을 모르면 undefined(실외 구간처럼 평면도를 안 깐다). */
function toFloorId(buildingName?: string, floor?: string) {
  const code = buildingName?.match(/^([A-Z]+\d*)동$/)?.[1];
  return code && floor ? `${code}_${floor}` : undefined;
}

const minutes = (seconds?: number) => Math.max(1, Math.round((seconds ?? 0) / 60));

/**
 * 서버는 엘리베이터로 여러 층을 한 번에 가도 한 층마다 FLOOR_CHANGE를 따로 준다(L→1→2→…). 같은 건물에서
 * 같은 수단으로 이어지는 층 이동은 "엘리베이터로 5층까지"처럼 한 구간으로 합친다.
 */
function mergeFloorChanges(steps: StepDto[]): StepDto[] {
  return steps.reduce<StepDto[]>((merged, step) => {
    const prev = merged[merged.length - 1];
    const continues =
      prev?.type === 'FLOOR_CHANGE' &&
      step.type === 'FLOOR_CHANGE' &&
      prev.meta?.transport === step.meta?.transport &&
      prev.context?.buildingNodeId === step.context?.buildingNodeId;
    if (!continues) return [...merged, step];
    merged[merged.length - 1] = {
      ...step,
      distanceMeters: (prev.distanceMeters ?? 0) + (step.distanceMeters ?? 0),
      durationSeconds: (prev.durationSeconds ?? 0) + (step.durationSeconds ?? 0),
      polylineRange: [prev.polylineRange?.[0] ?? 0, step.polylineRange?.[1] ?? 0],
      meta: { ...step.meta, fromFloor: prev.meta?.fromFloor, fromFloorOrder: prev.meta?.fromFloorOrder },
    };
    return merged;
  }, []);
}

function moveTypeOf(step: StepDto): GuidanceMoveType {
  if (step.type === 'FLOOR_CHANGE') return step.meta?.transport === 'ELEVATOR' ? 'elevator' : 'stairs';
  if (/ENTER|EXIT|ENTRANCE/.test(step.type ?? '')) return 'entrance';
  return 'walk';
}

/** 구간이 끝나는 곳의 이름 — 다음이 층 이동이면 그 수단, 아니면 도착지 */
function nextTargetLabel(next: StepDto | undefined, destination: string) {
  if (next?.type === 'FLOOR_CHANGE') return next.meta?.transport === 'ELEVATOR' ? '엘리베이터' : '계단';
  return destination;
}

/** 지금 구간의 출발 위치 이름 — 건물 안이면 "R동 로비층", 바깥이면 지나는 길/랜드마크 */
function placeLabel(step: StepDto) {
  const { context } = step;
  if (context?.indoor) return [context.buildingName, floorLabel(context.floor)].filter(Boolean).join(' ');
  return step.landmark?.name ?? step.road ?? '바깥';
}

/**
 * GET /api/route 응답의 경로 하나를 경로 카드(RouteResult)와 지도/길 안내 데이터(RouteMapData)로 바꾼다.
 * 경로선이 2점 미만이면 그릴 수 없어서 null.
 */
export function toRouteView(route: RouteDto): RouteView | null {
  const polyline = route.polyline ?? [];
  const path: LatLng[] = polyline.map(point => ({ latitude: point.lat ?? 0, longitude: point.lng ?? 0 }));
  if (path.length < 2) return null;

  const mode = route.mode ?? 'SHORTEST';
  const destination = route.to?.name ?? '도착지';
  const departure = route.from?.entranceName ?? route.from?.name ?? '출발지';
  const totalMeters = pathMeters(path) || 1;
  const progressAt = (index: number) => pathMeters(path.slice(0, Math.min(index, path.length - 1) + 1)) / totalMeters;

  // 도착(ARRIVE)은 길 안내 화면이 마지막 "다음"에서 직접 보여주니 구간에서 뺀다.
  const steps = mergeFloorChanges(route.steps ?? []).filter(step => step.type !== 'ARRIVE');

  const routeSteps: RouteStep[] = steps.map((step, index) => {
    const next = steps[index + 1];
    const base = {
      id: `${mode}-${index}`,
      distanceMeters: Math.round(step.distanceMeters ?? 0),
      durationMinutes: minutes(step.durationSeconds),
    };
    if (step.type === 'FLOOR_CHANGE') {
      const isElevator = step.meta?.transport === 'ELEVATOR';
      return {
        ...base,
        // RouteStep엔 계단 타입이 없어서 도보 아이콘 + "계단 이동" 라벨로 보여준다(testIndoorRoute와 같다).
        type: isElevator ? 'elevator' : 'walk',
        label: isElevator ? '엘리베이터' : '계단 이동',
        from: [step.context?.buildingName, floorLabel(step.meta?.fromFloor)].filter(Boolean).join(' '),
        to: floorLabel(step.meta?.toFloor),
      };
    }
    return {
      ...base,
      type: 'walk',
      label: step.context?.indoor ? '실내 이동' : '도보 이동',
      from: step.type === 'DEPART' ? departure : placeLabel(step),
      to: nextTargetLabel(next, destination),
    };
  });

  const guidance: GuidanceStep[] = steps.map((step, index) => {
    const meters = Math.round(step.distanceMeters ?? 0);
    const walkText =
      meters >= MIN_WALK_TEXT_METERS ? `\n${nextTargetLabel(steps[index + 1], destination)}까지 ${meters}m 이동` : '';
    // 층 이동 구간의 context는 도착 층이라, 타고 내린 층의 평면도를 깐다.
    const floorId = step.context?.indoor ? toFloorId(step.context.buildingName, step.context.floor) : undefined;
    return {
      id: `g-${mode}-${index}`,
      moveType: moveTypeOf(step),
      title: `${step.instruction ?? ''}${walkText}`,
      durationText: `약 ${minutes(step.durationSeconds)}분 소요`,
      progress: progressAt(step.polylineRange?.[0] ?? 0),
      ...(floorId ? { floorId } : {}),
    };
  });

  // 실내 경로선을 층별로 묶는다(길 안내에서 지금 층 구간만 그릴 때 쓴다). 경로선 점엔 건물 이름이 없어서,
  // 그 점을 지나는 구간(polylineRange)의 건물을 쓴다.
  const buildingAt = (index: number) =>
    steps.find(({ polylineRange: range }) => range && index >= range[0] && index <= range[1])?.context?.buildingName;
  const floorSegments: FloorPathSegment[] = [];
  let indoorMeters = 0;
  polyline.forEach((point, index) => {
    if (index === 0) return;
    const segmentMeters = pathMeters([path[index - 1], path[index]]);
    const prevPoint = polyline[index - 1];
    if (!point.indoor || !prevPoint.indoor) return;
    indoorMeters += segmentMeters;
    const floorId = toFloorId(buildingAt(index), point.floor);
    // 층이 바뀌는 점(엘리베이터)끼리 잇는 선은 어느 층에도 넣지 않는다.
    if (!floorId || prevPoint.floor !== point.floor) return;
    const from = progressAt(index - 1);
    const to = progressAt(index);
    const last = floorSegments[floorSegments.length - 1];
    if (last?.floorId === floorId && Math.abs(last.to - from) < 1e-9) last.to = to;
    else floorSegments.push({ floorId, from, to });
  });

  // summary.features는 층마다 따로 세서(로비층→5층 엘리베이터 한 번이 5회) 합친 층 이동 구간으로 센다.
  const countRides = (transport: 'ELEVATOR' | 'STAIRS') =>
    steps.filter(step => step.type === 'FLOOR_CHANGE' && (step.meta?.transport === 'ELEVATOR') === (transport === 'ELEVATOR'))
      .length;
  const result: RouteResult = {
    id: `api-${mode}`,
    option: MODE_TO_OPTION[mode] ?? 'shortest',
    durationMinutes: minutes(route.summary?.durationSeconds),
    distanceMeters: Math.round(route.summary?.distanceMeters ?? totalMeters),
    indoorPercent: Math.round((indoorMeters / totalMeters) * 100),
    stairsCount: countRides('STAIRS'),
    elevatorCount: countRides('ELEVATOR'),
    steps: routeSteps,
  };

  return {
    result,
    map: {
      path,
      start: { ...path[0], label: departure },
      end: { ...path[path.length - 1], label: destination },
      // 구간이 하나도 없으면(출발=도착 등) 길 안내 화면이 빈 카드로 깨지지 않게 출발 카드 하나를 둔다.
      guidance: guidance.length
        ? guidance
        : [{ id: `g-${mode}-0`, moveType: 'walk', title: `${destination}까지 이동`, durationText: '약 1분 소요', progress: 0 }],
      floorSegments,
      camera: routeCamera(path),
    },
  };
}
