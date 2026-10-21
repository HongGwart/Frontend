import { FC } from 'react';
import { SvgProps } from 'react-native-svg';
import BuildingIcon from '@assets/svgs/icons/building.svg';
import CafeIcon from '@assets/svgs/icons/cafe.svg';
import { PhotoSource } from '@appTypes/photo';
import { FocusFacilityParam } from '@navigation/types';
import { everyDay, OperatingHours } from '@utils/operatingHours';

// 실제 API 연동 전까지 마이페이지 UI 확인용으로 쓰는 더미 데이터.

export interface FavoritePlace {
  id: string;
  /** 편의시설명. 있으면 시설 카드, 없으면 건물 카드로 렌더된다. */
  name?: string;
  buildingCode: string;
  buildingName: string;
  locationDetail?: string;
  photo?: PhotoSource;
  icon?: FC<SvgProps>;
  iconWidth?: number;
  iconHeight?: number;
  /** 요일별 운영 시간. 운영 상태 문구는 지금 시각으로 계산한다(utils/operatingHours). 없으면 운영 줄을 숨긴다 */
  operatingHours?: OperatingHours;
}

// Figma 마이페이지의 즐겨찾기 4종(건물+아이콘 / 시설+사진 x2 / 시설+아이콘)을 그대로 담았다.
// 즐겨찾기 목록 자체는 이제 기기 로컬 저장(useFavorites)이라, 이 값은 카드에 그릴 사진/운영시간을
// 찾아오는 장소 데이터로만 쓴다(favoriteCards.ts).
export const DUMMY_FAVORITE_PLACES: FavoritePlace[] = [
  {
    id: 'fav-1',
    buildingCode: 'R동',
    buildingName: '홍문관',
    icon: BuildingIcon,
    iconWidth: 72,
    iconHeight: 72,
    operatingHours: everyDay('08:00', '22:00'),
  },
  {
    id: 'fav-2',
    name: '카페드림',
    buildingCode: 'A동',
    buildingName: '인문사회관',
    locationDetail: '1층',
    icon: CafeIcon,
    operatingHours: everyDay('08:00', '22:00'),
  },
  {
    id: 'fav-3',
    name: '카페아이엔지',
    buildingCode: 'H동',
    buildingName: '중앙도서관',
    locationDetail: '3층',
    icon: CafeIcon,
    operatingHours: everyDay('10:00', '19:00'),
  },
  {
    id: 'fav-4',
    name: '카페나무',
    buildingCode: 'L동',
    buildingName: '와우관',
    locationDetail: '4층',
    icon: CafeIcon,
    iconWidth: 72,
    iconHeight: 72,
    operatingHours: everyDay('08:30', '19:00'),
  },
];

/**
 * 즐겨찾기 카드를 탭했을 때 map 탭으로 넘길 파라미터로 변환한다.
 * 편의시설명(name)이 있으면 그게 제목, 없으면 "동 + 건물명"을 제목으로 쓴다.
 */
export function favoritePlaceToFocusParam(place: FavoritePlace): FocusFacilityParam {
  return {
    id: place.id,
    buildingCode: place.buildingCode,
    buildingName: place.buildingName,
    facilityName: place.name ?? `${place.buildingCode} ${place.buildingName}`,
    placeName: place.name,
  };
}

