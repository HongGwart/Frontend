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
import { StoredFavorite, useFavorites } from '@hooks/useFavorites';

function formatLocationLabel(item: SearchResultItem) {
  return [item.building, item.place, item.room].filter(Boolean).join(' ');
}

/** 저장된 즐겨찾기를 검색 결과 항목 모양으로 바꿔서 같은 리스트 아이템/라벨 규칙을 그대로 쓴다. */
function favoriteToSearchItem(favorite: StoredFavorite): SearchResultItem {
  return {
    id: `favorite-${favorite.placeKey}`,
    building: favorite.buildingCode,
    place: favorite.buildingName,
    room: favorite.name,
    category: favorite.category ?? 'building',
    isFavorite: true,
  };
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

  // 검색어가 없을 땐 기기에 저장된 즐겨찾기를 맨 위에 먼저 보여줘서 바로 고를 수 있게 한다.
  const { favorites, isFavorite } = useFavorites();
  const favoriteItems = useMemo(() => (keyword ? [] : favorites.map(favoriteToSearchItem)), [keyword, favorites]);

  const handleSelect = (item: SearchResultItem) => {
    Keyboard.dismiss();
    const label = formatLocationLabel(item);
    // 방금 고른 쪽만 새 값으로 바꾸고, 나머지 한쪽은 넘어올 때 받아온 값(이미 골라둔 값)을
    // 그대로 들고 돌아가서 길찾기 화면에서 두 값이 서로 덮어쓰지 않게 한다. popTo는 스택에
    // 이미 있는 Navigation 화면 인스턴스로 되돌아가면서 이 params를 merge한다(새로 안 만듦).
    navigation.popTo('Navigation', {
      routeSelection: {
        departureLabel: params.target === 'departure' ? label : params.departureLabel,
        destinationLabel: params.target === 'destination' ? label : params.destinationLabel,
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
            {favoriteItems.length > 0 && (
              <>
                <SectionTitle>즐겨찾기</SectionTitle>
                {favoriteItems.map((item, index) => (
                  <SearchListItem
                    key={item.id}
                    building={item.building}
                    place={item.place}
                    room={item.room}
                    isFavorite
                    showDivider={index !== favoriteItems.length - 1}
                    onPress={() => handleSelect(item)}
                    {...SEARCH_ITEM_ICONS[item.category]}
                  />
                ))}
                <SectionTitle>전체</SectionTitle>
              </>
            )}
            {results.map((item, index) => (
              <SearchListItem
                key={item.id}
                building={item.building}
                place={item.place}
                room={item.room}
                isFavorite={isFavorite({ buildingCode: item.building, name: item.room })}
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

const SectionTitle = styled.Text`
  padding: 12px 20px 4px;
  font-family: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.semiBold.lineHeight}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const SearchBarWrapper = styled.View`
  padding: 8px 20px 0;
`;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { paddingTop: 16 },
});
