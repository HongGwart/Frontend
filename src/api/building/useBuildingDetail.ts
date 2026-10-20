import { useMemo } from 'react';
import { useBuilding } from '@api/generated/honggwart';
import { USE_MOCK_API } from '@api/config';
import { BUILDING_DETAILS_AS_OF, getBuildingDetail } from '@constant/buildingDetails';
import { DUMMY_MAP_MARKERS } from '@constant/dummyMapMarkers';
import { SEARCH_ITEM_ICONS } from '@constant/dummySearchData';
import { useNow } from '@hooks/useNow';
import { getOperatingStatus } from '@utils/operatingHours';

/** 소개·출입구·운영시간 원문은 서버에서 읽고, 사진만 기존 앱 자산을 사용한다. */
export function useBuildingDetail(buildingCode: string | undefined) {
  const now = useNow();
  const marker = useMemo(() => DUMMY_MAP_MARKERS.find(item => item.label === buildingCode), [buildingCode]);
  const local = buildingCode ? getBuildingDetail(buildingCode) : undefined;
  const { data } = useBuilding(buildingCode?.replace(/동$/, '') ?? '', {
    query: { enabled: !USE_MOCK_API && !!buildingCode, staleTime: 60_000, meta: { silent: true } },
  });
  return {
    nodeId: data?.nodeId,
    placeId: data?.placeId,
    name: data?.name ?? marker?.buildingName,
    description: USE_MOCK_API ? local?.description ?? marker?.description : data?.introduction ?? undefined,
    images: local?.photos ?? marker?.images,
    operatingHours: USE_MOCK_API && local?.hours ? getOperatingStatus(local.hours, now) : undefined,
    operatingHoursText: !USE_MOCK_API ? data?.operatingHoursText ?? undefined : undefined,
    hoursNote: USE_MOCK_API ? local?.hoursNote : undefined,
    facilityCounts: USE_MOCK_API ? local?.facilityCounts : data?.facilityCounts?.map(item => ({
      icon: SEARCH_ITEM_ICONS.place.icon, label: item.category, count: item.count,
    })),
    mainEntrance: !USE_MOCK_API ? data?.mainEntranceText ?? undefined : undefined,
    asOf: USE_MOCK_API ? BUILDING_DETAILS_AS_OF : undefined,
  };
}
