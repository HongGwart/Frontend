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
  /** 서버 검색 결과면 노드 id(GET /api/nodes/{nodeId}, 길찾기 출발/도착에 쓴다). 앱 더미 항목엔 없다. */
  nodeId?: number;
  building: string;
  place: string;
  /** 특정 호실 등 세부 정보. 건물/장소 자체가 검색 결과인 경우엔 비운다(예: "학생회관"). */
  room?: string;
  category: SearchItemCategory;
  isFavorite?: boolean;
}

/** 최근 검색어(로컬 저장, useRecentSearches). 목록의 날짜는 searchedAt에서 계산한다. */
export interface RecentSearchItem extends SearchResultItem {
  /** 검색 결과를 고른 시각(ISO 문자열) */
  searchedAt: string;
}

