import { getAutocompleteQueryOptions } from '@api/generated/honggwart';
import { queryClient } from '@api/queryClient';

/** 서버 노드를 찾을 장소. 건물 자체면 room을 비운다. */
export interface RoutePlace {
  /** 예: "C동" */
  buildingCode: string;
  /** 예: "816호". 건물 자체면 생략 */
  room?: string;
}

/**
 * 동 코드(+ 호실)로 서버 노드 id를 찾는다. 지도 마커·건물 내부 지도처럼 서버 검색을 거치지 않고 열린 카드는 nodeId가
 * 없어서, 길찾기로 넘기기 전에 자동완성(GET /api/search/autocomplete)에서 표시 이름이 정확히 같은 노드를 고른다
 * ("C동" → 건물 노드, "C동 816호" → 호실 노드). 서버에 없는 장소(앱 더미 시설 등)거나 요청이 실패하면 undefined.
 */
export async function resolvePlaceNodeId({ buildingCode, room }: RoutePlace): Promise<number | undefined> {
  const name = room ? `${buildingCode} ${room}` : buildingCode;
  try {
    const data = await queryClient.fetchQuery({
      ...getAutocompleteQueryOptions({ q: name, limit: '10' }),
      // 노드 id는 거의 안 바뀐다. 못 찾아도 길찾기 화면이 안내하니 토스트는 띄우지 않는다.
      staleTime: Infinity,
      meta: { silent: true },
    });
    const isBuilding = (nodeType?: string) => nodeType === 'SYMBOLIC';
    return data.suggestions?.find(item => item.displayName === name && isBuilding(item.nodeType) === !room)?.nodeId;
  } catch {
    return undefined;
  }
}
