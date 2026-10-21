import { FC } from 'react';
import { SvgProps } from 'react-native-svg';
import PrinterIcon from '@assets/svgs/icons/printer.svg';
import PcIcon from '@assets/svgs/icons/pc.svg';
import { FacilityCountItem } from '@components/common/FacilityInfoCard';

// FacilityInfoCard(outside/inside)를 실제 건물 데이터 연동 전까지 확인용으로 채우는 더미 값(목 모드에서만 보인다).
// printer.svg(원본 20x18)/pc.svg(원본 20x20) 비율을 유지한 채 Figma 실제 크기(약 17px)에 맞춘 값.
export const DUMMY_FACILITY_COUNTS: FacilityCountItem[] = [
  { icon: PrinterIcon, iconWidth: 17, iconHeight: 15, label: '프린터', count: 2 },
  { icon: PcIcon, iconWidth: 17, iconHeight: 17, label: 'PC실', count: 1 },
];

export const DUMMY_MAIN_ENTRANCE = '정문(1층), 후문(지하 1층)';
