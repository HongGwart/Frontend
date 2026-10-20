import { useBuilding } from '@api/generated/honggwart';
import { USE_MOCK_API } from '@api/config';

export function useBuildingNodeId(buildingCode: string | undefined) {
  const { data } = useBuilding(buildingCode?.replace(/동$/, '') ?? '', {
    query: { enabled: !USE_MOCK_API && !!buildingCode, staleTime: 60_000, meta: { silent: true } },
  });
  return !USE_MOCK_API ? data?.nodeId : undefined;
}
