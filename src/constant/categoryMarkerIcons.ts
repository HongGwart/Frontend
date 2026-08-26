import { FC } from 'react';
import { SvgProps } from 'react-native-svg';
import BookIcon from '@assets/svgs/icons/book.svg';
import ClassroomIcon from '@assets/svgs/icons/classroom.svg';
import RestaurantIcon from '@assets/svgs/icons/restaurant.svg';
import CafeIcon from '@assets/svgs/icons/cafe.svg';
import StoreIcon from '@assets/svgs/icons/store.svg';
import PcIcon from '@assets/svgs/icons/pc.svg';
import PrinterIcon from '@assets/svgs/icons/printer.svg';
import BookReturnIcon from '@assets/svgs/icons/bookReturn.svg';
import SmokeIcon from '@assets/svgs/icons/smoke.svg';
import { CategoryKey } from './categoryChips';

interface CategoryMarkerIconSpec {
  icon: FC<SvgProps>;
  iconWidth: number;
  iconHeight: number;
  iconOffsetY?: number;
}

// CategoryMarker(지도 위 원형 카테고리 마커, Figma "facility" 707:908)의 24px 아이콘 슬롯에 맞춘
// 크기. CATEGORY_CHIPS와 같은 아이콘을 재사용하되 슬롯이 16px -> 24px로 커진 만큼 비율만 키웠다.
// "즐겨찾기"는 시설 종류가 아니라 상태(별 배지)라서 여기엔 없다 - CategoryMarker의 favorite prop으로 표현한다.
export const CATEGORY_MARKER_ICONS: Record<Exclude<CategoryKey, 'favorite'>, CategoryMarkerIconSpec> = {
  readingRoom: { icon: BookIcon, iconWidth: 16, iconHeight: 18 },
  classroom: { icon: ClassroomIcon, iconWidth: 19, iconHeight: 21 },
  restaurant: { icon: RestaurantIcon, iconWidth: 15, iconHeight: 19 },
  cafe: { icon: CafeIcon, iconWidth: 19, iconHeight: 18 },
  store: { icon: StoreIcon, iconWidth: 19, iconHeight: 18 },
  pcRoom: { icon: PcIcon, iconWidth: 19, iconHeight: 19 },
  printer: { icon: PrinterIcon, iconWidth: 19, iconHeight: 17 },
  bookReturn: { icon: BookReturnIcon, iconWidth: 17, iconHeight: 19 },
  // 다른 아이콘들과 달리 유독 아래로 치우쳐 보여서 살짝 위로 보정.
  smokingArea: { icon: SmokeIcon, iconWidth: 19, iconHeight: 18, iconOffsetY: -2 },
};
