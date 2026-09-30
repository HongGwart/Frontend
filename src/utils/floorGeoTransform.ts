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
