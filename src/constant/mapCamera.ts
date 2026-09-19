// 캠퍼스 지도(MapScreen)와 검색 화면 지도 모드(SearchScreen)가 공유하는 카메라 줌 제한.
// 너무 축소하면 캠퍼스 지도라는 용도를 벗어나 도시/국가 단위까지 빠져나가고, 너무
// 확대하면 건물 단위 이상으로는 보여줄 지도 데이터가 없어서 둘 다 막아둔다.
export const MAP_MIN_ZOOM = 14;
export const MAP_MAX_ZOOM = 19;
