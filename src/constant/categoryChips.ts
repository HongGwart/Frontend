import { FC } from 'react';
import { SvgProps } from 'react-native-svg';
import StarIcon from '@assets/svgs/icons/star.svg';
import BookIcon from '@assets/svgs/icons/book.svg';
import RestaurantIcon from '@assets/svgs/icons/restaurant.svg';
import CafeIcon from '@assets/svgs/icons/cafe.svg';
import StoreIcon from '@assets/svgs/icons/store.svg';
import PcIcon from '@assets/svgs/icons/pc.svg';
import PrinterIcon from '@assets/svgs/icons/printer.svg';
import BookReturnIcon from '@assets/svgs/icons/bookReturn.svg';
import SmokeIcon from '@assets/svgs/icons/smoke.svg';

export type CategoryKey =
  | 'favorite'
  | 'readingRoom'
  | 'restaurant'
  | 'cafe'
  | 'store'
  | 'pcRoom'
  | 'printer'
  | 'bookReturn'
  | 'smokingArea';

interface CategoryChipConfig {
  key: CategoryKey;
  label: string;
  icon: FC<SvgProps>;
  iconWidth: number;
  iconHeight: number;
}

// 아이콘별 원본 비율을 유지한 채 16px 안에 들어오도록 크기를 맞춘 값.
export const CATEGORY_CHIPS: CategoryChipConfig[] = [
  { key: 'favorite', label: '즐겨찾기', icon: StarIcon, iconWidth: 16, iconHeight: 16 },
  { key: 'readingRoom', label: '열람실', icon: BookIcon, iconWidth: 14, iconHeight: 16 },
  { key: 'restaurant', label: '식당', icon: RestaurantIcon, iconWidth: 13, iconHeight: 16 },
  { key: 'cafe', label: '카페', icon: CafeIcon, iconWidth: 16, iconHeight: 15 },
  { key: 'store', label: '편의점', icon: StoreIcon, iconWidth: 16, iconHeight: 15 },
  { key: 'pcRoom', label: 'PC실', icon: PcIcon, iconWidth: 16, iconHeight: 16 },
  { key: 'printer', label: '프린터기', icon: PrinterIcon, iconWidth: 16, iconHeight: 14 },
  { key: 'bookReturn', label: '도서 반납기', icon: BookReturnIcon, iconWidth: 14, iconHeight: 16 },
  { key: 'smokingArea', label: '흡연 구역', icon: SmokeIcon, iconWidth: 16, iconHeight: 15 },
];
