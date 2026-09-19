import { SvgProps } from 'react-native-svg';
import RestaurantIcon from '@assets/svgs/icons/restaurant.svg';
import CafeIcon from '@assets/svgs/icons/cafe.svg';
import StoreIcon from '@assets/svgs/icons/store.svg';
import BookIcon from '@assets/svgs/icons/book.svg';
import PcIcon from '@assets/svgs/icons/pc.svg';
import PrinterIcon from '@assets/svgs/icons/printer.svg';
import BookReturnIcon from '@assets/svgs/icons/bookReturn.svg';
import SmokeIcon from '@assets/svgs/icons/smoke.svg';
import EtcIcon from '@assets/svgs/icons/etc.svg';
import { FacilityCategoryId } from '@navigation/types';

export type { FacilityCategoryId };

export interface FacilityCategory {
  id: FacilityCategoryId;
  label: string;
  icon: React.FC<SvgProps>;
  /** 아이콘 원본 비율을 유지하면서 40px 박스 안에 맞춘 크기 */
  iconWidth: number;
  iconHeight: number;
}

// Figma "편의시설"(716:2973) 카테고리 그리드. 3열 x 3행, 순서 고정.
export const FACILITY_CATEGORIES: FacilityCategory[] = [
  { id: 'restaurant', label: '식당', icon: RestaurantIcon, iconWidth: 31.7, iconHeight: 40 },
  { id: 'cafe', label: '카페', icon: CafeIcon, iconWidth: 40, iconHeight: 37.9 },
  { id: 'store', label: '편의점', icon: StoreIcon, iconWidth: 40, iconHeight: 36.6 },
  { id: 'readingRoom', label: '열람실', icon: BookIcon, iconWidth: 36, iconHeight: 40 },
  { id: 'pc', label: 'PC실', icon: PcIcon, iconWidth: 40, iconHeight: 40 },
  { id: 'printer', label: '프린터기', icon: PrinterIcon, iconWidth: 40, iconHeight: 36 },
  { id: 'bookReturn', label: '도서 반납기', icon: BookReturnIcon, iconWidth: 36, iconHeight: 40 },
  { id: 'smokingArea', label: '흡연 구역', icon: SmokeIcon, iconWidth: 40, iconHeight: 38 },
  { id: 'etc', label: '기타', icon: EtcIcon, iconWidth: 40, iconHeight: 40 },
];
