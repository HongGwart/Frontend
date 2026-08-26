import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchPageHeader } from '@components/common/SearchPageHeader';
import { SearchListItem } from '@components/common/SearchListItem';
import { useVoiceSearch } from '@hooks/useVoiceSearch';
import { DUMMY_RECENT_SEARCHES, DUMMY_SEARCH_RESULTS, SEARCH_ITEM_ICONS } from '@constant/dummySearchData';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onBackPress?: () => void;
}

export default function SearchScreen({ value, onChangeText, onBackPress }: Props) {
  // 마이크 버튼 -> 듣기 시작 -> 인식된 텍스트로 검색창 내용을 그대로 갱신(중간 결과 포함).
  // expo-speech-recognition은 네이티브 모듈이라 Expo Go가 아니라 dev-client 빌드에서만 동작한다.
  const { isListening, toggleListening } = useVoiceSearch({ onResult: onChangeText });

  // 삭제 가능한 "최근 검색어"는 화면 로컬 상태로 들고 있는다. 실제 API 연동 전까지의 더미 데이터.
  const [recentSearches, setRecentSearches] = useState(DUMMY_RECENT_SEARCHES);
  const removeRecentSearch = (id: string) => {
    setRecentSearches(prev => prev.filter(item => item.id !== id));
  };

  // 검색 결과 리스트에서 선택(체크)된 항목. 검색어가 바뀌면 선택을 초기화한다.
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  const trimmedValue = value.trim();
  const searchResults = useMemo(() => {
    if (!trimmedValue) return [];
    const keyword = trimmedValue.toLowerCase();
    return DUMMY_SEARCH_RESULTS.filter(item =>
      `${item.building}${item.place}${item.room ?? ''}`.toLowerCase().includes(keyword),
    );
  }, [trimmedValue]);
  // 검색어가 바뀌어 결과 목록이 달라지면 이전 선택은 더 이상 유효하지 않으므로 초기화한다.
  useEffect(() => {
    setSelectedResultId(null);
  }, [trimmedValue]);

  // 검색어가 없으면 최근 검색어를, 있으면 검색 결과를 보여준다.
  const isSearching = trimmedValue.length > 0;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.searchHeaderWrapper}>
        <SearchPageHeader
          value={value}
          onChangeText={onChangeText}
          onVoicePress={toggleListening}
          isListening={isListening}
          onBackPress={onBackPress}
        />
      </View>
      <View style={styles.content}>
        {isSearching
          ? searchResults.map((item, index) => (
              <SearchListItem
                key={item.id}
                building={item.building}
                place={item.place}
                room={item.room}
                isFavorite={item.isFavorite}
                selected={item.id === selectedResultId}
                onPress={() => setSelectedResultId(item.id)}
                showDivider={index !== searchResults.length - 1}
                {...SEARCH_ITEM_ICONS[item.category]}
              />
            ))
          : recentSearches.map((item, index) => (
              <SearchListItem
                key={item.id}
                building={item.building}
                place={item.place}
                room={item.room}
                isFavorite={item.isFavorite}
                history
                date={item.date}
                showDivider={index !== recentSearches.length - 1}
                onDeletePress={() => removeRecentSearch(item.id)}
                {...SEARCH_ITEM_ICONS[item.category]}
              />
            ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchHeaderWrapper: { marginTop: 8 },
  content: { flex: 1, marginTop: 8 },
});
