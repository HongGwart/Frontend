export interface LatLng {
  latitude: number;
  longitude: number;
}

// 캠퍼스 안처럼 짧은 거리에선 평면으로 봐도 충분하다 — 경도 1도의 실제 길이가 위도에 따라
// 줄어드는 것(cos(위도))만 보정해서 두 점 사이 상대 거리를 구한다.
function segmentLength(a: LatLng, b: LatLng) {
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
