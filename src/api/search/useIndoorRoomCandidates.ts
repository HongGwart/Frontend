import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { autocomplete, nodePlaceInfo, placeDetail } from '@api/generated/honggwart';
import { USE_MOCK_API } from '@api/config';
import { ApiError, toApiError } from '@api/errors';
import { toSearchResultItem } from './useSearchSuggestions';
import {
  dedupeAndSortIndoorRoomCandidates,
  normalizeIndoorBuildingCode,
  toIndoorRoomCandidate,
  type IndoorRoomCandidate,
  type IndoorRoomContext,
} from './indoorRoomCandidates';

const DEBOUNCE_MS = 250;
const DETAIL_CONCURRENCY = 6;

export interface IndoorRoomCandidatesState {
  candidates: IndoorRoomCandidate[];
  status: 'idle' | 'loading' | 'success' | 'error';
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

/** 검색 응답만으로 선택을 확정하지 않고, 각 후보의 구조화된 위치를 추가 조회한다. */
export async function fetchIndoorRoomCandidates(
  context: IndoorRoomContext,
  keyword: string,
  signal?: AbortSignal,
): Promise<IndoorRoomCandidate[]> {
  const response = await autocomplete({ q: keyword.trim(), limit: '50' }, undefined, signal);
  const seen = new Set<string>();
  const items = (response.suggestions ?? []).flatMap(suggestion => {
    if (!suggestion.placeId && (!Number.isSafeInteger(suggestion.nodeId) || (suggestion.nodeId ?? 0) <= 0)) return [];
    const item = toSearchResultItem(suggestion);
    if (seen.has(item.id)) return [];
    seen.add(item.id);
    return [item];
  });
  const candidates: IndoorRoomCandidate[] = [];
  for (let offset = 0; offset < items.length; offset += DETAIL_CONCURRENCY) {
    const batch = await Promise.all(items.slice(offset, offset + DETAIL_CONCURRENCY).map(async item => {
      if (item.placeId) {
        const detail = await placeDetail(item.placeId, undefined, signal);
        return toIndoorRoomCandidate(context, item, detail.placeInfo ?? undefined, detail);
      }
      const info = await nodePlaceInfo(String(item.nodeId), undefined, signal);
      return toIndoorRoomCandidate(context, item, info);
    }));
    candidates.push(...batch.filter((candidate): candidate is IndoorRoomCandidate => candidate !== null));
  }
  return dedupeAndSortIndoorRoomCandidates(candidates);
}

export function useIndoorRoomCandidates(
  context: IndoorRoomContext | undefined,
  keyword: string,
): IndoorRoomCandidatesState {
  const immediate = keyword.trim();
  const [debounced, setDebounced] = useState(immediate);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(immediate), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [immediate]);

  const active = !USE_MOCK_API && !!context && immediate.length > 0;
  const waitingForInput = active && immediate !== debounced;
  const enabled = active && !waitingForInput;
  const query = useQuery<IndoorRoomCandidate[], ApiError>({
    queryKey: [
      'indoor-room-candidates-v1',
      context ? normalizeIndoorBuildingCode(context.buildingCode) : null,
      context?.floor.trim().toUpperCase(),
      context?.roomLabel,
      debounced,
    ],
    queryFn: async ({ signal }) => {
      if (!context) return [];
      try {
        return await fetchIndoorRoomCandidates(context, debounced, signal);
      } catch (error) {
        throw toApiError(error);
      }
    },
    enabled,
    // 오래된 선택을 재사용하지 않고, 상세 검증까지 끝난 새 후보만 선택할 수 있게 한다.
    staleTime: 0,
    placeholderData: undefined,
    meta: { silent: true },
  });
  const isLoading = active && (waitingForInput || query.isPending || query.isFetching);
  const isError = enabled && !isLoading && query.isError;
  const refetch = useCallback(async () => {
    if (enabled) await query.refetch();
  }, [enabled, query.refetch]);

  return {
    candidates: enabled && !isLoading && !isError ? query.data ?? [] : [],
    status: !active ? 'idle' : isLoading ? 'loading' : isError ? 'error' : 'success',
    isLoading,
    isFetching: active && query.isFetching,
    isError,
    error: isError ? query.error : null,
    refetch,
  };
}
