import { useAutocomplete } from '@api/generated/honggwart';
import { USE_MOCK_API } from '@api/config';
import { useNodeDetail } from './useNodeDetail';

/**
 * 건물 코드("R동")로 서버의 건물 노드 id를 찾는다. 건물 상세처럼 건물 코드로만 열리는 화면이 장소 상세
 * (GET /api/nodes/{nodeId})를 부르려고 쓴다. 따로 조회 API가 없어서 자동완성에서 이름이 같은 건물(SYMBOLIC)을
 * 고른다. 서버에 아직 없는 건물이거나 목 모드면 undefined(화면은 더미 값을 쓴다).
 */
export function useBuildingNodeId(buildingCode: string | undefined) {
  const enabled = !USE_MOCK_API && !!buildingCode;
  const { data } = useAutocomplete(
    { q: buildingCode ?? '', limit: '5' },
    // 건물 노드 id는 거의 안 바뀌고, 못 찾아도 더미 값으로 넘어가니 토스트는 띄우지 않는다.
    { query: { enabled, staleTime: Infinity, meta: { silent: true } } },
  );
  if (!enabled) return undefined;
  return data?.suggestions?.find(item => item.nodeType === 'SYMBOLIC' && item.displayName === buildingCode)?.nodeId;
}

/** 건물 코드("R동")의 주 출입구 문구. 서버 장소 상세의 출입구 목록으로 만들고, 없으면 fallback(더미 값). */
export function useBuildingMainEntrance(buildingCode: string | undefined, fallback: string) {
  return useNodeDetail(useBuildingNodeId(buildingCode))?.mainEntrance ?? fallback;
}
