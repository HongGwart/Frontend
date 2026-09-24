import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NaverMapView } from '@mj-studio/react-native-naver-map';
import styled from 'styled-components/native';
import ChevronLeftIcon from '@assets/svgs/icons/chevronLeft.svg';
import { FavoritePlaceCard } from '@components/mypage/FavoritePlaceCard';
import { SearchBar } from '@components/common/SearchBar';
import { CategoryChipList } from '@components/common/CategoryChipList';
import { FacilityInfoCard } from '@components/common/FacilityInfoCard';
import { NaverMapMarker } from '@components/map/NaverMapMarker';
import { HongdaeCategoryChips } from '@components/hongdae/HongdaeCategoryChips';
import { CategoryKey } from '@constant/categoryChips';
import { MAP_MIN_ZOOM, MAP_MAX_ZOOM } from '@constant/mapCamera';
import { DUMMY_FACILITY_IMAGES } from '@constant/dummyFacilityInfo';
import { DUMMY_HONGDAE_PLACES, HongdaeCategory } from '@constant/dummyHongdaePlaces';
import { MainTabParamList } from '@navigation/types';

// Figma "주변상권"(773:3725) 목록 + "주변상권_시설 클릭 시"(773:4093) 상세.
// 상단 헤더는 목록 상태일 때만 MainTabNavigator가 타이틀("주변상권")을 보여주고,
// 상세 상태일 때는 map 탭처럼 자체 검색바 UI를 쓰기 위해 헤더를 꺼야 해서 setOptions로 토글한다.
export default function HongdaeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'hongdae'>>();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<HongdaeCategory | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  // 상세(지도) 상태 상단의 카테고리 칩. 메인 지도 화면(MapScreen)과 동일한 칩이라 같은 컴포넌트를 쓴다.
  const [detailSelectedKey, setDetailSelectedKey] = useState<CategoryKey | null>(null);

  // 실제 즐겨찾기 연동 전까지, 이 화면 안에서만 유지되는 로컬 토글 상태.
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const toggleFavorite = (id: string) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const places = useMemo(
    () =>
      selectedCategory === null
        ? DUMMY_HONGDAE_PLACES
        : DUMMY_HONGDAE_PLACES.filter(place => place.category === selectedCategory),
    [selectedCategory],
  );

  const selectedPlace = useMemo(
    () => DUMMY_HONGDAE_PLACES.find(place => place.id === selectedPlaceId) ?? null,
    [selectedPlaceId],
  );

  useLayoutEffect(() => {
    // 다른 시설카드 화면들과 동일하게, 상세 상태에서는 상단 헤더뿐 아니라 하단 탭 바도 감춘다.
    navigation.setOptions({
      headerShown: !selectedPlace,
      tabBarStyle: selectedPlace ? { display: 'none' } : undefined,
    });
  }, [navigation, selectedPlace]);

  if (selectedPlace) {
    // 홍대 상권은 건물 내부가 없는 외부 장소라, 시설카드의 CTA를 "건물 내부 보기" 대신
    // 네이버 지도 딥링크로 바꿔서 그대로 재활용한다(FacilityInfoCard 'facility' variant).
    const closingTime = selectedPlace.hours.split(' - ')[1] ?? selectedPlace.hours;

    return (
      <DetailContainer>
        <TopBar topInset={insets.top} pointerEvents="box-none">
          <SearchRow>
            <BackButton onPress={() => setSelectedPlaceId(null)} hitSlop={8}>
              <ChevronLeftIcon width={24} height={24} />
            </BackButton>
            {/* map 탭 상단 검색창과 동일하게, 여기서는 입력 불가(onPress만 있는) 장식용 검색창이다. */}
            <SearchBarWrap>
              <SearchBar value="" onChangeText={() => {}} onPress={() => {}} />
            </SearchBarWrap>
          </SearchRow>
          <CategoryChipList selectedKey={detailSelectedKey} onSelect={setDetailSelectedKey} />
        </TopBar>
        <MapArea>
          <NaverMapView
            style={StyleSheet.absoluteFill}
            initialCamera={{ latitude: selectedPlace.latitude, longitude: selectedPlace.longitude, zoom: 17 }}
            minZoom={MAP_MIN_ZOOM}
            maxZoom={MAP_MAX_ZOOM}
          >
            <NaverMapMarker latitude={selectedPlace.latitude} longitude={selectedPlace.longitude} />
          </NaverMapView>
        </MapArea>
        <FacilityInfoCard
          variant="facility"
          buildingCode={selectedPlace.tagline}
          buildingName=""
          facilityName={selectedPlace.name}
          isFavorite={favoriteIds.has(selectedPlace.id)}
          onToggleFavorite={() => toggleFavorite(selectedPlace.id)}
          images={DUMMY_FACILITY_IMAGES}
          operatingHours={{
            isOpen: selectedPlace.isOpen,
            statusText: selectedPlace.statusText,
            detailText: `${closingTime}에 운영 종료`,
          }}
          ctaLabel="네이버 지도에서 열기"
          ctaIcon={null}
          ctaVariant="secondary"
          onViewInsidePress={() =>
            Linking.openURL(`https://map.naver.com/v5/search/${encodeURIComponent(selectedPlace.name ?? '')}`)
          }
        />
      </DetailContainer>
    );
  }

  return (
    <Container>
      <ChipsWrap>
        <HongdaeCategoryChips selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
      </ChipsWrap>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 8 }}
        showsVerticalScrollIndicator={false}
      >
        {places.map((place, index) => (
          <FavoritePlaceCard
            key={place.id}
            name={place.name}
            buildingCode={place.buildingCode}
            buildingName={place.buildingName}
            locationDetail={place.locationDetail}
            photo={place.photo}
            icon={place.icon}
            iconWidth={place.iconWidth}
            iconHeight={place.iconHeight}
            isOpen={place.isOpen}
            statusText={place.statusText}
            hours={place.hours}
            isFavorite={favoriteIds.has(place.id)}
            onToggleFavorite={() => toggleFavorite(place.id)}
            onPress={() => setSelectedPlaceId(place.id)}
            showDivider={index !== places.length - 1}
          />
        ))}
      </ScrollView>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

const ChipsWrap = styled.View`
  padding-vertical: 8px;
`;

const DetailContainer = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;

const TopBar = styled.View<{ topInset: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  gap: 12px;
  padding-top: ${({ topInset }) => topInset + 12}px;
  padding-bottom: 8px;
`;

const SearchRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding-horizontal: 20px;
`;

const BackButton = styled(Pressable)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

const SearchBarWrap = styled.View`
  flex: 1;
`;

const MapArea = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;
