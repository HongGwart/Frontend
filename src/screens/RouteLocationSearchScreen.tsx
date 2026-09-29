import React, { useMemo, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from 'styled-components/native';
import Header from '@components/layout/Header';
import { SearchListItem } from '@components/common/SearchListItem';
import { DepartureSearchBar } from '@components/mypage/DepartureSearchBar';
import { DUMMY_SEARCH_RESULTS, SEARCH_ITEM_ICONS, SearchResultItem } from '@constant/dummySearchData';
import { RootStackParamList } from '@navigation/types';

function formatLocationLabel(item: SearchResultItem) {
  return [item.building, item.place, item.room].filter(Boolean).join(' ');
}

// 길찾기 화면의 출발지/도착지 입력창을 누르면 오는 검색 화면. DepartureSettingScreen(마이페이지
// "기본 출발지 설정")과 같은 뼈대(검색창 + SearchListItem 리스트)를 그대로 쓰되, 항목을 고르면
// 여기서 값을 들고 있는 대신 길찾기 탭으로 routeSelection 파라미터를 실어 돌아간다.
export default function RouteLocationSearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'RouteLocationSearch'>>();
  const [value, setValue] = useState('');

  const keyword = value.trim().toLowerCase();
  // 검색어가 없으면 전체 목록을, 있으면 필터링된 결과를 보여준다(길찾기는 최근 검색어 개념이 없다).
  const results = useMemo(() => {
    if (!keyword) return DUMMY_SEARCH_RESULTS;
    return DUMMY_SEARCH_RESULTS.filter(item =>
      `${item.building}${item.place}${item.room ?? ''}`.toLowerCase().includes(keyword),
    );
  }, [keyword]);

  const handleSelect = (item: SearchResultItem) => {
    Keyboard.dismiss();
    const label = formatLocationLabel(item);
    // 방금 고른 쪽만 새 값으로 바꾸고, 나머지 한쪽은 넘어올 때 받아온 값(이미 골라둔 값)을
    // 그대로 들고 돌아가서 길찾기 화면에서 두 값이 서로 덮어쓰지 않게 한다.
    // navigate('MainTabs')는 (React Navigation 7에선) 기존 탭 화면으로 돌아가지 않고 새 MainTabs를 위에
    // 쌓는다 — 검색할 때마다 탭 화면이 겹겹이 쌓이지 않게, 이미 있는 MainTabs로 되돌아간다.
    navigation.popTo('MainTabs', {
      screen: 'navigation',
      params: {
        routeSelection: {
          departureLabel: params.target === 'departure' ? label : params.departureLabel,
          destinationLabel: params.target === 'destination' ? label : params.destinationLabel,
        },
      },
    });
  };

  const title = params.target === 'departure' ? '출발지 검색' : '도착지 검색';

  return (
    <Container edges={['top']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.flex}>
          <Header title={title} onBackPress={() => navigation.goBack()} />
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
                showDivider={index !== results.length - 1}
                onPress={() => handleSelect(item)}
                {...SEARCH_ITEM_ICONS[item.category]}
              />
            ))}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </Container>
  );
}

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

const SearchBarWrapper = styled.View`
  padding: 8px 20px 0;
`;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { paddingTop: 16 },
});
