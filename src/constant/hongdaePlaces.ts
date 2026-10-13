import { PhotoSource } from '@appTypes/photo';
import { everyDay, OperatingHours } from '@utils/operatingHours';
import { toPlaceKey } from '@utils/placeKey';
import type { FavoriteInput } from '@hooks/useFavorites';
import { DUMMY_FACILITY_IMAGES } from './dummyFacilityInfo';

// 주변상권(HongdaeScreen) 카테고리 칩. Figma "All / 식당 / 술집".
export type HongdaeCategory = 'restaurant' | 'bar';

/**
 * 주변상권 장소 하나. 나중에 서버 API도 이 모양으로 받는다(useHongdaePlaces가 출처를 바꾼다).
 * 운영 상태 문구("운영 중" 등)는 들고 있지 않고 hours로 지금 시각에 계산한다(utils/operatingHours).
 */
export interface HongdaePlace {
  id: string;
  name: string;
  category: HongdaeCategory;
  /** 주소 앞부분(예: "서울 마포구")과 동(예: "서교동"). 목록 카드에 두 덩어리로 보인다 */
  district: string;
  neighborhood: string;
  /** 상세 화면에서 위치 자리에 보여주는 한 줄 소개. 확인할 수 없는 평가·홍보 문구는 넣지 않는다 */
  tagline?: string;
  /** 상세 화면 지도에 마커를 찍을 좌표 */
  latitude: number;
  longitude: number;
  hours: OperatingHours;
  /** 직접 찍었거나 사용 허락을 받은 사진만. 두 장이면 상세 카드에 나란히 보인다 */
  photos?: [PhotoSource, PhotoSource];
}

/**
 * 아래 정보를 실제로 확인한 날짜("YYYY-MM-DD"). 화면에 "○월 기준" 안내로 보인다.
 * TODO: 팀이 확인한 실제 정보(docs/data-templates)로 바꾸면서 날짜를 채운다. null이면 안내를 띄우지 않는다.
 */
export const HONGDAE_PLACES_AS_OF: string | null = null;

// TODO: 아직 Figma "주변상권"(773:3725)에 있던 더미 4곳 그대로다. 실제 확인한 정보로 바꾼다.
export const HONGDAE_PLACES: HongdaePlace[] = [
  {
    id: 'hongdae-1',
    name: '카미야',
    category: 'restaurant',
    district: '서울 마포구',
    neighborhood: '서교동',
    tagline: '생활의 달인이 극찬한 홍대 골목 돈가스 맛집',
    latitude: 37.5512,
    longitude: 126.9236,
    hours: everyDay('08:00', '22:00'),
    photos: DUMMY_FACILITY_IMAGES,
  },
  {
    id: 'hongdae-2',
    name: '율촌',
    category: 'restaurant',
    district: '서울 마포구',
    neighborhood: '서교동',
    tagline: '진한 짜장 소스가 일품인 중식당',
    latitude: 37.5539,
    longitude: 126.9221,
    hours: everyDay('08:00', '22:00'),
    photos: DUMMY_FACILITY_IMAGES,
  },
  {
    id: 'hongdae-3',
    name: '발바리네',
    category: 'restaurant',
    district: '서울 마포구',
    neighborhood: '서교동',
    tagline: '매콤한 낙지볶음으로 유명한 홍대 맛집',
    latitude: 37.5528,
    longitude: 126.9268,
    hours: everyDay('08:00', '19:00'),
    photos: DUMMY_FACILITY_IMAGES,
  },
  {
    id: 'hongdae-4',
    name: '식스티즈',
    category: 'bar',
    district: '서울 마포구',
    neighborhood: '서교동',
    tagline: '레트로 감성 가득한 홍대 인기 술집',
    latitude: 37.5546,
    longitude: 126.9245,
    hours: everyDay('08:30', '19:00'),
    photos: DUMMY_FACILITY_IMAGES,
  },
];

/**
 * 주변상권 장소를 즐겨찾기로 저장할 값. 캠퍼스 건물이 아니라서 동 코드 자리에 주소 앞부분("서울 마포구")을,
 * 건물명 자리에 동("서교동")을 넣는다 — 마이페이지 즐겨찾기 카드에 그대로 "서울 마포구 서교동"으로 보인다.
 */
export function hongdaeFavoriteInput(place: HongdaePlace): FavoriteInput {
  return {
    buildingCode: place.district,
    buildingName: place.neighborhood,
    name: place.name,
    // 즐겨찾기 아이콘용. 술집 아이콘이 따로 없어서 식당 아이콘을 쓴다.
    category: 'restaurant',
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

/** 즐겨찾기 장소 키로 주변상권 장소를 찾는다. 마이페이지에서 누르면 캠퍼스 지도 대신 주변상권 상세로 연다 */
export function findHongdaePlaceByKey(placeKey: string): HongdaePlace | undefined {
  return HONGDAE_PLACES.find(place => toPlaceKey(place.district, place.name) === placeKey);
}
