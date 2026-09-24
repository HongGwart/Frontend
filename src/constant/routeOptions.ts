import { FC } from 'react';
import { SvgProps } from 'react-native-svg';
import ClockIcon from '@assets/svgs/icons/clock.svg';
import UmbrellaIcon from '@assets/svgs/icons/umbrella.svg';
import StairsIcon from '@assets/svgs/icons/stairs.svg';

// 길찾기 화면 상단 경로 옵션 칩. Figma "chip_option" 3종(최단 경로/비 회피/계단 회피).
export type RouteOptionKey = 'shortest' | 'avoidRain' | 'avoidStairs';

interface RouteOptionConfig {
  key: RouteOptionKey;
  label: string;
  icon: FC<SvgProps>;
}

export const ROUTE_OPTIONS: RouteOptionConfig[] = [
  { key: 'shortest', label: '최단 경로', icon: ClockIcon },
  { key: 'avoidRain', label: '비 회피', icon: UmbrellaIcon },
  { key: 'avoidStairs', label: '계단 회피', icon: StairsIcon },
];
