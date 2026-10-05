export interface LatLng {
  latitude: number;
  longitude: number;
}

// 캠퍼스 안처럼 짧은 거리에선 평면으로 봐도 충분하다 — 경도 1도의 실제 길이가 위도에 따라
// 줄어드는 것(cos(위도))만 보정해서 두 점 사이 상대 거리를 구한다.
export function segmentLength(a: LatLng, b: LatLng) {
  const lngScale = Math.cos((((a.latitude + b.latitude) / 2) * Math.PI) / 180);
  return Math.hypot(b.latitude - a.latitude, (b.longitude - a.longitude) * lngScale);
}

/**
 * 경로선을 전체 길이 중 progress(0~1) 지점에서 둘로 자른다.
 * 길 안내 중 "지나온 구간(회색)"과 "남은 구간(파란색)"을 따로 그리고, 자른 지점에
 * 현재 위치 마커를 찍는 데 쓴다. 두 구간은 자른 지점(position)을 공유한다.
 */
export function splitPathAt(path: LatLng[], progress: number) {
  const lengths = path.slice(1).map((point, i) => segmentLength(path[i], point));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let remaining = Math.min(1, Math.max(0, progress)) * total;

  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] === 0 ? 0 : Math.min(1, remaining / lengths[i]);
      const a = path[i];
      const b = path[i + 1];
      const position = {
        latitude: a.latitude + (b.latitude - a.latitude) * t,
        longitude: a.longitude + (b.longitude - a.longitude) * t,
      };
      return {
        position,
        traveled: [...path.slice(0, i + 1), position],
        remaining: [position, ...path.slice(i + 1)],
      };
    }
    remaining -= lengths[i];
  }

  // 점이 하나뿐인 경로 — 자를 구간이 없다.
  return { position: path[0], traveled: [path[0]], remaining: [path[0]] };
}

/**
 * 경로선에서 전체 길이 중 from~to(0~1) 구간만 잘라낸다. 실내 길 안내에서 지금 층에 해당하는 구간만
 * 그리는 데 쓴다. 구간이 비면 빈 배열.
 */
export function slicePath(path: LatLng[], from: number, to: number): LatLng[] {
  if (to <= from) return [];
  const head = splitPathAt(path, to).traveled;
  return splitPathAt(head, from / to).remaining;
}

/** 남서쪽 꼭짓점(latitude/longitude) + 크기(delta)로 나타낸 영역 — 지도 animateRegionTo가 받는 모양. */
export interface LatLngRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// 경로 맨 위 끝에 찍힌 핀은 좌표에서 위로 솟고 그 위에 이름표까지 붙어서, 위쪽은 여유를 더 둔다.
// 값은 경로 영역 크기에 대한 비율이다.
const FIT_MARGIN = { top: 0.3, bottom: 0.12, side: 0.15 };
// 아주 짧은 경로(같은 건물 안 등)는 영역이 너무 작아져 지나치게 확대되니, 이보다는 작게 잡지 않는다(약 130m).
const MIN_REGION_SPAN = 0.0012;

/**
 * 주어진 좌표(경로선 꺾이는 점 + 출발·도착 핀 등)가 전부 화면에 들어오는 영역. 백엔드가 경로 좌표를 몇 개를
 * 넘겨주든 그대로 넣으면 된다. 지도의 mapPadding(헤더·카드에 가려진 높이)을 뺀 남은 영역 기준으로 맞춰진다.
 * minSpan(위도 도 단위)보다 좁은 영역은 그만큼 넓혀서 지나치게 확대되지 않게 한다.
 */
export function regionToFit(points: LatLng[], minSpan = MIN_REGION_SPAN): LatLngRegion | null {
  if (points.length === 0) return null;
  const lats = points.map(p => p.latitude);
  const lngs = points.map(p => p.longitude);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  // 최소 크기보다 작으면 가운데를 기준으로 넓힌다. 경도는 위도에 따라 짧아지므로 cos(위도)로 보정한다.
  const lngScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const minLngSpan = minSpan / lngScale;
  if (maxLat - minLat < minSpan) {
    const mid = (minLat + maxLat) / 2;
    minLat = mid - minSpan / 2;
    maxLat = mid + minSpan / 2;
  }
  if (maxLng - minLng < minLngSpan) {
    const mid = (minLng + maxLng) / 2;
    minLng = mid - minLngSpan / 2;
    maxLng = mid + minLngSpan / 2;
  }

  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  const south = minLat - latSpan * FIT_MARGIN.bottom;
  const north = maxLat + latSpan * FIT_MARGIN.top;
  const west = minLng - lngSpan * FIT_MARGIN.side;
  const east = maxLng + lngSpan * FIT_MARGIN.side;
  return { latitude: south, longitude: west, latitudeDelta: north - south, longitudeDelta: east - west };
}
