import { useMemo } from 'react';
import { useRoute as useRouteQuery } from '@api/generated/honggwart';
import { USE_MOCK_API } from '@api/config';
import { toApiError } from '@api/errors';
import { RouteView, toRouteView } from './toRouteView';
import type { RouteParams, RouteResponse } from '@api/generated/model';

export interface RouteSearchParams {
  fromNodeId?: number;
  toNodeId?: number;
  fromPlaceId?: string | null;
  toPlaceId?: string | null;
}

/** 각 끝점은 장소 UUID를 우선하고, 없을 때만 호환 노드 ID를 보낸다. */
export function toRouteParams({ fromNodeId, toNodeId, fromPlaceId, toPlaceId }: RouteSearchParams): RouteParams {
  return {
    ...(fromPlaceId ? { fromPlaceId } : fromNodeId !== undefined ? { fromNodeId } : {}),
    ...(toPlaceId ? { toPlaceId } : toNodeId !== undefined ? { toNodeId } : {}),
  };
}

export function routeResponseState(data?: RouteResponse, error?: unknown) {
  const apiError = error ? toApiError(error) : undefined;
  const samePlace = !apiError && data?.status === 'SAME_PLACE';
  const notFound = apiError?.status === 404 && apiError.code === 'ROUTE_NOT_FOUND';
  return { samePlace, notFound, error: notFound ? undefined : apiError };
}

/** 새 탐색에서는 시각에 따라 달라지는 지표를 갱신하고, 안내는 선택한 RouteView를 별도로 고정한다. */
export function useRouteSearch(params: RouteSearchParams, active = true, searchRevision = 0) {
  const request = toRouteParams(params);
  const enabled = active && !USE_MOCK_API &&
    (request.fromPlaceId !== undefined || request.fromNodeId !== undefined) &&
    (request.toPlaceId !== undefined || request.toNodeId !== undefined);

  const { data, error, isError, isFetching } = useRouteQuery(
    request,
    {
      query: {
        enabled,
        // 실패하면 경로 목록 자리에 바로 문구를 띄우니(경로 없음/그 밖의 실패) 전역 토스트는 끈다.
        meta: { silent: true },
        queryKey: ['route-place-v2', request, searchRevision],
        staleTime: 30_000,
        refetchOnMount: 'always',
      },
    },
  );

  const routes = useMemo(
    () => (!isError && data?.status === 'ROUTES_FOUND' ? data.routes ?? [] : [])
      .map(toRouteView).filter((view): view is RouteView => view !== null),
    [data, isError],
  );

  return {
    enabled,
    routes,
    isLoading: enabled && isFetching && !data,
    ...routeResponseState(data, isError ? error : undefined),
  };
}
