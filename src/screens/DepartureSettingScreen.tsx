import React, { useMemo, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import styled from 'styled-components/native';
import Header from '@components/layout/Header';
import { SearchListItem } from '@components/common/SearchListItem';
import { DepartureSearchBar } from '@components/mypage/DepartureSearchBar';
import { AnimatedToast } from '@components/mypage/AnimatedToast';
import { DUMMY_DEPARTURE_SEARCH_RESULTS } from '@constant/dummyMypage';
import { SEARCH_ITEM_ICONS } from '@constant/dummySearchData';

// 마이페이지 "기본 출발지" 카드의 "수정"을 누르면 오는 화면(Figma "마이페이지_기본 출발지 설정").
// 검색창에 입력하면 아래에 일치하는 장소가 리스트로 뜨고(SearchListItem 재사용),
// 항목을 누르면 선택 표시(배경/체크) + 하단 토스트가 2초간 떴다 사라진다.
export default function DepartureSettingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  // 선택할 때마다 증가시켜 AnimatedToast를 리마운트한다(이미 떠 있어도 2초 타이머가 재시작되도록).
  const [toastKey, setToastKey] = useState(0);

  const keyword = value.trim().toLowerCase();
  const results = useMemo(() => {
    if (!keyword) return [];
    return DUMMY_DEPARTURE_SEARCH_RESULTS.filter(item =>
      `${item.building}${item.place}${item.room ?? ''}`.toLowerCase().includes(keyword),
    );
  }, [keyword]);

  const handleSelect = (id: string) => {
    Keyboard.dismiss();
    setSelectedId(id);
    setToastVisible(true);
    setToastKey(key => key + 1);
    // TODO: 실제 연동 시 선택한 위치를 기본 출발지로 저장하고, 필요하면 화면을 닫는다.
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
                isFavorite={item.isFavorite}
                selected={selectedId === item.id}
                showDivider={index !== results.length - 1}
                onPress={() => handleSelect(item.id)}
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
