import { RoomShape } from "@appTypes/room";

/**
 * 레이 캐스팅으로 (x, y)가 폴리곤 내부인지 판정.
 * Reanimated worklet 안에서 직접 호출할 수 있도록 'worklet' 지시어 포함.
 */
export function pointInPolygon(x: number, y: number, points: [number, number][]): boolean {
  'worklet';
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.00001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * 탭 좌표(원본 SVG 좌표계 기준)에 해당하는 방을 찾는다.
 * 겹치는 방이 있을 수 있으므로 배열 뒤쪽(나중에 그려진 것)을 우선한다.
 */
export function findRoomAtPoint(x: number, y: number, rooms: RoomShape[]): RoomShape | null {
  'worklet';
  for (let i = rooms.length - 1; i >= 0; i--) {
    if (pointInPolygon(x, y, rooms[i].points)) {
      return rooms[i];
    }
  }
  return null;
}

/** 점이 폴리곤 벽에서 얼마나 떨어져 있는지. 폴리곤 밖이면 -1. */
function clearanceInPolygon(x: number, y: number, points: [number, number][]): number {
  if (!pointInPolygon(x, y, points)) return -1;
  return points.reduce((nearest, [ax, ay], index) => {
    const [bx, by] = points[(index + 1) % points.length];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    return Math.min(nearest, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }, Infinity);
}

/** 폴리곤 면적 중심. */
function areaCenter(points: [number, number][]): [number, number] {
  let area = 0;
  let sumX = 0;
  let sumY = 0;
  points.forEach(([ax, ay], index) => {
    const [bx, by] = points[(index + 1) % points.length];
    const cross = ax * by - bx * ay;
    area += cross;
    sumX += (ax + bx) * cross;
    sumY += (ay + by) * cross;
  });
  return area ? [sumX / (3 * area), sumY / (3 * area)] : points[0];
}

/** 폴리곤 안에서 벽과 가장 먼 점(안에 들어가는 가장 큰 원의 중심)과 그 거리. 격자로 찾고 가장 좋은 칸 주변을 좁혀 다시 찾는다. */
function widestPoint(points: [number, number][]): { point: [number, number]; clearance: number } {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  let [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  let best = { point: [(minX + maxX) / 2, (minY + maxY) / 2] as [number, number], clearance: -1 };
  for (let round = 0; round < 5; round++) {
    for (let i = 0; i <= 16; i++) {
      for (let j = 0; j <= 16; j++) {
        const x = minX + ((maxX - minX) * i) / 16;
        const y = minY + ((maxY - minY) * j) / 16;
        const clearance = clearanceInPolygon(x, y, points);
        if (clearance > best.clearance) best = { point: [x, y], clearance };
      }
    }
    const halfWidth = (maxX - minX) / 4;
    const halfHeight = (maxY - minY) / 4;
    minX = best.point[0] - halfWidth;
    maxX = best.point[0] + halfWidth;
    minY = best.point[1] - halfHeight;
    maxY = best.point[1] + halfHeight;
  }
  return best;
}

// 면적 중심의 벽까지 거리가 방에서 가장 넓은 곳의 이 비율보다 작으면 벽에 붙었다고 보고 가장 넓은 곳을 쓴다.
const MIN_CENTER_CLEARANCE_RATIO = 0.5;

/**
 * 방 이름을 그릴 위치. 사각형은 정가운데. ㄱ·ㄷ자 방은 꼭짓점 평균을 쓰면 꼭짓점이 몰린 쪽으로 쏠리거나 방 밖으로 나가서
 * 면적 중심을 쓴다. 다만 면적 중심이 방 밖이거나 벽에 붙으면(전체 방의 0.4%) 가장 넓은 곳을 쓴다 — 처음부터 가장 넓은
 * 곳을 쓰지 않는 건, 넓은 방에 작은 코어가 파고든 모양(H동 601호)에서 방 한쪽 끝으로 치우쳐 보여서다.
 */
export function roomLabelCenter(points: [number, number][]): [number, number] {
  if (points.length <= 4) {
    const [sumX, sumY] = points.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0]);
    return [sumX / points.length, sumY / points.length];
  }
  const center = areaCenter(points);
  const widest = widestPoint(points);
  return clearanceInPolygon(center[0], center[1], points) < widest.clearance * MIN_CENTER_CLEARANCE_RATIO
    ? widest.point
    : center;
}
