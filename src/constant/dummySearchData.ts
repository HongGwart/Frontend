import { FC } from 'react';
import { SvgProps } from 'react-native-svg';
import BookIcon from '@assets/svgs/icons/book.svg';
import ClassroomIcon from '@assets/svgs/icons/classroom.svg';
import BuildingIcon from '@assets/svgs/icons/building.svg';
import RestaurantIcon from '@assets/svgs/icons/restaurant.svg';
import CafeIcon from '@assets/svgs/icons/cafe.svg';
import StoreIcon from '@assets/svgs/icons/store.svg';
import PcIcon from '@assets/svgs/icons/pc.svg';
import PrinterIcon from '@assets/svgs/icons/printer.svg';
import BookReturnIcon from '@assets/svgs/icons/bookReturn.svg';
import SmokeIcon from '@assets/svgs/icons/smoke.svg';

interface IconSpec {
  icon: FC<SvgProps>;
  iconWidth: number;
  iconHeight: number;
  /**
   * 아바타 배경색. Figma 기준으로 "건물 자체"(building) 카테고리만 브랜드 남색 배경 +
   * 흰 아이콘을 쓰고, 나머지는 즐겨찾기 여부와 무관하게 회색 배경 + 남색 아이콘을 쓴다.
   * (즐겨찾기 별 배지는 배경색과 별개로 isFavorite에 의해서만 노출된다.)
   */
  avatarVariant: 'brand' | 'default';
}

// SearchListItem 왼쪽 아바타에 쓰는 카테고리별 아이콘 프리셋. 카테고리 칩(CATEGORY_CHIPS)과
// 달리 "강의실"/"건물 자체"처럼 검색 결과에만 등장하는 항목도 포함한다.
export const SEARCH_ITEM_ICONS = {
  readingRoom: { icon: BookIcon, iconWidth: 14, iconHeight: 16, avatarVariant: 'default' },
  classroom: { icon: ClassroomIcon, iconWidth: 18, iconHeight: 20, avatarVariant: 'default' },
  building: { icon: BuildingIcon, iconWidth: 15, iconHeight: 16, avatarVariant: 'brand' },
  restaurant: { icon: RestaurantIcon, iconWidth: 13, iconHeight: 16, avatarVariant: 'default' },
  cafe: { icon: CafeIcon, iconWidth: 16, iconHeight: 15, avatarVariant: 'default' },
  store: { icon: StoreIcon, iconWidth: 16, iconHeight: 15, avatarVariant: 'default' },
  pcRoom: { icon: PcIcon, iconWidth: 16, iconHeight: 16, avatarVariant: 'default' },
  printer: { icon: PrinterIcon, iconWidth: 16, iconHeight: 14, avatarVariant: 'default' },
  bookReturn: { icon: BookReturnIcon, iconWidth: 14, iconHeight: 16, avatarVariant: 'default' },
  smokingArea: { icon: SmokeIcon, iconWidth: 16, iconHeight: 15, avatarVariant: 'default' },
} as const satisfies Record<string, IconSpec>;

export type SearchItemCategory = keyof typeof SEARCH_ITEM_ICONS;

export interface SearchResultItem {
  id: string;
  building: string;
  place: string;
  /** 특정 호실 등 세부 정보. 건물/장소 자체가 검색 결과인 경우엔 비운다(예: "학생회관"). */
  room?: string;
  category: SearchItemCategory;
  isFavorite?: boolean;
}

export interface RecentSearchItem extends SearchResultItem {
  date: string;
}

// 실제 API 연동 전까지 검색 페이지 UI 확인용으로 쓰는 더미 데이터.
// SEARCH_ITEM_ICONS에 있는 카테고리(열람실/강의실/건물/식당/카페/편의점/PC실/프린터기/도서 반납기/흡연 구역)를
// 최근 검색어·검색 결과 양쪽에 최소 하나씩 넣어서 모든 아이콘 상태를 확인할 수 있게 한다.
export const DUMMY_RECENT_SEARCHES: RecentSearchItem[] = [
  { id: 'r1', building: 'H동', place: '중앙도서관', room: '314호', category: 'readingRoom', isFavorite: true, date: '04.10' },
  { id: 'r2', building: 'I동', place: '과학관', room: '305호', category: 'classroom', date: '04.10' },
  { id: 'r3', building: 'G동', place: '학생회관', category: 'building', isFavorite: true, date: '04.10' },
  { id: 'r4', building: 'S동', place: '학생회관', room: '식당', category: 'restaurant', date: '04.08' },
  { id: 'r5', building: 'S동', place: '학생회관', room: '카페', category: 'cafe', date: '04.08' },
  { id: 'r6', building: 'S동', place: '학생회관', room: '편의점', category: 'store', isFavorite: true, date: '04.07' },
  { id: 'r7', building: 'E동', place: '공학관', room: 'PC실', category: 'pcRoom', date: '04.03' },
  { id: 'r8', building: 'E동', place: '공학관', room: '프린터기', category: 'printer', date: '04.03' },
  { id: 'r9', building: 'H동', place: '중앙도서관', category: 'bookReturn', date: '04.01' },
  { id: 'r10', building: 'S동', place: '학생회관', room: '흡연 구역', category: 'smokingArea', date: '03.28' },
];

export const DUMMY_SEARCH_RESULTS: SearchResultItem[] = [
  { id: 's1', building: 'H동', place: '중앙도서관', room: '314호', category: 'readingRoom' },
  { id: 's2', building: 'H동', place: '중앙도서관', room: '열람실 2', category: 'readingRoom', isFavorite: true },
  { id: 's3', building: 'H동', place: '중앙도서관', category: 'bookReturn' },
  { id: 's4', building: 'I동', place: '과학관', room: '305호', category: 'classroom' },
  { id: 's5', building: 'G동', place: '학생회관', category: 'building', isFavorite: true },
  { id: 's6', building: 'S동', place: '학생회관', room: '식당', category: 'restaurant' },
  { id: 's7', building: 'S동', place: '학생회관', room: '카페', category: 'cafe' },
  { id: 's8', building: 'E동', place: '공학관', room: 'PC실', category: 'pcRoom' },
  { id: 's9', building: 'E동', place: '공학관', room: '프린터기', category: 'printer' },
  { id: 's10', building: 'S동', place: '학생회관', room: '편의점', category: 'store' },
  { id: 's11', building: 'S동', place: '학생회관', room: '흡연 구역', category: 'smokingArea' },
];
