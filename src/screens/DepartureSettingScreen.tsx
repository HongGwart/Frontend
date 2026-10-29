import React, { useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import styled from 'styled-components/native';
import Header from '@components/layout/Header';
import { SearchListItem } from '@components/common/SearchListItem';
import { SearchEmptyResult } from '@components/common/SearchEmptyResult';
import { DepartureSearchBar } from '@components/mypage/DepartureSearchBar';
import { AnimatedToast } from '@components/mypage/AnimatedToast';
import { useSearchSuggestions } from '@api/search/useSearchSuggestions';
import { SEARCH_ITEM_ICONS, SearchResultItem } from '@constant/dummySearchData';
import { departureLabelOf, useDefaultDeparture } from '@hooks/useDefaultDeparture';
import { useFavorites } from '@hooks/useFavorites';
import { useIsOffline } from '@hooks/useIsOffline';

// 마이페이지 "기본 출발지" 카드의 "수정"을 누르면 오는 화면(Figma "마이페이지_기본 출발지 설정").
// 검색창에 입력하면 아래에 서버 검색 결과가 리스트로 뜨고(SearchListItem 재사용), 항목을 누르면 기본 출발지로
// 기기에 저장되면서 선택 표시(배경/체크) + 하단 토스트가 2초간 떴다 사라진다. 검색 전에는 지금 기본 출발지를
// 선택된 항목으로 보여주고, 선택된 항목을 다시 누르면 해제된다.
export default function DepartureSettingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastText, setToastText] = useState('');
  // 선택할 때마다 증가시켜 AnimatedToast를 리마운트한다(이미 떠 있어도 2초 타이머가 재시작되도록).
  const [toastKey, setToastKey] = useState(0);

  // 즐겨찾기 별은 기기 로컬에 저장된 앱 전역 상태로 표시한다.
  const { isFavorite } = useFavorites();

  const { departure, setDeparture, clearDeparture } = useDefaultDeparture();

  // 길찾기 출발지 검색과 같은 서버 검색. 서버 결과엔 nodeId가 있어서 기본 출발지로도 실제 경로 탐색을 쓴다.
  const {
    results: searchResults,
    isSearching,
    isError: searchFailed,
    error: searchError,
    retry: retrySearch,
  } = useSearchSuggestions(value);
  // 오프라인이면 검색 요청이 멈춰 있어서 "결과 없음" 대신 연결을 기다린다고 안내한다.
  const isOffline = useIsOffline();
  const results = value.trim() ? searchResults : [];

  // 지금 기본 출발지와 같은 장소면 선택 표시. 서버 장소는 nodeId로, 아니면 표시 이름으로 비교한다.
  const isCurrent = (item: SearchResultItem) =>
    !!departure &&
    (departure.nodeId !== undefined ? departure.nodeId === item.nodeId : departureLabelOf(departure) === departureLabelOf(item));

  const showToast = (text: string) => {
    setToastText(text);
    setToastVisible(true);
    setToastKey(key => key + 1);
  };

  const handleClearCurrent = () => {
    Keyboard.dismiss();
    clearDeparture();
    showToast('기본 출발지가 해제되었습니다.');
  };

  // 지금 기본 출발지를 다시 누르면 해제한다(토글).
  const handleSelect = (item: SearchResultItem) => {
    if (isCurrent(item)) {
      handleClearCurrent();
      return;
    }
    Keyboard.dismiss();
    setDeparture(item);
    showToast('기본 출발지로 설정되었습니다.');
  };

  return (
    <Container edges={['top']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.flex}>
          <Header title="기본 출발지 설정" onBackPress={() => navigation.goBack()} />
          <SearchBarWrapper>
            <DepartureSearchBar value={value} onChangeText={setValue} autoFocus />
          </SearchBarWrapper>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* 아직 검색하지 않았으면 지금 기본 출발지를 선택된 항목으로 보여준다(설정 전이면 비어 있다). */}
            {!value.trim() && departure && (
              <SearchListItem
                building={departure.building}
                place={departure.place}
                room={departure.room}
                isFavorite={isFavorite({ buildingCode: departure.building, name: departure.room })}
                selected
                showDivider={false}
                onPress={handleClearCurrent}
                {...SEARCH_ITEM_ICONS[departure.category]}
              />
            )}
            {results.map((item, index) => (
              <SearchListItem
                key={item.id}
                building={item.building}
                place={item.place}
                room={item.room}
                isFavorite={isFavorite({ buildingCode: item.building, name: item.room })}
                selected={isCurrent(item)}
                showDivider={index !== results.length - 1}
                onPress={() => handleSelect(item)}
                {...SEARCH_ITEM_ICONS[item.category]}
              />
            ))}
            {!!value.trim() && isOffline && results.length === 0 && <SearchEmptyResult offline />}
            {!!value.trim() && !isOffline && searchFailed && <SearchEmptyResult error={searchError} onRetry={retrySearch} />}
            {!!value.trim() && !isOffline && !isSearching && !searchFailed && results.length === 0 && <SearchEmptyResult />}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>

      {toastVisible && (
        <AnimatedToast
          key={toastKey}
          text={toastText}
          variant="success"
          bottomOffset={insets.bottom + 12}
          onHide={() => setToastVisible(false)}
        />
      )}
    </Container>
  );
}

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

// 헤더 → 8px → 검색창 (Figma gap-8)
const SearchBarWrapper = styled.View`
  padding: 8px 20px 0;
`;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // 검색창 → 16px → 리스트 (Figma gap-16). flexGrow: 결과가 없을 때 SearchEmptyResult가 남은 공간 정중앙에 오게 한다.
  listContent: { paddingTop: 16, flexGrow: 1 },
});
