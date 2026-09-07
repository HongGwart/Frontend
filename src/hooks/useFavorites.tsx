import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DUMMY_FAVORITE_PLACES, FavoritePlace } from '@constant/dummyMypage';

interface FavoritesContextValue {
  favorites: FavoritePlace[];
  /** 즐겨찾기에서 제거 (실제 연동 전 더미 동작) */
  removeFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/**
 * 마이페이지와 즐겨찾기 목록 화면이 같은 즐겨찾기 상태를 보도록 앱 전역에서 하나로 들고 있는다.
 * (화면마다 useState를 따로 두면 한쪽에서 삭제해도 다른 쪽엔 반영되지 않는다.)
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoritePlace[]>(DUMMY_FAVORITE_PLACES);

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.filter(item => item.id !== id));
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, removeFavorite }),
    [favorites, removeFavorite],
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
