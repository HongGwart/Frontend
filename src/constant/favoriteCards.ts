import BuildingIcon from '@assets/svgs/icons/building.svg';
import type { StoredFavorite } from '@hooks/useFavorites';
import { toPlaceKey } from '@utils/placeKey';
import { DUMMY_FACILITY_CATEGORY_PLACES } from './dummyFacilityCategoryPlaces';
import { DUMMY_OPERATING_HOURS } from './dummyFacilityInfo';
import { DUMMY_FAVORITE_PLACES, FavoritePlace } from './dummyMypage';
import { SEARCH_ITEM_ICONS } from './dummySearchData';

// 즐겨찾기 카드(FavoritePlaceCard)에 그릴 사진/운영시간을 찾아올 장소 데이터. 실제 장소 API가 붙기 전까지는
// Figma 즐겨찾기 더미와 편의시설 카테고리 더미를 장소 키로 모아 쓴다.
const PLACE_CATALOG = new Map<string, FavoritePlace>(
  [...DUMMY_FAVORITE_PLACES, ...Object.values(DUMMY_FACILITY_CATEGORY_PLACES).flat()].map(place => [
    toPlaceKey(place.buildingCode, place.name),
    place,
  ]),
);

/**
 * 저장된 즐겨찾기(참조만 있음)를 카드에 그릴 FavoritePlace로 바꾼다. 장소 데이터에 있으면 그 사진·운영시간을
 * 쓰고, 없으면 카테고리 아이콘(건물이면 건물 아이콘)과 기본 운영 정보로 채운다. id는 장소 키다.
 */
export function toFavoritePlace(favorite: StoredFavorite): FavoritePlace {
  const known = PLACE_CATALOG.get(favorite.placeKey);
  if (known) return { ...known, id: favorite.placeKey };
  const icon = favorite.category ? SEARCH_ITEM_ICONS[favorite.category].icon : BuildingIcon;
  return {
    id: favorite.placeKey,
    name: favorite.name,
    buildingCode: favorite.buildingCode,
    buildingName: favorite.buildingName,
    icon,
    isOpen: DUMMY_OPERATING_HOURS.isOpen,
    statusText: DUMMY_OPERATING_HOURS.statusText,
    hours: '',
  };
}
