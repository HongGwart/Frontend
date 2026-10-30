import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';

/**
 * 지금 인터넷에 연결돼 있지 않은지(queryClient의 onlineManager — expo-network 연결 상태). 오프라인 동안 서버 요청은
 * 실패하지 않고 멈춰 있다가 연결되면 이어서 보내지므로, 화면은 "결과 없음"·"실패" 대신 연결을 기다린다고 안내한다.
 */
export function useIsOffline(): boolean {
  return useSyncExternalStore(
    onStoreChange => onlineManager.subscribe(onStoreChange),
    () => !onlineManager.isOnline(),
  );
}
