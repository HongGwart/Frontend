import PcIcon from '@assets/svgs/icons/pc.svg';
import { FacilityListSheetItem } from '@components/common/FacilityListSheet';
import { DUMMY_FACILITY_IMAGES } from './dummyFacilityInfo';

// 숫자 배지가 붙은(군집된) 마커를 탭했을 때 보여줄 "건물/시설 리스트" 더미 데이터.
// 마커 id 기준으로 그 자리에 겹쳐 있는 시설 항목들을 묶어뒀다.
// 동(건물) 마커는 한 지점 = 한 건물이라 군집 개념이 안 맞아서 숫자 배지/리스트를 안 쓴다.
// 여러 개가 겹칠 수 있는 건 카테고리(시설) 마커뿐이다.
export const DUMMY_FACILITY_LIST_ITEMS: Record<string, FacilityListSheetItem[]> = {
  // c6: 공학관 PC실, count 8 (DUMMY_CATEGORY_MARKERS) - 리스트 스크롤 확인용으로 넉넉히 넣어뒀다.
  c6: [
    {
      id: 'c6-1',
      icon: PcIcon,
      iconWidth: 16,
      iconHeight: 16,
      building: 'E동',
      place: '공학관',
      room: 'PC실 1',
      description: '실습용 컴퓨터실',
    },
    {
      id: 'c6-2',
      icon: PcIcon,
      iconWidth: 16,
      iconHeight: 16,
      building: 'E동',
      place: '공학관',
      room: 'PC실 2',
      description: '실습용 컴퓨터실',
      images: DUMMY_FACILITY_IMAGES,
    },
    {
      id: 'c6-3',
      icon: PcIcon,
      iconWidth: 16,
      iconHeight: 16,
      building: 'E동',
      place: '공학관',
      room: 'PC실 3',
      description: '실습용 컴퓨터실',
    },
    {
      id: 'c6-4',
      icon: PcIcon,
      iconWidth: 16,
      iconHeight: 16,
      building: 'E동',
      place: '공학관',
      room: 'PC실 4',
      description: '실습용 컴퓨터실',
      images: DUMMY_FACILITY_IMAGES,
    },
    {
      id: 'c6-5',
      icon: PcIcon,
      iconWidth: 16,
      iconHeight: 16,
      building: 'E동',
      place: '공학관',
      room: 'PC실 5',
      description: '실습용 컴퓨터실',
    },
    {
      id: 'c6-6',
      icon: PcIcon,
      iconWidth: 16,
      iconHeight: 16,
      building: 'E동',
      place: '공학관',
      room: 'PC실 6',
      description: '실습용 컴퓨터실',
      images: DUMMY_FACILITY_IMAGES,
    },
    {
      id: 'c6-7',
      icon: PcIcon,
      iconWidth: 16,
      iconHeight: 16,
      building: 'E동',
      place: '공학관',
      room: 'PC실 7',
      description: '실습용 컴퓨터실',
    },
    {
      id: 'c6-8',
      icon: PcIcon,
      iconWidth: 16,
      iconHeight: 16,
      building: 'E동',
      place: '공학관',
      room: 'PC실 8',
      description: '실습용 컴퓨터실',
      images: DUMMY_FACILITY_IMAGES,
    },
  ],
};
