import { useCallback } from 'react';
import { StackActions, useNavigation } from '@react-navigation/native';

/** 출발/도착 입력창에 넣을 장소 이름. 빈 값은 빼고 공백으로 잇는다 (예: "T동 제4공학관 212호"). */
export function toRoutePlaceLabel(...parts: (string | null | undefined | false)[]) {
  return parts.filter(Boolean).join(' ');
}

/**
 * 시설/건물 카드(FacilityInfoCard)의 출발/도착 버튼에 그대로 펼쳐 넣을 핸들러를 만든다.
 * 누르면 길찾기 화면(루트 스택의 Navigation)을 새로 push해서 해당 입력창을 label로 채운다
 * (NavigationScreen이 routeSelection 파라미터를 받아 반영). dispatch(StackActions.push(...))는
 * 호출 지점이 탭 안(지도 탭)이든 스택 위 화면(건물 내부 지도, 검색)이든 상관없이 이 액션을 처리할
 * 수 있는 가장 가까운 스택 내비게이터(루트 스택)까지 자동으로 bubble돼서 항상 같은 방식으로 동작한다.
 *
 * @param onBeforeNavigate 이동 직전에 할 일(예: 지도 탭의 시설 카드는 Modal이라 다른 탭 위에도
 *   떠 있으니 먼저 닫는다).
 */
export function useRouteButtonProps(onBeforeNavigate?: () => void) {
  const navigation = useNavigation();

  return useCallback(
    (label: string) => {
      const goToRoute = (target: 'departure' | 'destination') => {
        onBeforeNavigate?.();
        const routeSelection = target === 'departure' ? { departureLabel: label } : { destinationLabel: label };
        navigation.dispatch(StackActions.push('Navigation', { routeSelection }));
      };
      return {
        onDeparturePress: () => goToRoute('departure'),
        onArrivalPress: () => goToRoute('destination'),
      };
    },
    [navigation, onBeforeNavigate],
  );
}
