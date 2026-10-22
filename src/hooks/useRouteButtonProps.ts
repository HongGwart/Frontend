import { useCallback, useState } from 'react';
import { StackActions, useNavigation } from '@react-navigation/native';
import { queryClient } from '@api/queryClient';
import { showErrorToast } from '@api/errorToast';
import { fetchPlaceNodeId, type RoutePlace } from '@api/node/usePlaceNodeId';

/** 출발/도착 입력창에 넣을 장소 이름. 빈 값은 빼고 공백으로 잇는다 (예: "T동 제4공학관 212호"). */
export function toRoutePlaceLabel(...parts: (string | null | undefined | false)[]) {
  return parts.filter(Boolean).join(' ');
}

type RouteTarget = 'departure' | 'destination';

/**
 * 시설/건물 카드(FacilityInfoCard)의 출발/도착 버튼에 그대로 펼쳐 넣을 핸들러를 만든다.
 * 누르면 길찾기 화면(루트 스택의 Navigation)을 새로 push해서 해당 입력창을 label로 채운다. 서버 장소면
 * nodeId도 같이 넘겨서 길찾기가 실제 경로 탐색 API를 쓰게 한다
 * (NavigationScreen이 routeSelection 파라미터를 받아 반영). dispatch(StackActions.push(...))는
 * 호출 지점이 탭 안(지도 탭)이든 스택 위 화면(건물 내부 지도, 검색)이든 상관없이 이 액션을 처리할
 * 수 있는 가장 가까운 스택 내비게이터(루트 스택)까지 자동으로 bubble돼서 항상 같은 방식으로 동작한다.
 *
 * nodeId를 모르는 카드(지도 마커·건물 내부 지도 등)는 place(동 코드 + 호실)를 넘긴다. 그러면 버튼을 누르는 순간
 * 서버 노드를 찾아서(그동안 그 버튼에 로딩 표시) — 길찾기 화면도 어차피 하는 조회를 앞당긴 것이라 요청이 늘지 않는다 —
 * - 찾으면 nodeId를 채워 길찾기 화면으로 간다(같은 캐시라 길찾기 화면은 다시 요청하지 않는다).
 * - 서버에 없으면(문이 없어 길찾기 노드를 안 만든 호실 등) 화면을 넘기지 않고 토스트로 알린다.
 * - 요청이 실패하면(네트워크 등) 그대로 넘어가서 길찾기 화면의 "다시 시도" 안내에 맡긴다.
 *
 * @param onBeforeNavigate 이동 직전에 할 일(예: 지도 탭의 시설 카드는 Modal이라 다른 탭 위에도
 *   떠 있으니 먼저 닫는다).
 */
export function useRouteButtonProps(onBeforeNavigate?: () => void) {
  const navigation = useNavigation();
  // 지금 노드를 찾고 있는 버튼. 같은 훅으로 카드 여러 장을 그릴 수 있어서 어느 카드(label)인지도 같이 기억한다.
  const [pending, setPending] = useState<{ label: string; target: RouteTarget } | null>(null);

  return useCallback(
    (label: string, nodeId?: number, place?: RoutePlace) => {
      const navigate = (target: RouteTarget, resolvedNodeId?: number) => {
        onBeforeNavigate?.();
        const routeSelection =
          target === 'departure'
            ? { departureLabel: label, departureNodeId: resolvedNodeId, departurePlace: place }
            : { destinationLabel: label, destinationNodeId: resolvedNodeId, destinationPlace: place };
        navigation.dispatch(StackActions.push('Navigation', { routeSelection }));
      };
      const goToRoute = async (target: RouteTarget) => {
        if (pending) return;
        if (nodeId !== undefined || !place) {
          navigate(target, nodeId);
          return;
        }
        setPending({ label, target });
        try {
          const found = await fetchPlaceNodeId(queryClient, place);
          if (found === undefined) {
            showErrorToast(place.room ? '길찾기를 지원하지 않는 호실이에요' : '길찾기를 지원하지 않는 장소예요');
            return;
          }
          navigate(target, found);
        } catch {
          navigate(target);
        } finally {
          setPending(null);
        }
      };
      const isPending = (target: RouteTarget) => pending?.label === label && pending.target === target;
      return {
        onDeparturePress: () => goToRoute('departure'),
        onArrivalPress: () => goToRoute('destination'),
        departureLoading: isPending('departure'),
        arrivalLoading: isPending('destination'),
      };
    },
    [navigation, onBeforeNavigate, pending],
  );
}
