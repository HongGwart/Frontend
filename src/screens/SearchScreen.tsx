import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled, { useTheme } from 'styled-components/native';
import Animated from 'react-native-reanimated';
import { NaverMapView, NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import SearchIcon from '@assets/svgs/icons/search.svg';
import { useFacilityCardCameraFocus } from '@hooks/useFacilityCardCameraFocus';
import { useBuildingDetailSwipeUp } from '@hooks/useBuildingDetailSwipeUp';
import { useCloseWhenCovered } from '@hooks/useCloseWhenCovered';
import { toRoutePlaceLabel, useRouteButtonProps } from '@hooks/useRouteButtonProps';
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM } from '@constant/mapCamera';
import { SearchBar } from '@components/common/SearchBar';
import { SearchPageHeader } from '@components/common/SearchPageHeader';
import { SearchListItem } from '@components/common/SearchListItem';
import { CategoryChipList } from '@components/common/CategoryChipList';
import { FacilityInfoCard } from '@components/common/FacilityInfoCard';
import {
  DismissibleBottomSheet,
  DismissibleBottomSheetRef,
} from '@components/common/DismissibleBottomSheet';
import { BuildingDetailBody, BuildingDetailHeader } from '@components/common/BuildingDetailContent';
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
  DUMMY_SEARCH_RESULTS,
  SEARCH_ITEM_ICONS,
  SearchResultItem,
} from '@constant/dummySearchData';
import { RootStackParamList } from '@navigation/types';
import { formatSearchedDate, useRecentSearches } from '@hooks/useRecentSearches';
import { useFavorites } from '@hooks/useFavorites';
import { favoriteFromCategoryMarker, favoriteFromDongMarker } from '@constant/favoriteInputs';
import { VoicePermissionDialog } from '@components/common/VoicePermissionDialog';
import { AnimatedToast } from '@components/mypage/AnimatedToast';

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [value, setValue] = useState('');
  // 마이크 버튼 -> 듣기 시작 -> 인식된 텍스트로 검색창 내용을 그대로 갱신(중간 결과 포함).
  // expo-speech-recognition은 네이티브 모듈이라 Expo Go가 아니라 dev-client 빌드에서만 동작한다.
  // 마이크 권한은 버튼을 누를 때 앱 안 안내(VoicePermissionDialog) → 시스템 팝업 순서로 묻는다. 거부해도
  // 글자 검색은 그대로 쓸 수 있게 토스트로 안내만 한다.
  const [voiceDeniedToastKey, setVoiceDeniedToastKey] = useState(0);
  const { isListening, toggleListening, permissionPrompt, confirmPermissionPrompt, dismissPermissionPrompt } =
    useVoiceSearch({ onResult: setValue, onUnavailable: () => setVoiceDeniedToastKey(key => key + 1) });

  // "최근 검색한 장소"는 기기 로컬(AsyncStorage)에 저장된다. 검색 결과나 최근 검색어를 탭해 찾아간 장소가 맨 위에 쌓인다.
  const { recentSearches, addRecentSearch, removeRecentSearch } = useRecentSearches();
  // 즐겨찾기 별은 기기 로컬에 저장된 앱 전역 상태로 표시한다(지도/마이페이지와 같은 상태).
  const { isFavorite, toggleFavorite } = useFavorites();
  const openSearchItem = (item: SearchResultItem) => {
    addRecentSearch(item);
    const facility = findFacilityForSearchItem(item);
    if (facility) setSelectedFacility(facility);
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
  // "건물 내부 보기"로 넘어가면 내부 지도 화면이 이 화면을 완전히 덮은 뒤 카드를 조용히 닫는다(MapScreen과 같음).
  const closeFacilityCard = useCallback(() => setSelectedFacility(null), []);
  const closeCardWhenCovered = useCloseWhenCovered(navigation, closeFacilityCard);
  // 카드의 출발/도착 → 길찾기 탭으로 가서 입력창을 채운다(검색 화면은 스택에서 빠지며 같이 닫힌다).
  const routeButtonProps = useRouteButtonProps();

  // 마커가 시설 카드에 가리지 않도록, 검색창+카테고리 칩 아래쪽 끝과 시설 카드 위쪽 끝
  // 사이의 세로 중앙에 마커가 오도록 카메라를 옮긴다(MapScreen과 공유하는 훅).
  const { cardHeight, handleChipsAreaLayout: handleTopOverlayLayout, handleFacilityCardLayout } =
    useFacilityCardCameraFocus(mapViewRef, selectedFacility?.marker ?? null);
  // 지도 모드 상단 카테고리 칩. 실제 마커 필터링과의 연결 없이 Figma와 동일한 UI만 우선 갖춘다.
  const [selectedKey, setSelectedKey] = useState<CategoryKey | null>(null);
  const insets = useSafeAreaInsets();

  // 시설 카드를 위로 슬라이드하면 그 건물의 상세보기로 넘어간다. MapScreen과 동일한
  // 인터랙션 — 애니메이션 묶음은 훅으로 공유하고, buildingCode를 뽑아내는 부분만 이
  // 화면의 SelectedFacility 모양(dong/category 둘뿐)에 맞춰 여기 남겨둔다.
  const swipeUpBuildingCode = useMemo(
    () =>
      selectedFacility
        ? selectedFacility.type === 'dong'
          ? (selectedFacility.marker.label ?? null)
          : selectedFacility.marker.buildingCode
        : null,
    [selectedFacility],
  );

  const handleSwipeUp = useCallback(() => {
    if (!swipeUpBuildingCode) return;
    navigation.navigate('BuildingDetail', { buildingCode: swipeUpBuildingCode });
    // animateClose와 마찬가지로 슬라이드업 애니메이션이 끝난 뒤 호출되므로 여기서 바로
    // 닫아도 끊겨 보이지 않는다.
    setSelectedFacility(null);
  }, [swipeUpBuildingCode, navigation]);

  const {
    swipeCardTranslateY,
    detailHeaderStyle,
    detailBodyStyle,
    cardFadeStyle,
    minSwipeUpDistance,
  } = useBuildingDetailSwipeUp(swipeUpBuildingCode, selectedFacility);

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
          minZoom={MAP_MIN_ZOOM}
          maxZoom={MAP_MAX_ZOOM}
          onTapMap={() => bottomSheetRef.current?.close()}
        >
          {/* 지도 화면과 같이, 카드가 열린(포커싱된) 마커 하나만 네임택을 달고 남기고 나머지 마커는 숨긴다. */}
          {selectedFacility.type === 'dong' && (
            <NaverMapMarker
              latitude={selectedFacility.marker.latitude}
              longitude={selectedFacility.marker.longitude}
              label={selectedFacility.marker.label}
              active
              favorite={isFavorite(favoriteFromDongMarker(selectedFacility.marker))}
            />
          )}
          {selectedFacility.type === 'category' && (
            <NaverMapCategoryMarker
              latitude={selectedFacility.marker.latitude}
              longitude={selectedFacility.marker.longitude}
              favorite={isFavorite(favoriteFromCategoryMarker(selectedFacility.marker))}
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
          {/* 검색창·카테고리 칩은 메인홈(MapScreen)에서만 쓸 수 있고, 여기선 같은 모양으로 보여주기만 한다. */}
          <View style={styles.searchBarPadding} pointerEvents="none">
            <SearchBar value={value} onChangeText={setValue} onPress={() => setSelectedFacility(null)} />
          </View>
          <CategoryChipList selectedKey={selectedKey} onSelect={setSelectedKey} disabled />
        </SafeAreaView>
        <View style={styles.navBarWrapper}>
          <NavigationBar activeTab="map" bottomInset={insets.bottom} />
        </View>
        {/* 본문은 카드보다 먼저(=아래에) 그려서, 카드 밑단이 밀려 올라간 만큼만 뒤에서
            드러나는 것처럼 보이게 한다. 아직 실제 화면 전환 전이라 조작은 막아둔다. */}
        {swipeUpBuildingCode && (
          <Animated.View
            style={[StyleSheet.absoluteFill, detailBodyStyle]}
            pointerEvents="none"
            renderToHardwareTextureAndroid
            shouldRasterizeIOS
          >
            <BuildingDetailBody buildingCode={swipeUpBuildingCode} />
          </Animated.View>
        )}
        <DismissibleBottomSheet
          ref={bottomSheetRef}
          onClose={() => setSelectedFacility(null)}
          onSwipeUp={swipeUpBuildingCode ? handleSwipeUp : undefined}
          translateY={swipeUpBuildingCode ? swipeCardTranslateY : undefined}
          rasterize={Boolean(swipeUpBuildingCode)}
          minSwipeUpDistance={swipeUpBuildingCode ? minSwipeUpDistance : undefined}
          style={[styles.facilityCardWrapper, cardFadeStyle]}
        >
          <View onLayout={handleFacilityCardLayout}>
            {selectedFacility.type === 'dong' ? (
              <FacilityInfoCard
                variant="outside"
                buildingCode={selectedFacility.marker.label ?? ''}
                buildingName={selectedFacility.marker.buildingName}
                description={selectedFacility.marker.description}
                isFavorite={isFavorite(favoriteFromDongMarker(selectedFacility.marker))}
                onToggleFavorite={() => toggleFavorite(favoriteFromDongMarker(selectedFacility.marker))}
                images={selectedFacility.marker.images}
                {...routeButtonProps(
                  toRoutePlaceLabel(selectedFacility.marker.label, selectedFacility.marker.buildingName),
                )}
                facilityCounts={DUMMY_FACILITY_COUNTS}
                mainEntrance={DUMMY_MAIN_ENTRANCE}
                operatingHours={DUMMY_OPERATING_HOURS}
                onViewInsidePress={() => {
                  closeCardWhenCovered();
                  navigation.navigate('BuildingIndoor', {
                    buildingCode: selectedFacility.marker.label ?? '',
                    buildingName: selectedFacility.marker.buildingName,
                    description: selectedFacility.marker.description,
                    fromCardHeight: cardHeight,
                  });
                }}
              />
            ) : (
              <FacilityInfoCard
                variant="facility"
                buildingCode={selectedFacility.marker.buildingCode}
                buildingName={selectedFacility.marker.buildingName}
                facilityName={selectedFacility.marker.room}
                isFavorite={isFavorite(favoriteFromCategoryMarker(selectedFacility.marker))}
                onToggleFavorite={() => toggleFavorite(favoriteFromCategoryMarker(selectedFacility.marker))}
                images={selectedFacility.marker.images}
                {...routeButtonProps(
                  toRoutePlaceLabel(
                    selectedFacility.marker.buildingCode,
                    selectedFacility.marker.buildingName,
                    selectedFacility.marker.room,
                  ),
                )}
                operatingHours={DUMMY_OPERATING_HOURS}
                // 시설이 있는 건물(동)의 내부 지도로 간다(지도 화면의 시설 카드와 같음).
                onViewInsidePress={() => {
                  const { buildingCode, buildingName } = selectedFacility.marker;
                  const dongMarker = DUMMY_MAP_MARKERS.find(marker => marker.label === buildingCode);
                  closeCardWhenCovered();
                  navigation.navigate('BuildingIndoor', {
                    buildingCode,
                    buildingName: dongMarker?.buildingName || buildingName,
                    description: dongMarker?.description ?? '',
                    fromCardHeight: cardHeight,
                  });
                }}
              />
            )}
          </View>
        </DismissibleBottomSheet>
        {/* 헤더는 카드보다 나중에(=위에) 그려서, 카드가 위로 슬라이드하다 헤더 자리에
            닿으면 그 속으로 사라지는 것처럼(헤더가 카드를 덮으며) 보이게 한다. */}
        {swipeUpBuildingCode && (
          <Animated.View
            style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, detailHeaderStyle]}
            pointerEvents="none"
          >
            <BuildingDetailHeader buildingCode={swipeUpBuildingCode} />
          </Animated.View>
        )}
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
                      isFavorite={isFavorite({ buildingCode: item.building, name: item.room })}
                      onPress={() => openSearchItem(item)}
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
                    <EmptySubtitleText>다른 검색어로 다시 시도해 보세요</EmptySubtitleText>
                  </EmptyResultView>
                )
              ) : (
                recentSearches.map((item, index) => (
                  <SearchListItem
                    key={`${item.id}-${item.searchedAt}`}
                    building={item.building}
                    place={item.place}
                    room={item.room}
                    isFavorite={isFavorite({ buildingCode: item.building, name: item.room })}
                    history
                    date={formatSearchedDate(item.searchedAt)}
                    showDivider={index !== recentSearches.length - 1}
                    onPress={() => openSearchItem(item)}
                    onDeletePress={() => removeRecentSearch(item)}
                    {...SEARCH_ITEM_ICONS[item.category]}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>
      <VoicePermissionDialog
        prompt={permissionPrompt}
        onConfirm={confirmPermissionPrompt}
        onDismiss={dismissPermissionPrompt}
      />
      {voiceDeniedToastKey > 0 && (
        <AnimatedToast
          key={voiceDeniedToastKey}
          text="마이크 권한이 없어요. 검색창에 글자로 입력해 주세요."
          variant="warning"
          bottomOffset={insets.bottom + 16}
          onHide={() => setVoiceDeniedToastKey(0)}
        />
      )}
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

const ListeningRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding-horizontal: 20px;
`;

// 녹음 중 표시 — 일반적인 "녹음 중" 빨간 점(warning 색).
const ListeningDot = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.semantic.warning};
`;

const ListeningText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelReading.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelReading.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelReading.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelReading.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;
