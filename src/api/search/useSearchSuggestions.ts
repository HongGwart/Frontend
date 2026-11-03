import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useAutocomplete } from '@api/generated/honggwart';
import { toTabCategory, useFacilityBuildingCodes } from '@api/facility/facilities';
import type { NodeSuggestionResponse } from '@api/generated/model';
import { CAMPUS_BUILDINGS } from '@constant/campusBuildings';
import { SearchItemCategory, SearchResultItem } from '@constant/dummySearchData';
import type { FacilityCategoryId } from '@navigation/types';

const DEBOUNCE_MS = 250;
const LIMIT = '20'; // 서버 스펙상 string(1~50). 스펙이 integer로 고쳐지면 숫자로 바꾼다.


const matchesKeyword = (item: SearchResultItem, lower: string) =>
  `${item.building}${item.place}${item.room ?? ''}`.toLowerCase().includes(lower);

// "C동 630호" → 동 코드 "C동" + 나머지 "630호". "R동"처럼 건물 자체면 나머지는 없다.
const BUILDING_NAME = /^([A-Z]+\d*동)(?:\s+(.+))?$/;
// 편의시설은 동 표기가 뒤 괄호에 붙어 온다: "열람실(K동)" → 동 코드 "K동" + 이름 "열람실".
const FACILITY_NAME = /^(.+)\(([A-Z]+\d*동)\)$/;

/**
 * 편의시설 탭 카테고리 → 검색 리스트 아이콘. 서버 분류 코드는 시설 목록과 같은 표(toTabCategory)로 먼저 바꾼다 —
 * 표가 하나라 서버 코드가 바뀌어도 facilities.ts만 고치면 된다. "기타"·일반 장소는 강의실 아이콘.
 */
const SEARCH_CATEGORY_BY_TAB: Partial<Record<FacilityCategoryId, SearchItemCategory>> = {
  restaurant: 'restaurant',
  cafe: 'cafe',
  store: 'store',
  readingRoom: 'readingRoom',
  pc: 'pcRoom',
  printer: 'printer',
  bookReturn: 'bookReturn',
  smokingArea: 'smokingArea',
};

/**
 * 서버 자동완성 항목을 검색 리스트 항목 모양으로 바꾼다. 이름에 동 표기가 없는 시설("그라찌에")은 시설 목록에서
 * 찾은 소속 동(facilityBuildingCodes)을 붙인다.
 */
function toSearchResultItem(
  suggestion: NodeSuggestionResponse,
  facilityBuildingCodes: ReadonlyMap<number, string>,
): SearchResultItem {
  const displayName = suggestion.displayName ?? '';
  const match = displayName.match(BUILDING_NAME);
  const facility = match ? null : displayName.match(FACILITY_NAME);
  const facilityBuilding = suggestion.nodeId !== undefined ? facilityBuildingCodes.get(suggestion.nodeId) : undefined;
  const building = match?.[1] ?? facility?.[2] ?? facilityBuilding ?? '';
  const room = match?.[2] ?? facility?.[1] ?? (facilityBuilding ? displayName : undefined);
  const place = CAMPUS_BUILDINGS.find(marker => marker.label === building)?.buildingName ?? '';
  const isBuilding = suggestion.nodeType === 'SYMBOLIC' || (match && !room);
  const category: SearchItemCategory = isBuilding
    ? 'building'
    : ((suggestion.category ? SEARCH_CATEGORY_BY_TAB[toTabCategory(suggestion.category)] : undefined) ?? 'classroom');
  return {
    id: `node-${suggestion.nodeId}`,
    nodeId: suggestion.nodeId,
    building,
    // 동 코드를 못 찾은 이름("R5 강의실 끝 여자화장실", "그라찌에")은 이름 전체를 장소명 자리에 보여준다.
    place: building ? place : displayName,
    room,
    category,
    displayName,
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
 * 때까지 이전 결과를 그대로 보여준다. 서버 요청이 실패하면 목록을 비우고, 화면이 실패 원인과 "다시 시도"를 보여준다.
 */
export function useSearchSuggestions(keyword: string) {
  // 서버 요청만 디바운스하고, 이전 서버 결과는 입력하자마자 지금 검색어로 다시 거른다(아래 results).
  const immediate = keyword.trim();
  const query = useDebouncedValue(immediate, DEBOUNCE_MS);
  const enabled = query.length > 0;

  const { data, error, isError, isFetching, isPlaceholderData, refetch } = useAutocomplete(
    { q: query, limit: LIMIT },
    {
      query: {
        enabled,
        placeholderData: keepPreviousData,
        // 실패는 검색 화면이 결과 자리에 원인과 "다시 시도"로 직접 안내해서 전역 토스트는 띄우지 않는다.
        meta: { silent: true },
      },
    },
  );

  const facilityBuildingCodes = useFacilityBuildingCodes();

  const results = useMemo(() => {
    if (!immediate) return [];
    if (isError) return [];
    let remote = (data?.suggestions ?? []).map(suggestion => toSearchResultItem(suggestion, facilityBuildingCodes));
    // 아직 지금 입력값의 응답이 아니면(디바운스 중이거나 새 요청을 기다리는 중) 이전 검색어의 서버 결과 중 지금 입력값에도
    // 맞는 것만 남긴다 — 다 숨기면 목록이 깜빡이고, 다 보여주면 다른 검색어 결과가 섞인다.
    if (query !== immediate || isPlaceholderData) {
      const lower = immediate.toLowerCase();
      remote = remote.filter(item => matchesKeyword(item, lower));
    }
    return remote;
  }, [immediate, query, isError, data, isPlaceholderData, facilityBuildingCodes]);

  // 입력이 있는데 디바운스 중이거나 지금 검색어의 응답을 기다리는 중 — 이때 결과가 비어 있어도 "검색 결과 없음"을
  // 띄우지 않는다. 디바운스된 query가 아니라 지금 입력값으로 봐야 빈 검색창에 첫 글자를 칠 때도 깜빡이지 않는다.
  const isSearching = immediate.length > 0 && (query !== immediate || isFetching);

  return {
    results,
    isLoading: enabled && isFetching && !data,
    isSearching,
    /** 검색 요청 실패 — 화면은 "검색 결과 없음" 대신 실패 안내와 "다시 시도"를 띄운다(결과 0개와 구분) */
    isError: enabled && isError,
    /** 실패 원인(인터넷 끊김·응답 지연 등) — 실패 안내 문구에 쓴다 */
    error: enabled && isError ? error : undefined,
    /** 실패한 뒤 "다시 시도" */
    retry: () => {
      if (enabled && !isFetching) refetch();
    },
  };
}
