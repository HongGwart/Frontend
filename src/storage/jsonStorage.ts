import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKey } from './keys';

/**
 * 키에 저장된 JSON을 읽는다. 값이 없거나, 파싱에 실패하거나, 읽기 자체가 실패하면 fallback을 돌려준다 —
 * 로컬 저장값이 깨져도 앱은 기본 상태로 계속 동작해야 하기 때문.
 */
export async function getJSON<T>(key: StorageKey, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch (error) {
    console.warn(`[storage] ${key} 읽기 실패`, error);
    return fallback;
  }
}

/** 키에 값을 JSON으로 저장한다. 실패해도 던지지 않고 로그만 남긴다(메모리 상태로는 계속 동작). */
export async function setJSON<T>(key: StorageKey, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[storage] ${key} 저장 실패`, error);
  }
}

export async function removeItem(key: StorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`[storage] ${key} 삭제 실패`, error);
  }
}
