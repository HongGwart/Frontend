import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useAutocomplete } from '@api/generated/honggwart';
import type { NodeSuggestionResponse } from '@api/generated/model';
import { USE_MOCK_API } from '@api/config';
import { DUMMY_MAP_MARKERS } from '@constant/dummyMapMarkers';
import { DUMMY_SEARCH_RESULTS, SearchItemCategory, SearchResultItem } from '@constant/dummySearchData';

const DEBOUNCE_MS = 250;
const LIMIT = '20'; // 서버 스펙상 string(1~50). 스펙이 integer로 고쳐지면 숫자로 바꾼다.

/**
 * 서버에 아직 없는 장소(편의시설 더미, 시연용 카페나무 등)도 검색되도록, 서버 결과 뒤에 앱 더미 결과를 붙인다.
 * 서버 데이터가 채워지면 false로 끄고 이 병합 코드를 지운다.
 */
const MERGE_LOCAL_DUMMY = true;

function searchLocalDummy(keyword: string): SearchResultItem[] {
  const lower = keyword.toLowerCase();
  return DUMMY_SEARCH_RESULTS.filter(item =>
    `${item.building}${item.place}${item.room ?? ''}`.toLowerCase().includes(lower),
  );
}

// "C동 630호" → 동 코드 "C동" + 나머지 "630호". "R동"처럼 건물 자체면 나머지는 없다.
const BUILDING_NAME = /^([A-Z]+\d*동)(?:\s+(.+))?$/;

/** 서버 자동완성 항목을 검색 리스트 항목 모양으로 바꾼다. */
function toSearchResultItem(suggestion: NodeSuggestionResponse): SearchResultItem {
  const displayName = suggestion.displayName ?? '';
  const match = displayName.match(BUILDING_NAME);
  const building = match?.[1] ?? '';
  const room = match?.[2];
  const place = DUMMY_MAP_MARKERS.find(marker => marker.label === building)?.buildingName ?? '';
  const isBuilding = suggestion.nodeType === 'SYMBOLIC' || (match && !room);
  const category: SearchItemCategory = isBuilding ? 'building' : 'classroom';
  return {
    id: `node-${suggestion.nodeId}`,
    nodeId: suggestion.nodeId,
    building,
    // 동 코드로 시작하지 않는 이름("R5 강의실 끝 여자화장실")은 이름 전체를 장소명 자리에 보여준다.
    place: match ? place : displayName,
    room,
    category,
  };
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/**
 * 검색어로 장소 후보를 찾는다(GET /api/search/autocomplete). 입력이 멈추고 250ms 뒤에 요청하고, 새 결과가 올
 * 때까지 이전 결과를 그대로 보여준다. 서버 요청이 실패하면 전역 토스트가 뜨고, 목록은 앱 더미 결과로 대신한다.
 */
export function useSearchSuggestions(keyword: string) {
  const query = useDebouncedValue(keyword.trim(), DEBOUNCE_MS);
  const enabled = !USE_MOCK_API && query.length > 0;

  const { data, isError, isFetching } = useAutocomplete(
    { q: query, limit: LIMIT },
    {
      query: {
        enabled,
        placeholderData: keepPreviousData,
        meta: { errorMessage: '검색 결과를 불러오지 못했어요.' },
      },
    },
  );

  const results = useMemo(() => {
    if (!query) return [];
    const local = searchLocalDummy(query);
    if (!enabled || isError) return local;
    const remote = (data?.suggestions ?? []).map(toSearchResultItem);
    if (!MERGE_LOCAL_DUMMY) return remote;
    const seen = new Set(remote.map(item => `${item.building}/${item.room ?? ''}`));
    return [...remote, ...local.filter(item => !seen.has(`${item.building}/${item.room ?? ''}`))];
  }, [query, enabled, isError, data]);

  return { results, isLoading: enabled && isFetching && !data };
}
