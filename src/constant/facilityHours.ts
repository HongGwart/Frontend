import { toPlaceKey } from '@utils/placeKey';
import { everyDay, OperatingHours } from '@utils/operatingHours';
import { DUMMY_FACILITY_CATEGORY_PLACES } from './dummyFacilityCategoryPlaces';
import { DUMMY_FAVORITE_PLACES } from './dummyMypage';

/**
 * 시설(식당·카페·PC실 등)의 운영 시간을 건물 코드 + 시설 이름으로 찾는다. 편의시설 목록·즐겨찾기 장소 데이터에
 * 있으면 그 값을 쓴다. 지도 카테고리 카드, 건물 상세의 편의시설 칸처럼 장소 데이터가 따로 없는 곳도 같은 값을 보게 한다.
 * 서버에 시설 운영 시간이 생기면 여기서 바꾼다.
 */
const HOURS_BY_PLACE = new Map<string, OperatingHours>(
  [...DUMMY_FAVORITE_PLACES, ...Object.values(DUMMY_FACILITY_CATEGORY_PLACES).flat()].flatMap(place =>
    place.operatingHours ? [[toPlaceKey(place.buildingCode, place.name), place.operatingHours] as const] : [],
  ),
);

// TODO: 실제 시설 운영 시간을 채우면 이 예시 폴백을 지워서, 확인 안 된 시설은 운영 줄이 빠지게 한다(이전 더미와 같은 값).
const SAMPLE_FACILITY_HOURS = everyDay('08:00', '22:00');

export function getFacilityHours(buildingCode: string | undefined, name: string | undefined): OperatingHours | undefined {
  if (!buildingCode) return SAMPLE_FACILITY_HOURS;
  return HOURS_BY_PLACE.get(toPlaceKey(buildingCode, name)) ?? SAMPLE_FACILITY_HOURS;
}
