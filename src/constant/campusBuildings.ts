import { PhotoSource } from '@appTypes/photo';

/** 캠퍼스 건물(동) 하나 — 지도 동 마커·건물 카드·건물 상세의 기준 데이터. */
export interface CampusBuilding {
  id: string;
  latitude: number;
  longitude: number;
  label?: string;
  /** FacilityInfoCard(outside)에 넘길 건물명/설명. label이 "동" 코드라면 이건 정식 명칭. */
  buildingName: string;
  description: string;
  /** 건물 사진 2장. 확인된 사진이 없으면 생략한다(카드는 건물 아이콘 기본 이미지를 보여준다). */
  images?: [PhotoSource, PhotoSource];
}

// 캠퍼스 건물 목록. 좌표는 개발용 좌표 찍기 모드(DevBuildingPinPicker)로 지도에서 각 동 건물의 가운데를
// 직접 탭해 모은 실제 값이다(M동은 아직 위치 미확인이라 빠져 있다). 건물명은 서버 건물 정보(GET /api/buildings/{code})의
// name과 같다. 설명은 서버 소개가 오기 전에 잠깐 보이는 한 줄 요약이다. 즐겨찾기 여부는 기기 로컬 저장(useFavorites)으로 관리한다.
// TODO: 서버에 건물 목록 API(코드·이름·대표 좌표·nodeId)가 생기면 이 목록을 서버 데이터로 바꾼다(#34).
export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  {
    id: 'dong-A',
    latitude: 37.5495989,
    longitude: 126.9259961,
    label: 'A동',
    buildingName: '인문사회관',
    description: '경영대학 강의실·연구실',
  },
  {
    id: 'dong-B',
    latitude: 37.5500673,
    longitude: 126.9260152,
    label: 'B동',
    buildingName: '인문사회관',
    description: '경영대학 강의실',
  },
  {
    id: 'dong-C',
    latitude: 37.5491788,
    longitude: 126.9260893,
    label: 'C동',
    buildingName: '인문사회관',
    description: '문과대·사범대·경제학부 강의실',
  },
  {
    id: 'dong-D',
    latitude: 37.5489452,
    longitude: 126.9261808,
    label: 'D동',
    buildingName: '인문사회관',
    description: '인문사회계열 공용 강의동',
  },
  {
    id: 'm5',
    latitude: 37.5503847,
    longitude: 126.9261913,
    label: 'E동',
    buildingName: '조형관',
    description: '미술대학(디자인) 실기실·강의실',
    // 일부러 이미지를 안 넣어서 "사진 미등록 건물" 케이스를 확인할 수 있게 했다.
  },
  {
    id: 'dong-F',
    latitude: 37.5507158,
    longitude: 126.9264165,
    label: 'F동',
    buildingName: '미술학관',
    description: '미술대학 실기실·작업실',
  },
  {
    id: 'm1',
    latitude: 37.5513301,
    longitude: 126.9262545,
    label: 'G동',
    buildingName: '학생회관',
    description: '동아리방, 식당, 학생 편의시설',
  },
  {
    id: 'm2',
    latitude: 37.5513065,
    longitude: 126.9267391,
    label: 'H동',
    buildingName: '중앙도서관',
    description: '열람실, 자료실',
  },
  {
    id: 'm3',
    latitude: 37.5514748,
    longitude: 126.9272532,
    label: 'I동',
    buildingName: '과학관',
    description: '공과대학 강의실·실험실 (기초과학 실험 포함)',
  },
  {
    id: 'dong-J',
    latitude: 37.5517221,
    longitude: 126.9270495,
    label: 'J동',
    buildingName: '제3공학관',
    description: '건축도시대학 설계실·강의실',
  },
  {
    id: 'dong-K',
    latitude: 37.5522035,
    longitude: 126.9261085,
    label: 'K동',
    buildingName: '제1공학관',
    description: '공과대학 전공 강의실·실험실',
  },
  {
    id: 'dong-L',
    latitude: 37.5516843,
    longitude: 126.9265629,
    label: 'L동',
    buildingName: '와우관',
    description: '건축도시대학 설계 스튜디오',
  },
  {
    id: 'dong-MH',
    latitude: 37.5507259,
    longitude: 126.9259828,
    label: 'MH동',
    buildingName: '문헌관',
    description: '행정 부서 (본부)',
  },
  {
    id: 'dong-P',
    latitude: 37.5511138,
    longitude: 126.9269791,
    label: 'P동',
    buildingName: '제2공학관',
    description: '공과대학 전공 강의실·실험실',
  },
  {
    id: 'dong-Q',
    latitude: 37.5509640,
    longitude: 126.9264263,
    label: 'Q동',
    buildingName: '정보통신센터',
    description: '전산실, 공용 PC 실습실',
  },
  {
    id: 'dong-R',
    latitude: 37.5525842,
    longitude: 126.9249050,
    label: 'R동',
    buildingName: '홍문관',
    description: '법과대학 강의실, 대형 강의실',
  },
  {
    id: 'm4',
    latitude: 37.5503172,
    longitude: 126.9251751,
    label: 'S동',
    buildingName: '강당',
    description: '입학식·행사·공연',
  },
  {
    id: 'dong-T',
    latitude: 37.5501214,
    longitude: 126.9246340,
    label: 'T동',
    buildingName: '제4공학관',
    description: '공과대학 전공 강의실·실습실',
  },
  {
    id: 'dong-U',
    latitude: 37.5502311,
    longitude: 126.9264696,
    label: 'U동',
    buildingName: '미술종합강의동',
    description: '미술대학 강의동',
  },
  {
    id: 'dong-Z1',
    latitude: 37.5505993,
    longitude: 126.9255562,
    label: 'Z1동',
    buildingName: '제1강의동',
    description: '공용 강의동',
  },
  {
    id: 'dong-Z2',
    latitude: 37.5496597,
    longitude: 126.9253491,
    label: 'Z2동',
    buildingName: '이천득관',
    description: '공용 강의동',
  },
  {
    id: 'dong-Z3',
    latitude: 37.5499332,
    longitude: 126.9246589,
    label: 'Z3동',
    buildingName: '제3강의동',
    description: '공용 강의동',
  },
];
