import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * 스택 화면이 아니라 화면 안 로컬 state로 여는 상세(예: PlaceMapDetailView)는 Android 시스템
 * 뒤로가기를 내비게이터가 처리해 버린다 — 탭 화면이면 첫 탭(map)으로 가고, 스택 화면이면 화면째
 * pop된다. 상세가 열려 있고 이 화면이 포커스돼 있는 동안에만 뒤로가기를 가로채서 상세만 닫는다.
 *
 * @param isOpen 상세가 열려 있는지
 * @param onClose 닫는 동작. 매 렌더 새로 만들지 않도록 useCallback으로 넘긴다.
 */
export function useCloseOnHardwareBack(isOpen: boolean, onClose: () => void) {
  useFocusEffect(
    useCallback(() => {
      if (!isOpen) return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        onClose();
        return true;
      });
      return () => subscription.remove();
    }, [isOpen, onClose]),
  );
}
