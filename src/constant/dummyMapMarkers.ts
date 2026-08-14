import { CategoryKey } from './categoryChips';

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

export interface DummyCategoryMarker {
  id: string;
  latitude: number;
  longitude: number;
  category: Exclude<CategoryKey, 'favorite'>;
  favorite?: boolean;
  count?: number;
}

// 카테고리 칩(CategoryChipList)을 눌렀을 때 지도에 뿌려줄 카테고리 마커 더미 데이터.
// 마찬가지로 initialCamera(37.5504, 126.9251) 주변에 대충 흩어놓았다.
export const DUMMY_CATEGORY_MARKERS: DummyCategoryMarker[] = [
  { id: 'c1', latitude: 37.5507, longitude: 126.9255, category: 'readingRoom' },
  { id: 'c2', latitude: 37.5501, longitude: 126.9248, category: 'readingRoom', favorite: true },
  { id: 'c3', latitude: 37.5515, longitude: 126.9257, category: 'restaurant' },
  { id: 'c4', latitude: 37.5497, longitude: 126.9241, category: 'cafe' },
  { id: 'c5', latitude: 37.5511, longitude: 126.9238, category: 'store' },
  { id: 'c6', latitude: 37.5489, longitude: 126.9255, category: 'pcRoom', count: 2 },
  { id: 'c7', latitude: 37.5502, longitude: 126.9271, category: 'printer' },
  { id: 'c8', latitude: 37.5518, longitude: 126.9247, category: 'bookReturn' },
  { id: 'c9', latitude: 37.5492, longitude: 126.9264, category: 'smokingArea' },
];
