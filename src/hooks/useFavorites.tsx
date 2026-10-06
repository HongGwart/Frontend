import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SearchItemCategory } from '@constant/dummySearchData';
import { getJSON, setJSON } from '@storage/jsonStorage';
import { STORAGE_KEYS } from '@storage/keys';
import { toPlaceKey } from '@utils/placeKey';

/** 즐겨찾기로 저장할 장소 정보. 건물 자체면 name을 비운다. */
export interface FavoriteInput {
  /** 예: "C동" */
  buildingCode: string;
  /** 예: "인문사회관" */
  buildingName: string;
  /** 건물 안 시설/호실 이름 (예: "카페나무", "816호"). 건물 자체 즐겨찾기면 생략 */
  name?: string;
  /** 목록 아이콘을 고르는 데 쓴다 (SEARCH_ITEM_ICONS 키) */
  category?: SearchItemCategory;
  latitude?: number;
  longitude?: number;
  /** 서버 장소면 노드 id — 즐겨찾기를 길찾기 출발/도착으로 고를 때 실제 경로 탐색에 쓴다 */
  nodeId?: number;
}

/**
 * 기기에 저장되는 즐겨찾기 한 건. 사진·아이콘 같은 화면용 데이터(컴포넌트)는 JSON으로 저장할 수 없어서
 * "무엇을 즐겨찾기 했는지"만 저장하고, 카드에 그릴 정보는 화면에서 장소 데이터로 채운다(favoriteCards.ts).
 */
export interface StoredFavorite extends FavoriteInput {
  placeKey: string;
  /** 즐겨찾기한 시각(ISO). 최근 추가 순 정렬 기준 */
  createdAt: string;
}

/** 즐겨찾기 여부를 물을 때 넘기는 값 — 장소 키 문자열이나, 키를 만들 수 있는 동 코드 + 이름 */
export type FavoriteTarget = string | Pick<FavoriteInput, 'buildingCode' | 'name'>;

export const favoriteKeyOf = (target: FavoriteTarget) =>
  typeof target === 'string' ? target : toPlaceKey(target.buildingCode, target.name);

interface FavoritesContextValue {
  /** 최근 추가 순 */
  favorites: StoredFavorite[];
  /** 저장소에서 불러오기를 마쳤는지 */
  hydrated: boolean;
  isFavorite: (target: FavoriteTarget) => boolean;
  addFavorite: (input: FavoriteInput) => void;
  removeFavorite: (target: FavoriteTarget) => void;
  /** 즐겨찾기를 켜거나 끄고, 바뀐 뒤 상태(true = 등록됨)를 돌려준다 */
  toggleFavorite: (input: FavoriteInput) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/**
 * 즐겨찾기를 앱 전역에서 하나로 들고 기기 로컬(AsyncStorage)에 저장한다. 지도·검색·마이페이지·길찾기가
 * 모두 이 상태를 보고 바꾸므로, 어디서 바꿔도 모든 화면에 같이 반영되고 앱을 다시 켜도 유지된다.
 * 장소는 placeKey(동 코드 + 시설/호실 이름)로 식별한다 — 화면마다 더미 id가 달라서.
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<StoredFavorite[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    getJSON<StoredFavorite[]>(STORAGE_KEYS.favorites, []).then(saved => {
      // 불러오기 전에 바뀐 게 있으면(거의 없지만) 그쪽을 우선하고, 저장된 것 중 겹치지 않는 것만 뒤에 붙인다.
      setFavorites(prev => {
        const keys = new Set(prev.map(item => item.placeKey));
        return [...prev, ...saved.filter(item => !keys.has(item.placeKey))];
      });
      setHydrated(true);
    });
  }, []);

  // 불러온 뒤부터는 바뀔 때마다 통째로 저장한다.
  useEffect(() => {
    if (hydrated) setJSON(STORAGE_KEYS.favorites, favorites);
  }, [favorites, hydrated]);

  const favoriteKeys = useMemo(() => new Set(favorites.map(item => item.placeKey)), [favorites]);

  const isFavorite = useCallback((target: FavoriteTarget) => favoriteKeys.has(favoriteKeyOf(target)), [favoriteKeys]);

  const addFavorite = useCallback((input: FavoriteInput) => {
    const placeKey = favoriteKeyOf(input);
    setFavorites(prev => [
      { ...input, placeKey, createdAt: new Date().toISOString() },
      ...prev.filter(item => item.placeKey !== placeKey),
    ]);
  }, []);

  const removeFavorite = useCallback((target: FavoriteTarget) => {
    const placeKey = favoriteKeyOf(target);
    setFavorites(prev => prev.filter(item => item.placeKey !== placeKey));
  }, []);

  const toggleFavorite = useCallback(
    (input: FavoriteInput) => {
      const next = !favoriteKeys.has(favoriteKeyOf(input));
      if (next) addFavorite(input);
      else removeFavorite(input);
      return next;
    },
    [favoriteKeys, addFavorite, removeFavorite],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, hydrated, isFavorite, addFavorite, removeFavorite, toggleFavorite }),
    [favorites, hydrated, isFavorite, addFavorite, removeFavorite, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
