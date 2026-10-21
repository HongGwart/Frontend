import { useMemo } from 'react';
import { useBuilding } from '@api/generated/honggwart';
import { BUILDING_DETAILS_AS_OF, getBuildingDetail } from '@constant/buildingDetails';
import { CAMPUS_BUILDINGS } from '@constant/campusBuildings';
import { useNow } from '@hooks/useNow';
import { getOperatingStatus, parseOperatingHoursText } from '@utils/operatingHours';

/** 앱 건물 코드("R동") → 서버 건물 코드("R"). 서버는 둘 다 받지만 경로에 한글을 넣지 않으려고 뗀다. */
const toServerCode = (buildingCode: string) => buildingCode.replace(/동$/, '');

/**
 * 건물 상세·건물 카드에 보여줄 건물 정보. 소개·주 출입구·운영 시간은 서버 건물 정보(GET /api/buildings/{code})를
 * 쓴다. 서버에 없는 항목은 그 줄이 빠진다. 사진·운영 시간 메모·편의시설 개수는 서버 범위가 아니라, 팀이 확인해서
 * 앱에 넣어 둔 값(constant/buildingDetails)이 있을 때만 보인다.
 * 운영 상태는 지금 시각으로 계산해 1분마다 갱신된다.
 */
export function useBuildingDetail(buildingCode: string | undefined) {
  const now = useNow();
  const marker = useMemo(() => CAMPUS_BUILDINGS.find(item => item.label === buildingCode), [buildingCode]);
  const local = buildingCode ? getBuildingDetail(buildingCode) : undefined;

  const { data: server } = useBuilding(toServerCode(buildingCode ?? ''), {
    // 건물 정보는 거의 안 바뀐다. 서버에 없는 건물(404)이면 그 줄들이 빠질 뿐이라 토스트는 띄우지 않는다.
    query: { enabled: !!buildingCode, staleTime: Infinity, meta: { silent: true } },
  });

  const hours = parseOperatingHoursText(server?.operatingHoursText);

  return {
    description: server?.introduction ?? local?.description ?? marker?.description,
    images: local?.photos ?? marker?.images,
    operatingHours: hours ? getOperatingStatus(hours, now) : undefined,
    hoursNote: local?.hoursNote,
    facilityCounts: local?.facilityCounts,
    mainEntrance: server?.mainEntranceText ?? undefined,
    asOf: local ? BUILDING_DETAILS_AS_OF : null,
  };
}
