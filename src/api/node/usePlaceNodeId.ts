import { useAutocomplete } from '@api/generated/honggwart';
import { USE_MOCK_API } from '@api/config';

/** 서버 노드를 찾을 장소. 건물 자체면 room을 비운다. */
export interface RoutePlace {
  /** 예: "C동" */
  buildingCode: string;
  /** 예: "816호". 건물 자체면 생략 */
  room?: string;
}

/**
 * 동 코드(+ 호실)로 서버 노드 id를 찾는다. 지도 마커·건물 내부 지도·즐겨찾기처럼 서버 검색을 거치지 않고 고른 장소는
 * nodeId가 없어서, 길찾기가 자동완성(GET /api/search/autocomplete)에서 표시 이름이 정확히 같은 노드를 고른다
 * ("C동" → 건물 노드, "C동 816호" → 호실 노드). place가 없거나 목 모드면 요청하지 않는다.
 * - nodeId가 없고 isError도 아니면: 서버에 없는 장소(앱 더미 시설 등)
 * - isError: 찾는 요청이 실패(네트워크 등) — 서버에 없는 장소와 구분해서 안내한다
 */
export function usePlaceNodeId(place: RoutePlace | undefined) {
  const name = place ? [place.buildingCode, place.room].filter(Boolean).join(' ') : '';
  const enabled = !USE_MOCK_API && !!place;
  const { data, isLoading, isError } = useAutocomplete(
    { q: name, limit: '10' },
    // 노드 id는 거의 안 바뀐다. 실패는 길찾기 화면이 목록 자리에 안내하니 토스트는 띄우지 않는다.
    { query: { enabled, staleTime: Infinity, meta: { silent: true } } },
  );
  const nodeId = data?.suggestions?.find(
    item => item.displayName === name && (item.nodeType === 'SYMBOLIC') === !place?.room,
  )?.nodeId;
  return { nodeId: enabled ? nodeId : undefined, isLoading: enabled && isLoading, isError: enabled && isError };
}
