import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useAutocomplete } from '@api/generated/honggwart';
import type { NodeSuggestionResponse } from '@api/generated/model';
import { USE_MOCK_API } from '@api/config';
import { DUMMY_SEARCH_RESULTS, SearchItemCategory, SearchResultItem } from '@constant/dummySearchData';
import { toPlaceKey } from '@utils/placeKey';

const DEBOUNCE_MS = 250;
const LIMIT = '20';
const CATEGORY_MAP: Record<string, SearchItemCategory> = {
  CAFE: 'cafe', RESTAURANT: 'restaurant', STORE: 'store', CONVENIENCE_STORE: 'store',
  READING_ROOM: 'readingRoom', PC_ROOM: 'pcRoom', PRINTER: 'printer',
  BOOK_RETURN: 'bookReturn', SMOKING_AREA: 'smokingArea',
};

const matchesKeyword = (item: SearchResultItem, lower: string) =>
  `${item.displayName ?? ''}${item.building}${item.place}${item.room ?? ''}`.toLowerCase().includes(lower);

/** 검색의 표시명은 소속을 추정하는 용도로 분해하지 않는다. 구조화된 소속은 상세 API에서 읽는다. */
export function toSearchResultItem(suggestion: NodeSuggestionResponse): SearchResultItem {
  const category = suggestion.placeKind === 'BUILDING' || suggestion.nodeType === 'SYMBOLIC'
    ? 'building'
    : suggestion.placeKind === 'ROOM'
      ? 'classroom'
      : CATEGORY_MAP[suggestion.category ?? ''] ?? 'place';
  return {
    id: toPlaceKey('', undefined, suggestion),
    nodeId: suggestion.nodeId,
    placeId: suggestion.placeId ?? null,
    placeKind: suggestion.placeKind ?? null,
    entranceCount: suggestion.entranceCount ?? null,
    serverCategory: suggestion.category ?? null,
    displayName: suggestion.displayName ?? '',
    building: '',
    place: suggestion.displayName ?? '',
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

export function useSearchSuggestions(keyword: string) {
  const immediate = keyword.trim();
  const query = useDebouncedValue(immediate, DEBOUNCE_MS);
  const enabled = !USE_MOCK_API && query.length > 0;
  const { data, isError, isFetching, isPlaceholderData } = useAutocomplete(
    { q: query, limit: LIMIT },
    { query: { enabled, staleTime: 60_000, placeholderData: keepPreviousData,
      meta: { errorMessage: '검색 결과를 불러오지 못했어요.' } } },
  );
  const results = useMemo(() => {
    if (!immediate) return [];
    if (USE_MOCK_API) return DUMMY_SEARCH_RESULTS.filter(item => matchesKeyword(item, immediate.toLowerCase()));
    if (!enabled || isError) return [];
    const remote = (data?.suggestions ?? []).map(toSearchResultItem);
    return query !== immediate || isPlaceholderData
      ? remote.filter(item => matchesKeyword(item, immediate.toLowerCase()))
      : remote;
  }, [immediate, query, enabled, isError, data, isPlaceholderData]);
  return { results, isLoading: !USE_MOCK_API && (query !== immediate || (enabled && isFetching && !data)), isError };
}
