import { FC } from 'react';
import { SvgProps } from 'react-native-svg';
import DummyImage1 from '@assets/svgs/dummy/T_dummy1.svg';
import DummyImage2 from '@assets/svgs/dummy/T_dummy2.svg';
import PrinterIcon from '@assets/svgs/icons/printer.svg';
import PcIcon from '@assets/svgs/icons/pc.svg';
import { FacilityCountItem, OperatingHoursInfo } from '@components/common/FacilityInfoCard';

// FacilityInfoCard(outside/inside)를 실제 건물 데이터 연동 전까지 확인용으로 채우는 더미 값.
// 지금은 건물마다 다른 데이터가 없어서 모든 동 마커에 동일하게 재사용한다.
export const DUMMY_FACILITY_IMAGES: [FC<SvgProps>, FC<SvgProps>] = [DummyImage1, DummyImage2];

export const DUMMY_FACILITY_COUNTS: FacilityCountItem[] = [
  { icon: PrinterIcon, label: '프린터', count: 2 },
  { icon: PcIcon, label: 'PC실', count: 1 },
];

export const DUMMY_MAIN_ENTRANCE = '정문(1층), 후문(지하1층)';

export const DUMMY_OPERATING_HOURS: OperatingHoursInfo = {
  isOpen: true,
  statusText: '운영 중',
  detailText: '22:00에 운영 종료',
};
