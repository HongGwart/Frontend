import { FloorMapData } from '@appTypes/room';

/** 위경도 한 점 */
export interface GeoCoord {
  latitude: number;
  longitude: number;
}

/**
 * 층 평면도를 지도에 앉히는 기준점. 도면 contentBounds의 네 모서리가 실제 지도에 놓인 위치로,
 * 순서는 도면 기준 [좌상단, 우상단, 우하단, 좌하단].
 */
export type FloorGeoAnchors = [GeoCoord, GeoCoord, GeoCoord, GeoCoord];

type Homography = [number, number, number, number, number, number, number, number];

/** 8x8 연립방정식을 가우스 소거(부분 피벗)로 푼다. */
function solveLinear(a: number[][], b: number[]): number[] {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    }
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = m[r][col] / m[col][col];
      for (let c = col; c <= n; c++) m[r][c] -= f * m[col][c];
    }
  }
  return m.map((row, i) => row[n] / row[i]);
}

/**
 * 도면 좌표(SVG px) → 위경도 변환 함수를 만든다. 네 모서리를 그대로 맞추는 투영 변환(homography)이라
 * 회전·기울어짐·약간의 원근 왜곡까지 흡수한다. 건물 하나 규모에선 위경도를 평면으로 봐도 오차가 무시할 만하다.
 */
export function createFloorToGeo(
  bounds: { minX: number; minY: number; width: number; height: number },
  anchors: FloorGeoAnchors,
): (x: number, y: number) => GeoCoord {
  const { minX, minY, width, height } = bounds;
  const src: [number, number][] = [
    [minX, minY],
    [minX + width, minY],
    [minX + width, minY + height],
    [minX, minY + height],
  ];
  const a: number[][] = [];
  const b: number[] = [];
  src.forEach(([x, y], i) => {
    const { longitude: u, latitude: v } = anchors[i];
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  });
  const h = solveLinear(a, b) as Homography;

  return (x, y) => {
    const w = h[6] * x + h[7] * y + 1;
    return {
      longitude: (h[0] * x + h[1] * y + h[2]) / w,
      latitude: (h[3] * x + h[4] * y + h[5]) / w,
    };
  };
}

/** 평면도 네 모서리 기준이 되는 도면 영역. contentBounds가 없는 층은 방 좌표로 바운딩 박스를 계산한다. */
export function getContentBounds(data: FloorMapData) {
  if (data.contentBounds) return data.contentBounds;
  const xs = data.rooms.flatMap(r => r.points.map(p => p[0]));
  const ys = data.rooms.flatMap(r => r.points.map(p => p[1]));
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

// 위도 1도의 길이(m). 경도 1도는 여기에 cos(위도)를 곱한다.
const METERS_PER_DEGREE = 111320;

/**
 * 도면 위 기준점 두 개와 그 두 점의 실제 위경도로 평면도 네 모서리(FloorGeoAnchors)를 계산한다. 두 점만으로
 * 이동·회전·균일 확대(닮음 변환)를 정할 수 있어서, 도면이 찌그러지지 않은 채 지도에 앉는다.
 * 서버 평면도 기준 꼭짓점(GET /api/layers/{layerId}/floor-plan-corners)과 Figma 기준점 좌표로 쓴다.
 *
 * 도면 좌표는 y가 아래로, 위경도는 위도가 위로 커지니 도면 y를 뒤집어 같은 방향으로 맞춘 뒤 계산한다.
 */
export function anchorsFromReferencePoints(
  bounds: { minX: number; minY: number; width: number; height: number },
  floorPoints: [[number, number], [number, number]],
  geoPoints: [GeoCoord, GeoCoord],
): FloorGeoAnchors {
  const lngScale = METERS_PER_DEGREE * Math.cos((geoPoints[0].latitude * Math.PI) / 180);
  // 미터 단위 평면 좌표(동쪽 x, 북쪽 y)와 도면 좌표(y 뒤집음)
  const geo = geoPoints.map(p => [p.longitude * lngScale, p.latitude * METERS_PER_DEGREE]);
  const floor = floorPoints.map(([x, y]) => [x, -y]);

  // 복소수 곱으로 닮음 변환 z_geo = s · z_floor + t 를 푼다(s: 회전+확대, t: 이동).
  const [dx, dy] = [floor[1][0] - floor[0][0], floor[1][1] - floor[0][1]];
  const [gx, gy] = [geo[1][0] - geo[0][0], geo[1][1] - geo[0][1]];
  const denominator = dx * dx + dy * dy;
  const sRe = (gx * dx + gy * dy) / denominator;
  const sIm = (gy * dx - gx * dy) / denominator;
  const tRe = geo[0][0] - (sRe * floor[0][0] - sIm * floor[0][1]);
  const tIm = geo[0][1] - (sRe * floor[0][1] + sIm * floor[0][0]);

  const toGeo = (x: number, y: number): GeoCoord => {
    const fy = -y;
    return {
      longitude: (sRe * x - sIm * fy + tRe) / lngScale,
      latitude: (sRe * fy + sIm * x + tIm) / METERS_PER_DEGREE,
    };
  };
  const { minX, minY, width, height } = bounds;
  return [
    toGeo(minX, minY),
    toGeo(minX + width, minY),
    toGeo(minX + width, minY + height),
    toGeo(minX, minY + height),
  ];
}
