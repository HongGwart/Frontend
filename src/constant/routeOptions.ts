import { FC } from 'react';
import { SvgProps } from 'react-native-svg';
import ClockIcon from '@assets/svgs/icons/clock.svg';
import UmbrellaIcon from '@assets/svgs/icons/umbrella.svg';
import StairsIcon from '@assets/svgs/icons/stairs.svg';

// 길찾기 화면 상단 경로 옵션 칩. Figma "chip_option" 3종(최단 경로/비 회피/계단 회피).
// mode는 길찾기 API(/routes)의 요청 파라미터 값과 그대로 맞춘 것 — "비 회피"는 서버에
// 별도 우천 회피 모드가 없어서, 실내 위주로 안내해주는 INDOOR_PREFERRED로 매핑했다
// (실내로만 다니면 결과적으로 비를 안 맞으니 UX 문구는 그대로 "비 회피"를 쓴다).
export type RouteOptionKey = 'shortest' | 'avoidRain' | 'avoidStairs';
export type RouteApiMode = 'SHORTEST' | 'INDOOR_PREFERRED' | 'STAIR_AVOIDANCE';

interface RouteOptionConfig {
  key: RouteOptionKey;
  label: string;
  icon: FC<SvgProps>;
  mode: RouteApiMode;
}

export const ROUTE_OPTIONS: RouteOptionConfig[] = [
  { key: 'shortest', label: '최단 경로', icon: ClockIcon, mode: 'SHORTEST' },
  { key: 'avoidRain', label: '비 회피', icon: UmbrellaIcon, mode: 'INDOOR_PREFERRED' },
  { key: 'avoidStairs', label: '계단 회피', icon: StairsIcon, mode: 'STAIR_AVOIDANCE' },
];
