import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import styled, { useTheme } from 'styled-components/native';
import { NaverMapView, NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import SearchIcon from '@assets/svgs/icons/search.svg';
import { SearchBar } from '@components/common/SearchBar';
import { SearchPageHeader } from '@components/common/SearchPageHeader';
import { SearchListItem } from '@components/common/SearchListItem';
import { CategoryChipList } from '@components/common/CategoryChipList';
import { FacilityInfoCard } from '@components/common/FacilityInfoCard';
import {
  DismissibleBottomSheet,
  DismissibleBottomSheetRef,
} from '@components/common/DismissibleBottomSheet';
import NavigationBar from '@components/layout/NavigationBar';
import { NaverMapMarker } from '@components/map/NaverMapMarker';
import { NaverMapCategoryMarker } from '@components/map/NaverMapCategoryMarker';
import { useVoiceSearch } from '@hooks/useVoiceSearch';
import { CategoryKey } from '@constant/categoryChips';
import { CATEGORY_MARKER_ICONS } from '@constant/categoryMarkerIcons';
import {
  DUMMY_MAP_MARKERS,
  DUMMY_CATEGORY_MARKERS,
  DummyMapMarker,
  DummyCategoryMarker,
} from '@constant/dummyMapMarkers';
import { DUMMY_FACILITY_COUNTS, DUMMY_MAIN_ENTRANCE, DUMMY_OPERATING_HOURS } from '@constant/dummyFacilityInfo';
import {
  DUMMY_RECENT_SEARCHES,
  DUMMY_SEARCH_RESULTS,
  SEARCH_ITEM_ICONS,
  SearchResultItem,
} from '@constant/dummySearchData';

// 지도 화면(MapScreen)과 동일한 형태. 검색 뷰 안에서 지도를 띄울 때도 마커를 직접
// 탭한 것과 같은 방식으로 시설 정보 바텀시트를 채운다.
type SelectedFacility =
  | { type: 'dong'; marker: DummyMapMarker }
  | { type: 'category'; marker: DummyCategoryMarker };

// 검색 결과 항목(건물/호실)에 대응하는 지도 더미 마커를 찾는다.
// 지도/검색 더미 데이터가 각각 따로 채워져 있어 건물 코드나 호실명이 정확히
// 일치하지 않는 경우가 많다(예: "S동 학생회관 식당" vs 지도의 "G동 학생회관 학생 식당").
// 정확히 일치하는 카테고리(시설) 마커가 없으면, 같은 건물의 동 마커로라도 폴백해서
// 어떤 검색 결과를 눌러도 최소한 카드는 뜨도록 한다.
function findFacilityForSearchItem(item: SearchResultItem): SelectedFacility | null {
  if (item.category === 'building') {
    const marker = DUMMY_MAP_MARKERS.find(m => m.label === item.building);
    return marker ? { type: 'dong', marker } : null;
  }
  const categoryMarker = DUMMY_CATEGORY_MARKERS.find(
    m => m.buildingCode === item.building && m.room === item.room,
  );
  if (categoryMarker) return { type: 'category', marker: categoryMarker };

  const dongMarker = DUMMY_MAP_MARKERS.find(m => m.label === item.building);
  return dongMarker ? { type: 'dong', marker: dongMarker } : null;
}

// react-navigation 스택 화면으로 등록되기 전까지는 App.tsx가 이 값을 들고 있었는데,
// 다른 화면에서 쓰지 않아서 스택 전환으로 옮기며 그냥 이 화면 로컬 상태로 내렸다.
export default function SearchScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [value, setValue] = useState('');
  // 마이크 버튼 -> 듣기 시작 -> 인식된 텍스트로 검색창 내용을 그대로 갱신(중간 결과 포함).
  // expo-speech-recognition은 네이티브 모듈이라 Expo Go가 아니라 dev-client 빌드에서만 동작한다.
  const { isListening, toggleListening } = useVoiceSearch({ onResult: setValue });

  // 삭제 가능한 "최근 검색어"는 화면 로컬 상태로 들고 있는다. 실제 API 연동 전까지의 더미 데이터.
  const [recentSearches, setRecentSearches] = useState(DUMMY_RECENT_SEARCHES);
  const removeRecentSearch = (id: string) => {
    setRecentSearches(prev => prev.filter(item => item.id !== id));
  };

  const trimmedValue = value.trim();
  const searchResults = useMemo(() => {
    if (!trimmedValue) return [];
    const keyword = trimmedValue.toLowerCase();
    return DUMMY_SEARCH_RESULTS.filter(item =>
      `${item.building}${item.place}${item.room ?? ''}`.toLowerCase().includes(keyword),
    );
  }, [trimmedValue]);

  // 검색어가 없으면 최근 검색어를, 있으면 검색 결과를 보여준다.
  const isSearching = trimmedValue.length > 0;

  // 검색 결과를 탭하면 다른 화면으로 이동하지 않고, 검색 뷰 안의 리스트(흰 배경)를
  // 네이버 지도로 바꿔치기한 뒤 그 위에 시설 정보 카드를 띄운다.
  const bottomSheetRef = useRef<DismissibleBottomSheetRef>(null);
  const mapViewRef = useRef<NaverMapViewRef>(null);
  const [selectedFacility, setSelectedFacility] = useState<SelectedFacility | null>(null);

  // 마커가 시설 카드에 가리지 않도록, 검색창+카테고리 칩 아래쪽 끝(chipsBottomY)과 시설
  // 카드 위쪽 끝(cardTopY) 사이의 세로 중앙에 마커가 오도록 카메라 pivot을 계산한다.
  const [chipsBottomY, setChipsBottomY] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);
  const handleTopOverlayLayout = (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setChipsBottomY(y + height);
  };
  const handleFacilityCardLayout = (event: LayoutChangeEvent) => {
    setCardHeight(event.nativeEvent.layout.height);
  };

  // NaverMapView는 selectedFacility가 바뀌어도 언마운트되지 않고 그대로 유지되므로,
  // initialCamera(최초 마운트에만 적용됨)만으로는 다른 마커를 선택했을 때 카메라가 안
  // 옮겨간다. selectedFacility/카드 높이가 바뀔 때마다 명시적으로 카메라를 이동시킨다.
  useEffect(() => {
    if (!selectedFacility || chipsBottomY === 0 || cardHeight === 0) return;
    const windowHeight = Dimensions.get('window').height;
    const cardTopY = windowHeight - cardHeight;
    const pivotY = (chipsBottomY + cardTopY) / 2 / windowHeight;
    mapViewRef.current?.animateCameraTo({
      latitude: selectedFacility.marker.latitude,
      longitude: selectedFacility.marker.longitude,
      zoom: 16,
      pivot: { x: 0.5, y: pivotY },
    });
  }, [selectedFacility, chipsBottomY, cardHeight]);
  // 지도 모드 상단 카테고리 칩. 실제 마커 필터링과의 연결 없이 Figma와 동일한 UI만 우선 갖춘다.
  const [selectedKey, setSelectedKey] = useState<CategoryKey | null>(null);
  const insets = useSafeAreaInsets();

  if (selectedFacility) {
    // MapScreen과 동일하게, 지도는 상태바 아래까지 풀블리드로 채우고 검색창/칩만
    // SafeAreaView로 안전영역만큼 내려서 얹는다.
    return (
      <View style={styles.container}>
        <NaverMapView
          ref={mapViewRef}
          style={StyleSheet.absoluteFill}
          initialCamera={{
            latitude: selectedFacility.marker.latitude,
            longitude: selectedFacility.marker.longitude,
            zoom: 16,
          }}
          onTapMap={() => bottomSheetRef.current?.close()}
        >
          {DUMMY_MAP_MARKERS.map(marker => (
            <NaverMapMarker
              key={marker.id}
              latitude={marker.latitude}
              longitude={marker.longitude}
              label={marker.label}
              favorite={marker.favorite}
              onPress={() => setSelectedFacility({ type: 'dong', marker })}
            />
          ))}
          {selectedFacility.type === 'category' && (
            <NaverMapCategoryMarker
              latitude={selectedFacility.marker.latitude}
              longitude={selectedFacility.marker.longitude}
              favorite={selectedFacility.marker.favorite}
              count={selectedFacility.marker.count}
              {...CATEGORY_MARKER_ICONS[selectedFacility.marker.category]}
            />
          )}
        </NaverMapView>
        {/* 지도 위에 검색창 + 카테고리 칩(캠퍼스맵 메인홈과 동일한 형태)이 떠 있다.
            검색창을 탭하면 지도를 벗어나 다시 검색 리스트/입력 상태로 돌아간다. */}
        <SafeAreaView
          edges={['top']}
          style={styles.mapTopOverlay}
          pointerEvents="box-none"
          onLayout={handleTopOverlayLayout}
        >
          <View style={styles.searchBarPadding}>
            <SearchBar value={value} onChangeText={setValue} onPress={() => setSelectedFacility(null)} />
          </View>
          <CategoryChipList selectedKey={selectedKey} onSelect={setSelectedKey} />
        </SafeAreaView>
        <View style={styles.navBarWrapper}>
          <NavigationBar activeTab="map" bottomInset={insets.bottom} />
        </View>
        <DismissibleBottomSheet
          ref={bottomSheetRef}
          onClose={() => setSelectedFacility(null)}
          style={styles.facilityCardWrapper}
        >
          <View onLayout={handleFacilityCardLayout}>
            {selectedFacility.type === 'dong' ? (
              <FacilityInfoCard
                variant="outside"
                buildingCode={selectedFacility.marker.label ?? ''}
                buildingName={selectedFacility.marker.buildingName}
                description={selectedFacility.marker.description}
                isFavorite={selectedFacility.marker.favorite}
                images={selectedFacility.marker.images}
                facilityCounts={DUMMY_FACILITY_COUNTS}
                mainEntrance={DUMMY_MAIN_ENTRANCE}
                operatingHours={DUMMY_OPERATING_HOURS}
                onViewInsidePress={() => {}}
              />
            ) : (
              <FacilityInfoCard
                variant="facility"
                buildingCode={selectedFacility.marker.buildingCode}
                buildingName={selectedFacility.marker.buildingName}
                facilityName={selectedFacility.marker.room}
                isFavorite={selectedFacility.marker.favorite}
                images={selectedFacility.marker.images}
                operatingHours={DUMMY_OPERATING_HOURS}
                onViewInsidePress={() => {}}
              />
            )}
          </View>
        </DismissibleBottomSheet>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* 리스트 항목이 아닌 빈 영역을 탭하면 키보드를 내린다. 각 리스트 항목은 자체
          Pressable이 터치를 먼저 가져가므로 항목을 누르는 동작과는 겹치지 않는다. */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={styles.searchHeaderWrapper}>
            <SearchPageHeader
              value={value}
              onChangeText={setValue}
              onVoicePress={toggleListening}
              isListening={isListening}
              onBackPress={() => navigation.goBack()}
            />
          </View>
          <View style={styles.content}>
            {/* "최근 검색한 장소" 타이틀은 고정, 그 아래 리스트만 스크롤된다. */}
            {!isSearching && <RecentSearchesTitle>최근 검색한 장소</RecentSearchesTitle>}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {isSearching ? (
                searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <SearchListItem
                      key={item.id}
                      building={item.building}
                      place={item.place}
                      room={item.room}
                      isFavorite={item.isFavorite}
                      onPress={() => {
                        const facility = findFacilityForSearchItem(item);
                        if (facility) setSelectedFacility(facility);
                      }}
                      showDivider={index !== searchResults.length - 1}
                      {...SEARCH_ITEM_ICONS[item.category]}
                    />
                  ))
                ) : (
                  <EmptyResultView>
                    <EmptyIconCircle>
                      <SearchIcon width={28} height={28} color={theme.semantic.text.tertiary} />
                    </EmptyIconCircle>
                    <EmptyTitleText>검색 결과가 없어요</EmptyTitleText>
                    <EmptySubtitleText>다른 검색어로 다시 시도해보세요</EmptySubtitleText>
                  </EmptyResultView>
                )
              ) : (
                recentSearches.map((item, index) => (
                  <SearchListItem
                    key={item.id}
                    building={item.building}
                    place={item.place}
                    room={item.room}
                    isFavorite={item.isFavorite}
                    history
                    date={item.date}
                    showDivider={index !== recentSearches.length - 1}
                    onPress={() => {
                      const facility = findFacilityForSearchItem(item);
                      if (facility) setSelectedFacility(facility);
                    }}
                    onDeletePress={() => removeRecentSearch(item.id)}
                    {...SEARCH_ITEM_ICONS[item.category]}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchHeaderWrapper: { marginTop: 8 },
  content: { flex: 1, marginTop: 16 },
  scrollView: { flex: 1 },
  // 검색 결과가 없을 때 EmptyResultView를 검색창 아래 여백의 정중앙에 오도록
  // 스크롤 콘텐츠 자체가 (위 scrollView의 flex:1로 확보된) 남은 공간을 다 채우게 한다.
  scrollContent: { flexGrow: 1 },
  mapTopOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 13,
    gap: 12,
  },
  searchBarPadding: { paddingHorizontal: 20 },
  navBarWrapper: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  facilityCardWrapper: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});

const RecentSearchesTitle = styled.Text`
  padding: 4px 20px;
  font-family: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

// 검색어에 해당하는 결과가 하나도 없을 때 보여주는 빈 상태 화면.
const EmptyResultView = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px 40px 96px;
`;

const EmptyIconCircle = styled.View`
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 100px;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;

const EmptyTitleText = styled.Text`
  font-family: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const EmptySubtitleText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
