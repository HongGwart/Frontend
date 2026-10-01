/**
 * AsyncStorage 키 모음. 저장 형식이 바뀌면 끝의 버전을 올려서 이전 형식 값은 읽지 않게 한다
 * (필요하면 이전 키를 읽어 변환하는 코드를 따로 둔다).
 */
export const STORAGE_KEYS = {
  onboardingCompleted: '@honggwart/onboarding-completed:v1',
  favorites: '@honggwart/favorites:v1',
  recentSearches: '@honggwart/recent-searches:v1',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
