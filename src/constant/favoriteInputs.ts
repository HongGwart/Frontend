import type { FacilityListSheetItem } from '@components/common/FacilityListSheet';
import type { FavoriteInput } from '@hooks/useFavorites';
import type { FocusFacilityParam } from '@navigation/types';
import { DummyCategoryMarker, DummyMapMarker } from './dummyMapMarkers';

// 화면마다 모양이 다른 장소 데이터(지도 마커, 겹친 마커 리스트 항목, 라우트 파라미터)를 즐겨찾기 저장 형태로
// 바꾼다. 같은 장소면 어느 화면에서 만들어도 같은 장소 키(동 코드 + 시설/호실 이름)가 나오게 맞춘다.

/** 동(건물) 마커 — 건물 자체 즐겨찾기 */
export const favoriteFromDongMarker = (marker: DummyMapMarker): FavoriteInput => ({
  buildingCode: marker.label ?? marker.id,
  buildingName: marker.buildingName,
  category: 'building',
  latitude: marker.latitude,
  longitude: marker.longitude,
});

/** 카테고리(편의시설) 마커 */
export const favoriteFromCategoryMarker = (marker: DummyCategoryMarker): FavoriteInput => ({
  buildingCode: marker.buildingCode,
  buildingName: marker.buildingName,
  name: marker.room,
  category: marker.category,
  latitude: marker.latitude,
  longitude: marker.longitude,
});

/** 겹친 마커 리스트 시트의 항목 */
export const favoriteFromListItem = (item: FacilityListSheetItem): FavoriteInput => ({
  buildingCode: item.building,
  buildingName: item.place,
  name: item.room,
});

/** 마이페이지/즐겨찾기 목록에서 지도로 넘어온 시설 */
export const favoriteFromFocusParam = (facility: FocusFacilityParam): FavoriteInput => ({
  buildingCode: facility.buildingCode,
  buildingName: facility.buildingName,
  name: facility.placeName,
});
