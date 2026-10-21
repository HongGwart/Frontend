import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useAutocomplete } from '@api/generated/honggwart';
import type { NodeSuggestionResponse } from '@api/generated/model';
import { USE_MOCK_API } from '@api/config';
import { DUMMY_MAP_MARKERS } from '@constant/dummyMapMarkers';
import { DUMMY_SEARCH_RESULTS, SearchItemCategory, SearchResultItem } from '@constant/dummySearchData';

const DEBOUNCE_MS = 250;
const LIMIT = '20'; // 서버 스펙상 string(1~50). 스펙이 integer로 고쳐지면 숫자로 바꾼다.


const matchesKeyword = (item: SearchResultItem, lower: string) =>
  `${item.building}${item.place}${item.room ?? ''}`.toLowerCase().includes(lower);

/** 목 모드(EXPO_PUBLIC_USE_MOCK)에서만 쓰는 앱 더미 검색. 실제 모드에서는 서버 결과만 보여준다. */
function searchLocalDummy(keyword: string): SearchResultItem[] {
  const lower = keyword.toLowerCase();
  return DUMMY_SEARCH_RESULTS.filter(item => matchesKeyword(item, lower));
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
 * 때까지 이전 결과를 그대로 보여준다. 서버 요청이 실패하면 전역 토스트가 뜨고 목록은 비운다(앱 더미로 채우지 않는다).
 * 목 모드에서는 서버를 부르지 않고 앱 더미 결과를 쓴다.
 */
export function useSearchSuggestions(keyword: string) {
  // 서버 요청만 디바운스하고, 이전 서버 결과는 입력하자마자 지금 검색어로 다시 거른다(아래 results).
  const immediate = keyword.trim();
  const query = useDebouncedValue(immediate, DEBOUNCE_MS);
  const enabled = !USE_MOCK_API && query.length > 0;

  const { data, isError, isFetching, isPlaceholderData } = useAutocomplete(
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
    if (!immediate) return [];
    if (USE_MOCK_API) return searchLocalDummy(immediate);
    if (isError) return [];
    let remote = (data?.suggestions ?? []).map(toSearchResultItem);
    // 아직 지금 입력값의 응답이 아니면(디바운스 중이거나 새 요청을 기다리는 중) 이전 검색어의 서버 결과 중 지금 입력값에도
    // 맞는 것만 남긴다 — 다 숨기면 목록이 깜빡이고, 다 보여주면 다른 검색어 결과가 섞인다.
    if (query !== immediate || isPlaceholderData) {
      const lower = immediate.toLowerCase();
      remote = remote.filter(item => matchesKeyword(item, lower));
    }
    return remote;
  }, [immediate, query, isError, data, isPlaceholderData]);

  return { results, isLoading: enabled && isFetching && !data };
}
