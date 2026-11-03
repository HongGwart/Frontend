import type { QueryClient } from '@tanstack/react-query';
import { getAutocompleteQueryOptions, useAutocomplete } from '@api/generated/honggwart';
import type { AutocompleteResponse } from '@api/generated/model';
import { isRoomNumber } from '@utils/roomLabel';

/** 서버 노드를 찾을 장소. 건물 자체면 room을 비운다. */
export interface RoutePlace {
  /** 예: "C동" */
  buildingCode: string;
  /** 예: "816호". 건물 자체면 생략 */
  room?: string;
}

/** 찾을 표시 이름("C동 816호"). */
const placeName = (place: RoutePlace | undefined) =>
  place ? [place.buildingCode, place.room].filter(Boolean).join(' ') : '';

/** 글자 이름 방인지("멀티미디어실", "제1열람실"). 번호 방은 "816호"처럼 "호"가 붙어 온다. */
const isNamedRoom = (place: RoutePlace | undefined): place is RoutePlace & { room: string } =>
  !!place?.room && !isRoomNumber(place.room.replace(/호$/, ''));

/**
 * 자동완성 검색어. 글자 이름 방은 서버 이름이 "T6 멀티미디어실"·"G동 B1 계단열람실"처럼 동 표기가 제각각이라
 * "T동 멀티미디어실"로 찾으면 결과가 하나도 안 나온다 — 방 이름만으로 찾고 pickNodeId가 같은 동을 고른다.
 */
const lookupQuery = (place: RoutePlace | undefined) => (isNamedRoom(place) ? place.room : placeName(place));
const lookupParams = (query: string) => ({ q: query, limit: '10' });
// 노드 id는 거의 안 바뀐다. 실패는 길찾기 화면·버튼이 직접 안내하니 전역 토스트는 띄우지 않는다.
const LOOKUP_QUERY = { staleTime: Infinity, meta: { silent: true } } as const;

/** 자동완성 결과에서 표시 이름이 정확히 같은 노드("C동" → 건물 노드, "C동 816호" → 호실 노드). */
function pickNodeId(data: AutocompleteResponse | undefined, place: RoutePlace | undefined) {
  const name = placeName(place);
  const suggestions = data?.suggestions ?? [];
  const exact = suggestions.find(item => item.displayName === name && (item.nodeType === 'SYMBOLIC') === !place?.room);
  if (exact || !isNamedRoom(place)) return exact?.nodeId;
  // 글자 이름 방은 서버 이름의 동 표기가 제각각이다: "G동 B1 계단열람실", "T6 멀티미디어실", "L3 계단 세미나실",
  // "H2 제1열람실 가운데 구역". 같은 동("T동 …", "T동 B1 …", "T6 …", "TB1 …")이면서 방 이름이 들어 있는 첫 장소로 본다
  // — H2 제1열람실처럼 한 방이 구역별로 나뉘어 있으면 첫 구역으로 길을 찾는다(같은 열람실이다).
  const code = place.buildingCode.replace(/동$/, '');
  const sameBuilding = new RegExp(`^${code}(?:동 |B?\\d+ )`);
  return suggestions.find(
    item =>
      item.nodeType !== 'SYMBOLIC' &&
      !!item.displayName &&
      sameBuilding.test(item.displayName) &&
      ` ${item.displayName} `.includes(` ${place.room}`),
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
  const query = lookupQuery(place);
  // 동 코드가 비어 있으면(이름 없는 마커 등) 빈 검색어로 요청하지 않는다.
  const enabled = query.length > 0;
  const { data, error, isLoading, isError, isFetching, refetch } = useAutocomplete(lookupParams(query), {
    query: { enabled, ...LOOKUP_QUERY },
  });
  const nodeId = pickNodeId(data, place);
  return {
    nodeId: enabled ? nodeId : undefined,
    isLoading: enabled && isLoading,
    isError: enabled && isError,
    /** 실패 원인(인터넷 끊김·응답 지연 등) — 화면이 원인별 문구를 고른다 */
    error: enabled && isError ? error : undefined,
    /** 실패한 뒤 "다시 시도" */
    retry: () => {
      if (enabled && !isFetching) refetch();
    },
  };
}

/**
 * usePlaceNodeId와 같은 조회를 지금 바로 한다(출발/도착 버튼을 누를 때). 같은 쿼리 캐시를 쓰므로 이어서 열리는
 * 길찾기 화면은 다시 요청하지 않는다. 서버에 없는 장소면 undefined, 요청이 실패하면 예외를 던진다.
 * 버튼을 누른 사람이 스피너를 보며 기다리는 조회라 재시도하지 않는다 — 전역 기본값(최대 2회 재시도)을 따르면
 * 타임아웃(10초) 때 30초 넘게 멈춘다. 실패하면 호출부가 길찾기 화면으로 넘겨 "다시 시도" 안내에 맡긴다.
 */
export async function fetchPlaceNodeId(queryClient: QueryClient, place: RoutePlace): Promise<number | undefined> {
  const data = await queryClient.query(
    getAutocompleteQueryOptions(lookupParams(lookupQuery(place)), { query: { ...LOOKUP_QUERY, retry: false } }),
  );
  return pickNodeId(data, place);
}
