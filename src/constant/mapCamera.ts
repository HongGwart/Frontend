// 캠퍼스 지도(MapScreen)와 검색 화면 지도 모드(SearchScreen)가 공유하는 카메라 줌 제한.
// 너무 축소하면 캠퍼스 지도라는 용도를 벗어나 도시/국가 단위까지 빠져나가고, 너무
// 확대하면 건물 단위 이상으로는 보여줄 지도 데이터가 없어서 둘 다 막아둔다.
export const MAP_MIN_ZOOM = 14;
export const MAP_MAX_ZOOM = 21;

// 지도 카메라 중심이 움직일 수 있는 영역(NaverMapView extent). 캠퍼스 건물·평면도가 모두 들어오는 범위
// (위도 37.5488~37.5531, 경도 126.9238~126.9276)에 사방 150m쯤 여유를 둔 사각형이다. Region은 남서쪽
// 모서리(latitude/longitude)에서 북동쪽으로 delta만큼 뻗는다.
const CAMPUS_SOUTH = 37.5475;
const CAMPUS_NORTH = 37.5545;
const CAMPUS_WEST = 126.920;
const CAMPUS_EAST = 126.9295;
export const CAMPUS_EXTENT = {
  latitude: CAMPUS_SOUTH,
  longitude: CAMPUS_WEST,
  latitudeDelta: CAMPUS_NORTH - CAMPUS_SOUTH,
  longitudeDelta: CAMPUS_EAST - CAMPUS_WEST,
};
