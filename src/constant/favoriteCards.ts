import { USE_MOCK_API } from '@api/config';
import BuildingIcon from '@assets/svgs/icons/building.svg';
import type { StoredFavorite } from '@hooks/useFavorites';
import { toPlaceKey } from '@utils/placeKey';
import { DUMMY_FACILITY_CATEGORY_PLACES } from './dummyFacilityCategoryPlaces';
import { getBuildingDetail } from './buildingDetails';
import { getFacilityHours } from './facilityHours';
import { DUMMY_FAVORITE_PLACES, FavoritePlace } from './dummyMypage';
import { SEARCH_ITEM_ICONS } from './dummySearchData';
import { HONGDAE_PLACES } from './hongdaePlaces';

// 즐겨찾기 카드(FavoritePlaceCard)에 그릴 사진/운영시간을 찾아올 장소 데이터. 실제 장소 API가 붙기 전까지는
// Figma 즐겨찾기 더미와 편의시설 카테고리 더미를 장소 키로 모아 쓴다.
// 주변상권 장소도 같은 카드 모양으로 바꿔 넣는다(동 코드 자리에 주소, 건물명 자리에 동 — hongdaeFavoriteInput과 같다).
const HONGDAE_CARD_PLACES: FavoritePlace[] = HONGDAE_PLACES.map(place => ({
  id: place.id,
  name: place.name,
  buildingCode: place.district,
  buildingName: place.neighborhood,
  photo: place.photos?.[0],
  icon: SEARCH_ITEM_ICONS.restaurant.icon,
  operatingHours: place.hours,
}));

const PLACE_CATALOG = new Map<string, FavoritePlace>(
  [...DUMMY_FAVORITE_PLACES, ...Object.values(DUMMY_FACILITY_CATEGORY_PLACES).flat(), ...HONGDAE_CARD_PLACES].map(
    place => [toPlaceKey(place.buildingCode, place.name), place],
  ),
);

/**
 * 저장된 즐겨찾기(참조만 있음)를 카드에 그릴 FavoritePlace로 바꾼다. 장소 데이터에 있으면 그 사진·운영시간을
 * 쓰고, 없으면 카테고리 아이콘(건물이면 건물 아이콘)과 건물·시설 운영 시간으로 채운다. id는 장소 키다.
 */
export function toFavoritePlace(favorite: StoredFavorite): FavoritePlace {
  const known = USE_MOCK_API || (!favorite.nodeId && !favorite.placeId) ? PLACE_CATALOG.get(favorite.placeKey) : undefined;
  if (known) return { ...known, id: favorite.placeKey, nodeId: favorite.nodeId, placeId: favorite.placeId };
  const icon = favorite.category ? SEARCH_ITEM_ICONS[favorite.category].icon : BuildingIcon;
  return {
    id: favorite.placeKey,
    nodeId: favorite.nodeId,
    placeId: favorite.placeId,
    name: favorite.name,
    buildingCode: favorite.buildingCode,
    buildingName: favorite.buildingName,
    icon,
    // 건물이면 건물 운영 시간, 시설이면 시설 운영 시간(둘 다 지금 시각으로 상태를 계산한다)
    operatingHours: USE_MOCK_API ? (favorite.name ? getFacilityHours(favorite.buildingCode, favorite.name) : getBuildingDetail(favorite.buildingCode).hours) : undefined,
  };
}
