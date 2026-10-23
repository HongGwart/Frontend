import { useMemo } from 'react';
import { useRoute as useRouteQuery } from '@api/generated/honggwart';
import { toApiError } from '@api/errors';
import { routeFreshMs } from './routeCacheTime';
import { RouteView, toRouteView } from './toRouteView';

export interface RouteSearchParams {
  fromNodeId?: number;
  toNodeId?: number;
}

/**
 * 서버는 세 모드 경로를 따로 주지만, 절반 넘게는 두세 모드가 똑같은 길이다(실제 응답 569건 중 두 모드 같음 50%,
 * 세 모드 같음 20%). 같은 길을 이름만 바꿔 카드 여러 장으로 보여주지 않게, 경로선이 같은 경로는 앞의 카드 하나로
 * 합치고 옵션만 덧붙인다. 합친 카드는 앞 경로의 id를 그대로 써서 길 안내 화면이 같은 id로 찾는다.
 * 받은 경로 객체는 고치지 않고 합친 카드만 새로 만든다.
 */
function mergeSameRoutes(views: RouteView[]): RouteView[] {
  const groups = new Map<string, RouteView[]>();
  views.forEach(view => {
    const signature = view.map.path.map(point => `${point.latitude},${point.longitude}`).join(';');
    groups.set(signature, [...(groups.get(signature) ?? []), view]);
  });
  return [...groups.values()].map(([first, ...rest]) =>
    rest.length === 0
      ? first
      : { ...first, result: { ...first.result, options: [first, ...rest].flatMap(view => view.result.options) } },
  );
}

/**
 * 출발/도착 노드 사이 경로를 찾는다(GET /api/route). mode를 빼고 한 번 불러서 세 모드(최단/실내 위주/계단
 * 회피) 경로를 같이 받는다 — 경로 선택 화면과 길 안내 화면이 같은 캐시를 쓴다.
 * 출발/도착 중 노드가 없는 곳(서버에 없는 장소)이 있으면 요청하지 않는다(enabled=false, 화면이 안내 문구를 띄운다).
 * 실패는 토스트 대신 notFound(404 ROUTE_NOT_FOUND)/error로 돌려줘서 화면이 목록 자리에 안내한다.
 */
export function useRouteSearch({ fromNodeId, toNodeId }: RouteSearchParams) {
  const enabled = fromNodeId !== undefined && toNodeId !== undefined;

  const { data, error, isError, isFetching, isStale, refetch } = useRouteQuery(
    { fromNodeId: fromNodeId ?? 0, toNodeId: toNodeId ?? 0 },
    {
      query: {
        enabled,
        // 실패하면 경로 목록 자리에 바로 문구를 띄우니(경로 없음/그 밖의 실패) 전역 토스트는 끈다.
        meta: { silent: true },
        // 응답이 달라질 수 있는 건 엘리베이터 혼잡 시간(평일 매시 50분~정각) 경계를 넘을 때뿐이라, 그 전까지는
        // 다시 요청하지 않는다(routeCacheTime). 혼잡은 엘리베이터 도착 시각으로 판정해서 가장 긴 경로 시간만큼 앞당긴다.
        staleTime: query =>
          routeFreshMs(
            query.state.dataUpdatedAt,
            Math.max(0, ...(query.state.data?.routes ?? []).map(route => route.summary?.durationSeconds ?? 0)),
          ),
      },
    },
  );

  const routes = useMemo(
    () => mergeSameRoutes((data?.routes ?? []).map(toRouteView).filter((view): view is RouteView => view !== null)),
    [data],
  );

  const apiError = isError ? toApiError(error) : undefined;
  // 출발지와 도착지가 같은 장소면 서버가 경로 없이(routes: []) 200 SAME_PLACE를 준다 — 경로 없음과 구분한다.
  const samePlace = data?.status === 'SAME_PLACE';
  const notFound = apiError?.status === 404 || (!!data && !samePlace && routes.length === 0);

  return {
    /** 서버 경로를 쓰는 중인지(출발/도착 둘 다 서버 노드) */
    enabled,
    routes,
    isLoading: enabled && isFetching && !data,
    samePlace,
    notFound,
    /** 경로 없음 외의 실패(네트워크·서버 오류). 화면이 문구를 띄운다. */
    error: apiError && !notFound ? apiError : undefined,
    /**
     * 캐시가 재사용 기한(staleTime — 다음 혼잡 시간 경계 전)을 넘겼으면 다시 불러온다. 다른 화면에 갔다가 돌아오면 화면이 새로 마운트되지 않아(포커스만 바뀜)
     * 자동으로 다시 불러오지 않아서, 화면 포커스 때 부른다. 이미 불러오는 중이면 겹쳐 요청하지 않는다.
     */
    refetchIfStale: () => {
      if (enabled && isStale && !isFetching) refetch();
    },
  };
}
