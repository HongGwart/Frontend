import { useCallback, useEffect, useState } from 'react';
import { RecentSearchItem, SearchResultItem } from '@constant/dummySearchData';
import { getJSON, setJSON } from '@storage/jsonStorage';
import { STORAGE_KEYS } from '@storage/keys';
import { toPlaceKey } from '@utils/placeKey';

// 최근 검색어는 이 개수까지만 남기고, 넘치면 오래된 것부터 버린다.
const MAX_RECENT_SEARCHES = 20;

const keyOf = (item: SearchResultItem) => toPlaceKey(item.building, item.room);

/** 같은 장소는 하나만(앞쪽 = 더 최근 것을 남김) 두고 최대 개수로 자른다. */
function dedupe(items: RecentSearchItem[]) {
  const seen = new Set<string>();
  return items
    .filter(item => {
      const key = keyOf(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_RECENT_SEARCHES);
}

/** 저장 시각(ISO)을 목록에 보여줄 "MM.DD" 형식으로 바꾼다. */
export function formatSearchedDate(searchedAt: string) {
  const date = new Date(searchedAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

/**
 * 검색 화면의 "최근 검색한 장소". 기기 로컬(AsyncStorage)에 저장해서 앱을 다시 켜도 남는다.
 * 검색 결과(또는 최근 검색어)를 탭해 실제로 찾아간 장소만 쌓고, 가장 최근 것이 맨 위에 온다.
 */
export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    getJSON<RecentSearchItem[]>(STORAGE_KEYS.recentSearches, []).then(saved => {
      // 불러오기 전에 이미 추가된 항목이 있으면 그게 더 최근이라 앞에 둔다.
      setRecentSearches(prev => dedupe([...prev, ...saved]));
      setHydrated(true);
    });
  }, []);

  // 불러온 뒤부터는 바뀔 때마다 통째로 저장한다(최대 20개라 충분히 작다).
  useEffect(() => {
    if (hydrated) setJSON(STORAGE_KEYS.recentSearches, recentSearches);
  }, [recentSearches, hydrated]);

  const addRecentSearch = useCallback((item: SearchResultItem) => {
    // 즐겨찾기 여부는 저장하지 않는다 — 화면에서 즐겨찾기 상태로 그때그때 계산한다.
    const { isFavorite: _isFavorite, ...rest } = item;
    const entry: RecentSearchItem = { ...rest, searchedAt: new Date().toISOString() };
    setRecentSearches(prev => dedupe([entry, ...prev]));
  }, []);

  const removeRecentSearch = useCallback((item: SearchResultItem) => {
    const key = keyOf(item);
    setRecentSearches(prev => prev.filter(saved => keyOf(saved) !== key));
  }, []);

  const clearRecentSearches = useCallback(() => setRecentSearches([]), []);

  return { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches };
}
