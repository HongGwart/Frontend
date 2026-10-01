import { getJSON, removeItem, setJSON } from './jsonStorage';
import { STORAGE_KEYS } from './keys';

/** 온보딩을 끝까지 보고 "입학하기"를 눌렀는지. 앱을 지우면 같이 지워져서 재설치하면 다시 보인다. */
export function isOnboardingCompleted(): Promise<boolean> {
  return getJSON(STORAGE_KEYS.onboardingCompleted, false);
}

export function markOnboardingCompleted(): Promise<void> {
  return setJSON(STORAGE_KEYS.onboardingCompleted, true);
}

/** [개발용] 온보딩을 다시 보도록 완료 기록을 지운다. */
export function resetOnboarding(): Promise<void> {
  return removeItem(STORAGE_KEYS.onboardingCompleted);
}
