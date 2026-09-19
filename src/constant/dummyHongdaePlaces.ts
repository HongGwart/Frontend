import DummyImage1 from '@assets/svgs/dummy/T_dummy1.svg';
import DummyImage2 from '@assets/svgs/dummy/T_dummy2.svg';
import { FavoritePlace } from './dummyMypage';

// 주변상권(HongdaeScreen) 카테고리 칩. Figma "All / 식당 / 술집".
export type HongdaeCategory = 'restaurant' | 'bar';

export interface HongdaePlace extends FavoritePlace {
  category: HongdaeCategory;
  /** 상세 화면(HongdaeScreen 상세)에서 위치 자리에 대신 보여주는 한 줄 소개. Figma "생활의 달인이 극찬한..." */
  tagline: string;
  /** 상세 화면 지도 배경(NaverMapView)에 마커를 찍을 좌표. 홍익대 서울캠퍼스(MapScreen 기본 카메라) 주변 값. */
  latitude: number;
  longitude: number;
}

// 실제 API(홍대 인근 상권 데이터) 연동 전까지 쓰는 더미 데이터.
// Figma "주변상권"(773:3725) 리스트 4개를 그대로 담았다.
export const DUMMY_HONGDAE_PLACES: HongdaePlace[] = [
  {
    id: 'hongdae-1',
    name: '카미야',
    buildingCode: '서울 마포구',
    buildingName: '서교동',
    photo: DummyImage1,
    isOpen: true,
    statusText: '운영 중',
    hours: '08:00 - 22:00',
    category: 'restaurant',
    tagline: '생활의 달인이 극찬한 홍대 골목 돈가스 맛집',
    latitude: 37.5512,
    longitude: 126.9236,
  },
  {
    id: 'hongdae-2',
    name: '율촌',
    buildingCode: '서울 마포구',
    buildingName: '서교동',
    photo: DummyImage2,
    isOpen: true,
    statusText: '운영 중',
    hours: '08:00 - 22:00',
    category: 'restaurant',
    tagline: '진한 짜장 소스가 일품인 중식당',
    latitude: 37.5539,
    longitude: 126.9221,
  },
  {
    id: 'hongdae-3',
    name: '발바리네',
    buildingCode: '서울 마포구',
    buildingName: '서교동',
    photo: DummyImage1,
    isOpen: false,
    statusText: '운영 종료',
    hours: '08:00 - 19:00',
    category: 'restaurant',
    tagline: '매콤한 낙지볶음으로 유명한 홍대 맛집',
    latitude: 37.5528,
    longitude: 126.9268,
  },
  {
    id: 'hongdae-4',
    name: '식스티즈',
    buildingCode: '서울 마포구',
    buildingName: '서교동',
    photo: DummyImage2,
    isOpen: false,
    statusText: '운영 종료',
    hours: '08:30 - 19:00',
    category: 'bar',
    tagline: '레트로 감성 가득한 홍대 인기 술집',
    latitude: 37.5546,
    longitude: 126.9245,
  },
];
