import React, { useMemo, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from 'styled-components/native';
import Header from '@components/layout/Header';
import { SearchListItem } from '@components/common/SearchListItem';
import { DepartureSearchBar } from '@components/mypage/DepartureSearchBar';
import { useSearchSuggestions } from '@api/search/useSearchSuggestions';
import { useIndoorRoomCandidates } from '@api/search/useIndoorRoomCandidates';
import { buildIndoorRoomQuery } from '@api/search/indoorRoomCandidates';
import { floorLabel } from '@api/route/toRouteView';
import { USE_MOCK_API } from '@api/config';
import { DUMMY_SEARCH_RESULTS, SEARCH_ITEM_ICONS, SearchResultItem } from '@constant/dummySearchData';
import { RootStackParamList } from '@navigation/types';
import { StoredFavorite, useFavorites } from '@hooks/useFavorites';

function formatLocationLabel(item: SearchResultItem) {
  return item.displayName || [item.building, item.place, item.room].filter(Boolean).join(' ');
}

/** 저장된 즐겨찾기를 검색 결과 항목 모양으로 바꿔서 같은 리스트 아이템/라벨 규칙을 그대로 쓴다. */
function favoriteToSearchItem(favorite: StoredFavorite): SearchResultItem {
  return {
    id: `favorite-${favorite.placeKey}`,
    nodeId: favorite.nodeId,
    placeId: favorite.placeId,
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
  const indoorRoom = params.indoorRoom;
  const [value, setValue] = useState(() => indoorRoom ? buildIndoorRoomQuery(indoorRoom) : '');

  const keyword = value.trim().toLowerCase();
  const { results: searchResults } = useSearchSuggestions(indoorRoom ? '' : value);
  const indoorSearch = useIndoorRoomCandidates(indoorRoom, value);
  const results = keyword ? searchResults : USE_MOCK_API ? DUMMY_SEARCH_RESULTS : [];

  // 검색어가 없을 땐 기기에 저장된 즐겨찾기를 맨 위에 먼저 보여줘서 바로 고를 수 있게 한다.
  const { favorites, isFavorite } = useFavorites();
  const favoriteItems = useMemo(
    () => (keyword || indoorRoom ? [] : favorites.map(favoriteToSearchItem)),
    [keyword, indoorRoom, favorites],
  );

  const handleSelect = (item: SearchResultItem) => {
    Keyboard.dismiss();
    const label = formatLocationLabel(item);
    // 방금 고른 쪽만 새 값으로 바꾸고, 나머지 한쪽은 넘어올 때 받아온 값(이미 골라둔 값)을
    // 그대로 들고 돌아가서 길찾기 화면에서 두 값이 서로 덮어쓰지 않게 한다.
    // 기존 길찾기는 popTo로 복귀하고, 도면에서 처음 시작하면 후보 화면만 교체한다.
    const next = {
      indoorBuilding: params.indoorBuilding,
      routeSelection: {
        departureLabel: params.target === 'departure' ? label : params.departureLabel,
        destinationLabel: params.target === 'destination' ? label : params.destinationLabel,
        departureNodeId: params.target === 'departure' ? item.nodeId : params.departureNodeId,
        destinationNodeId: params.target === 'destination' ? item.nodeId : params.destinationNodeId,
        departurePlaceId: params.target === 'departure' ? item.placeId : params.departurePlaceId,
        destinationPlaceId: params.target === 'destination' ? item.placeId : params.destinationPlaceId,
      },
    };
    if (params.returnToNavigation === false) navigation.replace('Navigation', next);
    else navigation.popTo('Navigation', next);
  };

  const title = indoorRoom
    ? params.target === 'departure' ? '출발할 호실 선택' : '도착할 호실 선택'
    : params.target === 'departure' ? '출발지 검색' : '도착지 검색';

  return (
    <Container edges={['top']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.flex}>
          <Header title={title} onBackPress={() => navigation.goBack()} />
          {indoorRoom && (
            <ContextText>
              {indoorRoom.buildingCode} {floorLabel(indoorRoom.floor)} · {indoorRoom.roomLabel.replace(/호$/, '')}호{'\n'}
              도면에서 고른 호실에 해당하는 장소를 선택해 주세요.
            </ContextText>
          )}
          <SearchBarWrapper>
            <DepartureSearchBar value={value} onChangeText={setValue} autoFocus={!indoorRoom} />
          </SearchBarWrapper>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {!indoorRoom && params.indoorBuilding && (
              <CandidateButton
                accessibilityRole="button"
                onPress={() => navigation.push('BuildingIndoor', {
                  ...params.indoorBuilding!,
                  description: '',
                  routeSelection: {
                    departureLabel: params.departureLabel,
                    destinationLabel: params.destinationLabel,
                    departureNodeId: params.departureNodeId,
                    destinationNodeId: params.destinationNodeId,
                    departurePlaceId: params.departurePlaceId,
                    destinationPlaceId: params.destinationPlaceId,
                  },
                  returnToNavigation: true,
                })}
              >
                <CandidateTitle>{params.indoorBuilding.buildingCode} 도면에서 선택</CandidateTitle>
              </CandidateButton>
            )}
            {indoorRoom && (
              <>
                {indoorSearch.isLoading && <ContextText>이 층의 장소를 찾고 있어요</ContextText>}
                {indoorSearch.isError && (
                  <>
                    <ContextText>장소를 불러오지 못했어요. 다시 시도해 주세요.</ContextText>
                    <CandidateButton accessibilityRole="button" onPress={() => void indoorSearch.refetch()}>
                      <CandidateTitle>다시 시도</CandidateTitle>
                    </CandidateButton>
                  </>
                )}
                {!keyword && <ContextText>호실명이나 시설명을 입력해 주세요.</ContextText>}
                {indoorSearch.status === 'success' && keyword && indoorSearch.candidates.length === 0 && (
                  <ContextText>이 층에서 일치하는 장소를 찾지 못했어요. 호실명이나 시설명을 바꿔 검색해 주세요.</ContextText>
                )}
                {indoorSearch.candidates.map(candidate => (
                  <CandidateButton
                    key={candidate.item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${candidate.item.displayName ?? candidate.item.place}, ${candidate.locationLabel}`}
                    onPress={() => handleSelect(candidate.item)}
                  >
                    <CandidateTitle>{candidate.item.displayName ?? candidate.item.place}</CandidateTitle>
                    <CandidateSubtitle>{candidate.locationLabel}</CandidateSubtitle>
                  </CandidateButton>
                ))}
              </>
            )}
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
            {!indoorRoom && results.map((item, index) => (
              <SearchListItem
                key={item.id}
                building={item.building}
                place={item.place}
                room={item.room}
                isFavorite={isFavorite({ buildingCode: item.building, name: item.room, nodeId: item.nodeId, placeId: item.placeId })}
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

const ContextText = styled.Text`
  padding: 12px 20px;
  font-size: 14px;
  line-height: 22px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const CandidateButton = styled.Pressable`
  padding: 16px 20px;
  gap: 6px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.semantic.line.tertiary};
`;

const CandidateTitle = styled.Text`
  font-size: 16px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const CandidateSubtitle = styled.Text`
  font-size: 14px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { paddingTop: 16 },
});
