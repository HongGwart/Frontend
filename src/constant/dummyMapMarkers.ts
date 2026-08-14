export interface DummyMapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label?: string;
  favorite?: boolean;
  count?: number;
}

// 실제 건물 좌표 연동 전까지 지도 마커 UI 확인용으로 쓰는 더미 데이터.
// MapScreen의 initialCamera(37.5504, 126.9251) 주변에 흩어놓았다.
export const DUMMY_MAP_MARKERS: DummyMapMarker[] = [
  { id: 'm1', latitude: 37.5504, longitude: 126.9251, label: 'G동' },
  { id: 'm2', latitude: 37.5512, longitude: 126.9243, label: 'H동', favorite: true },
  { id: 'm3', latitude: 37.5498, longitude: 126.9262, label: 'I동', count: 2 },
  { id: 'm4', latitude: 37.5509, longitude: 126.9268, label: 'S동', favorite: true, count: 3 },
  { id: 'm5', latitude: 37.5493, longitude: 126.9245, label: 'E동' },
];
