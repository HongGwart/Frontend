import BookIcon from '@assets/svgs/icons/book.svg';
import BuildingIcon from '@assets/svgs/icons/building.svg';
import PcIcon from '@assets/svgs/icons/pc.svg';
import { FacilityListSheetItem } from '@components/common/FacilityListSheet';
import { DUMMY_FACILITY_IMAGES } from './dummyFacilityInfo';

// 숫자 배지가 붙은(군집된) 마커를 탭했을 때 보여줄 "건물/시설 리스트" 더미 데이터.
// 마커 id 기준으로 그 자리에 겹쳐 있는 건물/시설 항목들을 묶어뒀다.
export const DUMMY_FACILITY_LIST_ITEMS: Record<string, FacilityListSheetItem[]> = {
  // m3: I동, count 2 (DUMMY_MAP_MARKERS)
  m3: [
    {
      id: 'm3-1',
      icon: BookIcon,
      iconWidth: 14,
      iconHeight: 16,
      building: 'I동',
      place: '과학관',
      room: '305호',
      description: '자연과학대학 전공 강의실',
    },
    {
      id: 'm3-2',
      icon: BookIcon,
      iconWidth: 14,
      iconHeight: 16,
      building: 'I동',
      place: '과학관',
      room: '실습실 2',
      description: '자연과학대학 실습실',
      images: DUMMY_FACILITY_IMAGES,
    },
  ],
  // m4: S동, count 3 (DUMMY_MAP_MARKERS)
  m4: [
    {
      id: 'm4-1',
      icon: BuildingIcon,
      iconWidth: 15,
      iconHeight: 16,
      emphasized: true,
      building: 'S동',
      place: '학생회관',
      description: '학생 복지 시설 및 동아리방',
    },
    {
      id: 'm4-2',
      icon: BookIcon,
      iconWidth: 14,
      iconHeight: 16,
      building: 'S동',
      place: '학생회관',
      room: '동아리방 3',
      description: '등록된 동아리 전용 공간',
      images: DUMMY_FACILITY_IMAGES,
    },
    {
      id: 'm4-3',
      icon: BookIcon,
      iconWidth: 14,
      iconHeight: 16,
      building: 'S동',
      place: '학생회관',
      room: '회의실',
      description: '사전 예약 후 이용 가능한 회의실',
    },
  ],
  // c6: 공학관 PC실, count 2 (DUMMY_CATEGORY_MARKERS)
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
  ],
};
