import { FC } from 'react';
import { SvgProps } from 'react-native-svg';
import BuildingIcon from '@assets/svgs/icons/building.svg';
import CafeIcon from '@assets/svgs/icons/cafe.svg';
import DummyImage1 from '@assets/svgs/dummy/T_dummy1.svg';
import DummyImage2 from '@assets/svgs/dummy/T_dummy2.svg';
import { SearchResultItem } from './dummySearchData';

// 실제 API 연동 전까지 마이페이지 UI 확인용으로 쓰는 더미 데이터.

export const DUMMY_DEFAULT_DEPARTURE = {
  buildingCode: 'H동',
  buildingName: '중앙도서관',
  roomNumber: '314호',
  description: '공과대학 전공 강의실 및 실습실',
};

export interface FavoritePlace {
  id: string;
  /** 편의시설명. 있으면 시설 카드, 없으면 건물 카드로 렌더된다. */
  name?: string;
  buildingCode: string;
  buildingName: string;
  locationDetail?: string;
  photo?: FC<SvgProps>;
  icon?: FC<SvgProps>;
  iconWidth?: number;
  iconHeight?: number;
  isOpen: boolean;
  statusText: string;
  hours: string;
}

// Figma 마이페이지의 즐겨찾기 4종(건물+아이콘 / 시설+사진 x2 / 시설+아이콘)을 그대로 담았다.
export const DUMMY_FAVORITE_PLACES: FavoritePlace[] = [
  {
    id: 'fav-1',
    buildingCode: 'R동',
    buildingName: '홍문관',
    icon: BuildingIcon,
    iconWidth: 72,
    iconHeight: 72,
    isOpen: true,
    statusText: '운영 중',
    hours: '08:00 - 22:00',
  },
  {
    id: 'fav-2',
    name: '카페드림',
    buildingCode: 'A동',
    buildingName: '인문사회관',
    locationDetail: '1층',
    photo: DummyImage1,
    isOpen: true,
    statusText: '운영 중',
    hours: '08:00 - 22:00',
  },
  {
    id: 'fav-3',
    name: '카페아이엔지',
    buildingCode: 'H동',
    buildingName: '중앙도서관',
    locationDetail: '3층',
    photo: DummyImage2,
    isOpen: false,
    statusText: '운영 종료',
    hours: '10:00 - 19:00',
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
    isOpen: false,
    statusText: '운영 종료',
    hours: '08:30 - 19:00',
  },
];

// "기본 출발지 설정" 화면에서 검색했을 때 나오는 결과 더미.
// SearchResultItem 타입과 SEARCH_ITEM_ICONS(아바타 아이콘 프리셋)을 검색 페이지에서 그대로 가져다 쓴다.
// 화면에서 keyword로 필터링하므로, "중앙" 등을 입력하면 아래 항목이 뜬다.
export const DUMMY_DEPARTURE_SEARCH_RESULTS: SearchResultItem[] = [
  { id: 'dep-1', building: 'H동', place: '중앙도서관', category: 'building', isFavorite: true },
  { id: 'dep-2', building: 'H동', place: '중앙도서관', room: '403호', category: 'classroom', isFavorite: true },
  { id: 'dep-3', building: 'H동', place: '중앙도서관', room: '501호', category: 'classroom' },
];
