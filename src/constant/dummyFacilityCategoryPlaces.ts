import RestaurantIcon from '@assets/svgs/icons/restaurant.svg';
import CafeIcon from '@assets/svgs/icons/cafe.svg';
import StoreIcon from '@assets/svgs/icons/store.svg';
import BookIcon from '@assets/svgs/icons/book.svg';
import PcIcon from '@assets/svgs/icons/pc.svg';
import PrinterIcon from '@assets/svgs/icons/printer.svg';
import BookReturnIcon from '@assets/svgs/icons/bookReturn.svg';
import SmokeIcon from '@assets/svgs/icons/smoke.svg';
import EtcIcon from '@assets/svgs/icons/etc.svg';
import DummyImage1 from '@assets/svgs/dummy/T_dummy1.svg';
import DummyImage2 from '@assets/svgs/dummy/T_dummy2.svg';
import { FacilityCategoryId } from '@navigation/types';
import { FavoritePlace } from './dummyMypage';

// 편의시설 카테고리(FacilityScreen)에서 카테고리를 탭했을 때 보여줄 장소 목록.
// 실제 API 연동 전까지 쓰는 더미 데이터. FavoritePlace와 같은 모양을 그대로 쓴다
// (Figma "facility category_list"가 마이페이지 즐겨찾기 카드와 같은 컴포넌트라서).
// 카페는 Figma "편의시설_카페"(719:1582)의 4개 항목을 그대로 담았다.
export const DUMMY_FACILITY_CATEGORY_PLACES: Record<FacilityCategoryId, FavoritePlace[]> = {
  restaurant: [
    {
      id: 'restaurant-1',
      name: '학생식당',
      buildingCode: 'H동',
      buildingName: '중앙도서관',
      locationDetail: '지하 1층',
      icon: RestaurantIcon,
      isOpen: true,
      statusText: '운영 중',
      hours: '11:00 - 14:00',
    },
    {
      id: 'restaurant-2',
      name: '교직원식당',
      buildingCode: 'R동',
      buildingName: '홍문관',
      locationDetail: '2층',
      icon: RestaurantIcon,
      isOpen: false,
      statusText: '운영 종료',
      hours: '11:30 - 13:30',
    },
  ],
  cafe: [
    {
      id: 'cafe-1',
      name: '카페나무',
      buildingCode: 'R동',
      buildingName: '홍문관',
      locationDetail: '로비층',
      photo: DummyImage1,
      isOpen: true,
      statusText: '운영 중',
      hours: '08:00 - 22:00',
    },
    {
      id: 'cafe-2',
      name: '카페드림',
      buildingCode: 'A동',
      buildingName: '인문사회관',
      locationDetail: '1층',
      photo: DummyImage1,
      isOpen: true,
      statusText: '운영 중',
      hours: '08:00 - 22:00',
    },
    {
      id: 'cafe-3',
      name: '카페아이엔지',
      buildingCode: 'H동',
      buildingName: '중앙도서관',
      locationDetail: '3층',
      photo: DummyImage2,
      isOpen: false,
      statusText: '운영 종료',
      hours: '10:00 - 19:00',
    },
    {
      id: 'cafe-4',
      name: '카페나무',
      buildingCode: 'L동',
      buildingName: '와우관',
      locationDetail: '4층',
      icon: CafeIcon,
      isOpen: false,
      statusText: '운영 종료',
      hours: '08:30 - 19:00',
    },
  ],
  store: [
    {
      id: 'store-1',
      name: 'GS25 학내점',
      buildingCode: 'A동',
      buildingName: '인문사회관',
      locationDetail: '1층',
      icon: StoreIcon,
      isOpen: true,
      statusText: '운영 중',
      hours: '00:00 - 24:00',
    },
  ],
  readingRoom: [
    {
      id: 'readingRoom-1',
      name: '제1열람실',
      buildingCode: 'H동',
      buildingName: '중앙도서관',
      locationDetail: '2층',
      icon: BookIcon,
      isOpen: true,
      statusText: '운영 중',
      hours: '06:00 - 24:00',
    },
    {
      id: 'readingRoom-2',
      name: '제2열람실',
      buildingCode: 'H동',
      buildingName: '중앙도서관',
      locationDetail: '3층',
      icon: BookIcon,
      isOpen: true,
      statusText: '운영 중',
      hours: '06:00 - 24:00',
    },
  ],
  pc: [
    {
      id: 'pc-1',
      name: '공학관 PC실',
      buildingCode: 'E동',
      buildingName: '공학관',
      locationDetail: '2층',
      icon: PcIcon,
      isOpen: true,
      statusText: '운영 중',
      hours: '09:00 - 22:00',
    },
  ],
  printer: [
    {
      id: 'printer-1',
      name: '중앙도서관 프린터기',
      buildingCode: 'H동',
      buildingName: '중앙도서관',
      locationDetail: '1층',
      icon: PrinterIcon,
      isOpen: true,
      statusText: '운영 중',
      hours: '09:00 - 21:00',
    },
  ],
  bookReturn: [
    {
      id: 'bookReturn-1',
      name: '도서 반납기',
      buildingCode: 'H동',
      buildingName: '중앙도서관',
      locationDetail: '정문 앞',
      icon: BookReturnIcon,
      isOpen: true,
      statusText: '운영 중',
      hours: '00:00 - 24:00',
    },
  ],
  smokingArea: [
    {
      id: 'smokingArea-1',
      name: '흡연 구역',
      buildingCode: 'E동',
      buildingName: '공학관',
      locationDetail: '건물 뒤편',
      icon: SmokeIcon,
      isOpen: true,
      statusText: '운영 중',
      hours: '00:00 - 24:00',
    },
  ],
  etc: [
    {
      id: 'etc-1',
      name: '정수기',
      buildingCode: 'R동',
      buildingName: '홍문관',
      locationDetail: '3층',
      icon: EtcIcon,
      isOpen: true,
      statusText: '운영 중',
      hours: '00:00 - 24:00',
    },
  ],
};
