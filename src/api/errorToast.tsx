import React, { useSyncExternalStore } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedToast } from '@components/mypage/AnimatedToast';

/**
 * API 실패를 화면 아래 경고 토스트로 띄우는 전역 저장소 + 표시 컴포넌트. queryClient의 전역 onError가
 * showErrorToast를 부르고, App 루트의 <ApiErrorToastHost />가 그린다. 화면에서 직접 부를 수도 있다.
 */
type ToastState = { key: number; message: string } | null;

let state: ToastState = null;
let lastShownAt = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());

// 같은 문구가 이 시간 안에 또 오면 무시한다(예: 오프라인에서 여러 요청이 한꺼번에 실패).
const DEDUPE_MS = 2500;

export function showErrorToast(message: string) {
  const now = Date.now();
  if (state?.message === message && now - lastShownAt < DEDUPE_MS) return;
  lastShownAt = now;
  state = { key: (state?.key ?? 0) + 1, message };
  emit();
}

function hideErrorToast() {
  state = null;
  emit();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => state;

export function ApiErrorToastHost() {
  const toast = useSyncExternalStore(subscribe, getSnapshot);
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  return (
    <AnimatedToast
      key={toast.key}
      text={toast.message}
      variant="warning"
      bottomOffset={insets.bottom + 16}
      onHide={hideErrorToast}
    />
  );
}
