import { useMemo } from 'react';
import { BUILDING_DETAILS_AS_OF, getBuildingDetail } from '@constant/buildingDetails';
import { DUMMY_MAIN_ENTRANCE } from '@constant/dummyFacilityInfo';
import { DUMMY_MAP_MARKERS } from '@constant/dummyMapMarkers';
import { useBuildingMainEntrance } from '@api/node/useBuildingNodeId';
import { useNow } from '@hooks/useNow';
import { getOperatingStatus } from '@utils/operatingHours';

/**
 * 건물 상세·건물 카드에 보여줄 건물 정보. 지금은 앱에 넣어 둔 확인된 정보(constant/buildingDetails)에 서버 장소
 * 상세의 주 출입구를 합친다. 서버에 건물 상세 API가 생기면 여기서만 바꾸고 화면은 그대로 둔다.
 * 운영 상태는 지금 시각으로 계산해 1분마다 갱신된다.
 */
export function useBuildingDetail(buildingCode: string | undefined) {
  const now = useNow();
  const mainEntrance = useBuildingMainEntrance(buildingCode, DUMMY_MAIN_ENTRANCE);
  const marker = useMemo(() => DUMMY_MAP_MARKERS.find(item => item.label === buildingCode), [buildingCode]);
  const detail = buildingCode ? getBuildingDetail(buildingCode) : undefined;

  return {
    description: detail?.description ?? marker?.description,
    images: detail?.photos ?? marker?.images,
    operatingHours: detail?.hours ? getOperatingStatus(detail.hours, now) : undefined,
    hoursNote: detail?.hoursNote,
    facilityCounts: detail?.facilityCounts,
    mainEntrance,
    asOf: BUILDING_DETAILS_AS_OF,
  };
}
