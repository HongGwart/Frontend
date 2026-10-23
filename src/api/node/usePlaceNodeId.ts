import type { QueryClient } from '@tanstack/react-query';
import { getAutocompleteQueryOptions, useAutocomplete } from '@api/generated/honggwart';
import type { AutocompleteResponse } from '@api/generated/model';

/** 서버 노드를 찾을 장소. 건물 자체면 room을 비운다. */
export interface RoutePlace {
  /** 예: "C동" */
  buildingCode: string;
  /** 예: "816호". 건물 자체면 생략 */
  room?: string;
}

/** 자동완성 검색어이자 찾을 표시 이름("C동 816호"). */
const placeName = (place: RoutePlace | undefined) =>
  place ? [place.buildingCode, place.room].filter(Boolean).join(' ') : '';

const lookupParams = (name: string) => ({ q: name, limit: '10' });
// 노드 id는 거의 안 바뀐다. 실패는 길찾기 화면·버튼이 직접 안내하니 전역 토스트는 띄우지 않는다.
const LOOKUP_QUERY = { staleTime: Infinity, meta: { silent: true } } as const;

/** 자동완성 결과에서 표시 이름이 정확히 같은 노드("C동" → 건물 노드, "C동 816호" → 호실 노드). */
function pickNodeId(data: AutocompleteResponse | undefined, place: RoutePlace | undefined) {
  const name = placeName(place);
  return data?.suggestions?.find(
    item => item.displayName === name && (item.nodeType === 'SYMBOLIC') === !place?.room,
  )?.nodeId;
}

/**
 * 동 코드(+ 호실)로 서버 노드 id를 찾는다. 지도 마커·건물 내부 지도·즐겨찾기처럼 서버 검색을 거치지 않고 고른 장소는
 * nodeId가 없어서, 길찾기가 자동완성(GET /api/search/autocomplete)에서 표시 이름이 정확히 같은 노드를 고른다
 * ("C동" → 건물 노드, "C동 816호" → 호실 노드). place가 없거나 이름이 비면 요청하지 않는다.
 * - nodeId가 없고 isError도 아니면: 서버에 없는 장소(길찾기 노드가 없는 호실 등)
 * - isError: 찾는 요청이 실패(네트워크 등) — 서버에 없는 장소와 구분해서 안내한다
 */
export function usePlaceNodeId(place: RoutePlace | undefined) {
  const name = placeName(place);
  // 동 코드가 비어 있으면(이름 없는 마커 등) 빈 검색어로 요청하지 않는다.
  const enabled = name.length > 0;
  const { data, isLoading, isError } = useAutocomplete(lookupParams(name), { query: { enabled, ...LOOKUP_QUERY } });
  const nodeId = pickNodeId(data, place);
  return { nodeId: enabled ? nodeId : undefined, isLoading: enabled && isLoading, isError: enabled && isError };
}

/**
 * usePlaceNodeId와 같은 조회를 지금 바로 한다(출발/도착 버튼을 누를 때). 같은 쿼리 캐시를 쓰므로 이어서 열리는
 * 길찾기 화면은 다시 요청하지 않는다. 서버에 없는 장소면 undefined, 요청이 실패하면 예외를 던진다.
 * 버튼을 누른 사람이 스피너를 보며 기다리는 조회라 재시도하지 않는다 — 전역 기본값(최대 2회 재시도)을 따르면
 * 타임아웃(10초) 때 30초 넘게 멈춘다. 실패하면 호출부가 길찾기 화면으로 넘겨 "다시 시도" 안내에 맡긴다.
 */
export async function fetchPlaceNodeId(queryClient: QueryClient, place: RoutePlace): Promise<number | undefined> {
  const data = await queryClient.query(
    getAutocompleteQueryOptions(lookupParams(placeName(place)), { query: { ...LOOKUP_QUERY, retry: false } }),
  );
  return pickNodeId(data, place);
}
