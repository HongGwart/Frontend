import BuildingIcon from '@assets/svgs/icons/building.svg';
import type { StoredFavorite } from '@hooks/useFavorites';
import { toPlaceKey } from '@utils/placeKey';
import { FavoritePlace } from './dummyMypage';
import { SEARCH_ITEM_ICONS } from './dummySearchData';
import { HONGDAE_PLACES } from './hongdaePlaces';

// 즐겨찾기 카드(FavoritePlaceCard)에 그릴 사진/운영시간을 찾아올 장소 데이터. 지금은 주변상권 장소만 있다.
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
  HONGDAE_CARD_PLACES.map(place => [toPlaceKey(place.buildingCode, place.name), place]),
);

/**
 * 저장된 즐겨찾기(참조만 있음)를 카드에 그릴 FavoritePlace로 바꾼다. 장소 데이터에 있으면 그 사진·운영시간을
 * 쓰고, 없으면 카테고리 아이콘(건물이면 건물 아이콘)만 채운다(확인된 운영 시간이 없어 운영 줄은 빠진다). id는 장소 키다.
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
    latitude: favorite.latitude,
    longitude: favorite.longitude,
    nodeId: favorite.nodeId,
  };
}
