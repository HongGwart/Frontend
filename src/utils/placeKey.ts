/**
 * 장소 고유 키. 같은 장소라도 화면마다 더미 id가 달라서(지도 마커 "dong-C", 검색 결과 "s1", 즐겨찾기 "fav-1"),
 * 즐겨찾기/최근 검색어처럼 여러 화면이 같이 보는 로컬 저장 데이터는 이 키로 장소를 식별한다.
 * 건물 자체는 "C동", 건물 안 시설/호실은 "C동/816호"처럼 동 코드 + 세부 이름으로 만든다.
 * 실제 장소 API가 붙으면 서버의 장소 id로 바꾼다.
 */
export function toPlaceKey(buildingCode: string, detail?: string): string {
  const building = buildingCode.trim();
  const rest = detail?.trim();
  return rest ? `${building}/${rest}` : building;
}
