export interface CampusBuilding {
  /** 화면 표시용 건물 이름 (동 표기 포함) */
  name: string;
  latitude: number;
  longitude: number;
}

// 네이버지도 장소 상세 페이지(map.naver.com/p/entry/place/{placeId}) API로 조회한 좌표.
// 건물이 추가되면 같은 방식으로 좌표를 조회해 이어서 채운다.
export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  { name: '인문사회관 B동', latitude: 37.5500521, longitude: 126.9259986 },
  { name: '문헌관', latitude: 37.5507183, longitude: 126.925985 },
  { name: '인문사회관 C동', latitude: 37.5491614, longitude: 126.926077 },
  { name: '제4공학관', latitude: 37.5501214, longitude: 126.9246358 },
  { name: '홍문관', latitude: 37.5527862, longitude: 126.9251219 },
  { name: '제1공학관', latitude: 37.5521527, longitude: 126.9261519 },
  { name: '와우관', latitude: 37.5516779, longitude: 126.9265702 },
  { name: '이천득관', latitude: 37.54964, longitude: 126.9253585 },
];
