import React, { useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import styled from 'styled-components/native';
import Header from '@components/layout/Header';
import { SearchListItem } from '@components/common/SearchListItem';
import { DepartureSearchBar } from '@components/mypage/DepartureSearchBar';
import { AnimatedToast } from '@components/mypage/AnimatedToast';
import { useSearchSuggestions } from '@api/search/useSearchSuggestions';
import { SEARCH_ITEM_ICONS, SearchResultItem } from '@constant/dummySearchData';
import { departureLabelOf, useDefaultDeparture } from '@hooks/useDefaultDeparture';
import { useFavorites } from '@hooks/useFavorites';

// 마이페이지 "기본 출발지" 카드의 "수정"을 누르면 오는 화면(Figma "마이페이지_기본 출발지 설정").
// 검색창에 입력하면 아래에 서버 검색 결과가 리스트로 뜨고(SearchListItem 재사용), 항목을 누르면 기본 출발지로
// 기기에 저장되면서 선택 표시(배경/체크) + 하단 토스트가 2초간 떴다 사라진다.
export default function DepartureSettingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  // 선택할 때마다 증가시켜 AnimatedToast를 리마운트한다(이미 떠 있어도 2초 타이머가 재시작되도록).
  const [toastKey, setToastKey] = useState(0);

  // 즐겨찾기 별은 기기 로컬에 저장된 앱 전역 상태로 표시한다.
  const { isFavorite } = useFavorites();

  const { departure, setDeparture } = useDefaultDeparture();

  // 길찾기 출발지 검색과 같은 서버 검색. 서버 결과엔 nodeId가 있어서 기본 출발지로도 실제 경로 탐색을 쓴다.
  const { results: searchResults } = useSearchSuggestions(value);
  const results = value.trim() ? searchResults : [];

  // 지금 기본 출발지와 같은 장소면 선택 표시. 서버 장소는 nodeId로, 아니면 표시 이름으로 비교한다.
  const isCurrent = (item: SearchResultItem) =>
    !!departure &&
    (departure.nodeId !== undefined ? departure.nodeId === item.nodeId : departureLabelOf(departure) === departureLabelOf(item));

  const handleSelect = (item: SearchResultItem) => {
    Keyboard.dismiss();
    setDeparture(item);
    setToastVisible(true);
    setToastKey(key => key + 1);
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
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>

      {toastVisible && (
        <AnimatedToast
          key={toastKey}
          text="기본 출발지로 설정되었습니다."
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
  // 검색창 → 16px → 리스트 (Figma gap-16)
  listContent: { paddingTop: 16 },
});
