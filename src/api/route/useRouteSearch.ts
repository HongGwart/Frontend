import { useMemo } from 'react';
import { useRoute as useRouteQuery } from '@api/generated/honggwart';
import { USE_MOCK_API } from '@api/config';
import { toApiError } from '@api/errors';
import { RouteView, toRouteView } from './toRouteView';

export interface RouteSearchParams {
  fromNodeId?: number;
  toNodeId?: number;
}

/**
 * 출발/도착 노드 사이 경로를 찾는다(GET /api/route). mode를 빼고 한 번 불러서 세 모드(최단/실내 위주/계단
 * 회피) 경로를 같이 받는다 — 경로 선택 화면과 길 안내 화면이 같은 캐시를 쓴다.
 * 출발/도착 중 노드가 없는 곳(앱 더미 장소)이 있으면 요청하지 않는다(enabled=false, 화면이 더미 경로를 쓴다).
 * 실패는 토스트 대신 notFound(404 ROUTE_NOT_FOUND)/error로 돌려줘서 화면이 목록 자리에 안내한다.
 */
export function useRouteSearch({ fromNodeId, toNodeId }: RouteSearchParams) {
  const enabled = !USE_MOCK_API && fromNodeId !== undefined && toNodeId !== undefined;

  const { data, error, isError, isFetching } = useRouteQuery(
    { fromNodeId: fromNodeId ?? 0, toNodeId: toNodeId ?? 0 },
    {
      query: {
        enabled,
        // 실패하면 경로 목록 자리에 바로 문구를 띄우니(경로 없음/그 밖의 실패) 전역 토스트는 끈다.
        meta: { silent: true },
        // 같은 출발/도착은 길 안내 도중 다시 불러오지 않는다(경로가 바뀌면 안내 단계가 어긋난다).
        staleTime: Infinity,
      },
    },
  );

  const routes = useMemo(
    () => (data?.routes ?? []).map(toRouteView).filter((view): view is RouteView => view !== null),
    [data],
  );

  const apiError = isError ? toApiError(error) : undefined;
  const notFound = apiError?.status === 404 || (!!data && routes.length === 0);

  return {
    /** 서버 경로를 쓰는 중인지(출발/도착 둘 다 서버 노드) */
    enabled,
    routes,
    isLoading: enabled && isFetching && !data,
    notFound,
    /** 경로 없음 외의 실패(네트워크·서버 오류). 화면이 문구를 띄운다. */
    error: apiError && !notFound ? apiError : undefined,
  };
}
