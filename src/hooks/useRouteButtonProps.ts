import { useCallback } from 'react';
import { StackActions, useNavigation } from '@react-navigation/native';

/** 출발/도착 입력창에 넣을 장소 이름. 빈 값은 빼고 공백으로 잇는다 (예: "T동 제4공학관 212호"). */
export function toRoutePlaceLabel(...parts: (string | null | undefined | false)[]) {
  return parts.filter(Boolean).join(' ');
}

/**
 * 시설/건물 카드(FacilityInfoCard)의 출발/도착 버튼에 그대로 펼쳐 넣을 핸들러를 만든다.
 * 누르면 길찾기 탭으로 가서 해당 입력창을 label로 채운다(NavigationScreen이 routeSelection
 * 파라미터를 받아 반영). 스택 위 화면(건물 내부 지도, 검색)에서 누르면 MainTabs까지 되돌아가고,
 * 탭 안(지도 탭)에서 누르면 탭만 바뀐다.
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
        // 새로 들어가는 것이니 이전 입력은 비우고(resetKey) 이 값 하나만 채운다.
        const tabParams = { routeSelection, resetKey: Date.now() };
        // 이미 탭 안(지도 탭 등)이면 탭만 바꾸면 되고, 스택 위 화면이면 MainTabs까지 되돌아간다.
        if (navigation.getState()?.routeNames.includes('navigation')) {
          navigation.navigate('MainTabs', { screen: 'navigation', params: tabParams });
          return;
        }
        navigation.dispatch(StackActions.popTo('MainTabs', { screen: 'navigation', params: tabParams }));
      };
      return {
        onDeparturePress: () => goToRoute('departure'),
        onArrivalPress: () => goToRoute('destination'),
      };
    },
    [navigation, onBeforeNavigate],
  );
}
