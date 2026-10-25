import { useCallback, useEffect, useRef } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';

/**
 * 다른 화면으로 넘어가면서 지금 화면의 무언가(예: 시설 카드)를 닫아야 할 때, 바로 닫으면 새 화면이
 * 밀려 들어오는 동안 카드가 툭 사라지는 게 보인다. 대신 반환된 함수로 "닫기 예약"을 걸어두면, 새
 * 화면이 이 화면을 완전히 덮은 순간(native-stack transitionEnd, closing: true)에 조용히 닫는다.
 * 전환 이벤트를 못 받는 경우(애니메이션 없음 등)에 대비해, 이 화면에 다시 돌아와 포커스될 때라도 닫는다.
 *
 * @param stackNavigation 이 화면이 속한 최상위 스택 화면의 navigation (탭 안 화면이면 getParent()로 구한 것)
 * @param onClose 닫는 동작. 매 렌더 새로 만들지 않도록 useCallback으로 넘긴다.
 */
export function useCloseWhenCovered(
  stackNavigation: NativeStackNavigationProp<RootStackParamList> | undefined,
  onClose: () => void,
) {
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!stackNavigation) return;
    const close = () => {
      if (!pendingRef.current) return;
      pendingRef.current = false;
      onClose();
    };
    const unsubscribeTransition = stackNavigation.addListener('transitionEnd', event => {
      if (event.data.closing) close();
    });
    const unsubscribeFocus = stackNavigation.addListener('focus', close);
    return () => {
      unsubscribeTransition();
      unsubscribeFocus();
    };
  }, [stackNavigation, onClose]);

  return useCallback(() => {
    pendingRef.current = true;
  }, []);
}
