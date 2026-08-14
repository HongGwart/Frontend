import { FC } from 'react';
import { SvgProps } from 'react-native-svg';
import { CategoryKey } from './categoryChips';
import { DUMMY_FACILITY_IMAGES } from './dummyFacilityInfo';

export interface DummyMapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label?: string;
  favorite?: boolean;
  /** FacilityInfoCard(outside)에 넘길 건물명/설명. label이 "동" 코드라면 이건 정식 명칭. */
  buildingName: string;
  description: string;
  /** 건물 사진 2장. 아직 등록 안 된 건물은 생략하면 FacilityInfoCard에서 이미지 영역 자체가 빠진다. */
  images?: [FC<SvgProps>, FC<SvgProps>];
}

// 실제 건물 좌표 연동 전까지 지도 마커 UI 확인용으로 쓰는 더미 데이터.
// MapScreen의 initialCamera(37.5504, 126.9251) 주변에 흩어놓았다.
export const DUMMY_MAP_MARKERS: DummyMapMarker[] = [
  {
    id: 'm1',
    latitude: 37.5504,
    longitude: 126.9251,
    label: 'G동',
    buildingName: '학생회관',
    description: '학생 복지 시설 및 동아리방',
    images: DUMMY_FACILITY_IMAGES,
  },
  {
    id: 'm2',
    latitude: 37.5512,
    longitude: 126.9243,
    label: 'H동',
    favorite: true,
    buildingName: '중앙도서관',
    description: '열람실 및 자료실',
    images: DUMMY_FACILITY_IMAGES,
  },
  {
    id: 'm3',
    latitude: 37.5498,
    longitude: 126.9262,
    label: 'I동',
    buildingName: '과학관',
    description: '자연과학대학 강의실 및 실습실',
    images: DUMMY_FACILITY_IMAGES,
  },
  {
    id: 'm4',
    latitude: 37.5509,
    longitude: 126.9268,
    label: 'S동',
    favorite: true,
    buildingName: '학생회관',
    description: '학생 복지 시설 및 동아리방',
    images: DUMMY_FACILITY_IMAGES,
  },
  {
    id: 'm5',
    latitude: 37.5493,
    longitude: 126.9245,
    label: 'E동',
    buildingName: '공학관',
    description: '공과대학 전공 강의실 및 실습실',
    // 일부러 이미지를 안 넣어서 "사진 미등록 건물" 케이스를 확인할 수 있게 했다.
  },
];

export interface DummyCategoryMarker {
  id: string;
  latitude: number;
  longitude: number;
  category: Exclude<CategoryKey, 'favorite'>;
  favorite?: boolean;
  count?: number;
  /** FacilityInfoCard(facility)에 넘길 정보. room이 카드 제목(facilityName)으로 쓰인다. */
  buildingCode: string;
  buildingName: string;
  room: string;
  description: string;
  /** 시설 사진 2장. 생략하면 이미지 영역 없이 카드가 뜬다. */
  images?: [FC<SvgProps>, FC<SvgProps>];
}

// 카테고리 칩(CategoryChipList)을 눌렀을 때 지도에 뿌려줄 카테고리 마커 더미 데이터.
// 마찬가지로 initialCamera(37.5504, 126.9251) 주변에 대충 흩어놓았다.
export const DUMMY_CATEGORY_MARKERS: DummyCategoryMarker[] = [
  {
    id: 'c1',
    latitude: 37.5507,
    longitude: 126.9255,
    category: 'readingRoom',
    buildingCode: 'H동',
    buildingName: '중앙도서관',
    room: '열람실 1',
    description: '조용히 공부할 수 있는 개인 열람실',
  },
  {
    id: 'c2',
    latitude: 37.5501,
    longitude: 126.9248,
    category: 'readingRoom',
    favorite: true,
    buildingCode: 'H동',
    buildingName: '중앙도서관',
    room: '열람실 2',
    description: '조용히 공부할 수 있는 개인 열람실',
  },
  {
    id: 'c3',
    latitude: 37.5515,
    longitude: 126.9257,
    category: 'restaurant',
    buildingCode: 'G동',
    buildingName: '학생회관',
    room: '학생 식당',
    description: '학생 할인이 적용되는 교내 식당',
    images: DUMMY_FACILITY_IMAGES,
  },
  {
    id: 'c4',
    latitude: 37.5497,
    longitude: 126.9241,
    category: 'cafe',
    buildingCode: 'G동',
    buildingName: '학생회관',
    room: '카페',
    description: '교내 카페',
    images: DUMMY_FACILITY_IMAGES,
  },
  {
    id: 'c5',
    latitude: 37.5511,
    longitude: 126.9238,
    category: 'store',
    buildingCode: 'G동',
    buildingName: '학생회관',
    room: '편의점',
    description: '24시간 운영 편의점',
  },
  {
    id: 'c6',
    latitude: 37.5489,
    longitude: 126.9255,
    category: 'pcRoom',
    count: 8,
    buildingCode: 'E동',
    buildingName: '공학관',
    room: 'PC실',
    description: '실습용 컴퓨터실',
  },
  {
    id: 'c7',
    latitude: 37.5502,
    longitude: 126.9271,
    category: 'printer',
    buildingCode: 'E동',
    buildingName: '공학관',
    room: '프린터기',
    description: '학생증으로 이용 가능한 출력기',
  },
  {
    id: 'c8',
    latitude: 37.5518,
    longitude: 126.9247,
    category: 'bookReturn',
    buildingCode: 'H동',
    buildingName: '중앙도서관',
    room: '도서 반납기',
    description: '24시간 무인 도서 반납기',
  },
  {
    id: 'c9',
    latitude: 37.5492,
    longitude: 126.9264,
    category: 'smokingArea',
    buildingCode: 'G동',
    buildingName: '학생회관',
    room: '흡연 구역',
    description: '지정 흡연 구역',
  },
];
