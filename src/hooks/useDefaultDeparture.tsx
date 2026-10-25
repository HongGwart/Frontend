import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SearchResultItem } from '@constant/dummySearchData';
import { getJSON, removeItem, setJSON } from '@storage/jsonStorage';
import { STORAGE_KEYS } from '@storage/keys';

/** 기기에 저장하는 기본 출발지. 검색 결과 항목에서 화면 표시·길찾기에 필요한 값만 남긴다. */
export type DefaultDeparture = Pick<SearchResultItem, 'building' | 'place' | 'room' | 'category' | 'nodeId'>;

/** 길찾기 입력창에 넣는 라벨 ("C동 인문사회관 816호") — 출발지/도착지 검색에서 고른 값과 같은 규칙 */
export const departureLabelOf = (departure: DefaultDeparture) =>
  [departure.building, departure.place, departure.room].filter(Boolean).join(' ');

interface DefaultDepartureContextValue {
  /** 설정 전이면 null */
  departure: DefaultDeparture | null;
  setDeparture: (item: DefaultDeparture) => void;
  clearDeparture: () => void;
}

const DefaultDepartureContext = createContext<DefaultDepartureContextValue | null>(null);

/**
 * 기본 출발지를 앱 전역에서 하나로 들고 기기 로컬(AsyncStorage)에 저장한다. 마이페이지에서 설정하면 길찾기의
 * "기본 출발지" 버튼에 바로 반영되고, 앱을 다시 켜도 유지된다. 서버 장소면 nodeId도 저장해서 실제 경로 탐색에 쓴다.
 */
export function DefaultDepartureProvider({ children }: { children: React.ReactNode }) {
  const [departure, setDepartureState] = useState<DefaultDeparture | null>(null);

  useEffect(() => {
    getJSON<DefaultDeparture | null>(STORAGE_KEYS.defaultDeparture, null).then(saved => {
      // 불러오기 전에 이미 새로 설정했으면 그 값이 더 최근이라 덮어쓰지 않는다.
      setDepartureState(prev => prev ?? saved);
    });
  }, []);

  const setDeparture = useCallback((item: DefaultDeparture) => {
    const next: DefaultDeparture = {
      building: item.building,
      place: item.place,
      room: item.room,
      category: item.category,
      nodeId: item.nodeId,
    };
    setDepartureState(next);
    setJSON(STORAGE_KEYS.defaultDeparture, next);
  }, []);

  const clearDeparture = useCallback(() => {
    setDepartureState(null);
    removeItem(STORAGE_KEYS.defaultDeparture);
  }, []);

  const value = useMemo(() => ({ departure, setDeparture, clearDeparture }), [departure, setDeparture, clearDeparture]);
  return <DefaultDepartureContext.Provider value={value}>{children}</DefaultDepartureContext.Provider>;
}

export function useDefaultDeparture() {
  const context = useContext(DefaultDepartureContext);
  if (!context) throw new Error('useDefaultDeparture must be used within a DefaultDepartureProvider');
  return context;
}
