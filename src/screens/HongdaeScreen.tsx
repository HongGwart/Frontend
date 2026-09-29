import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Linking, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from 'styled-components/native';
import { FavoritePlaceCard } from '@components/mypage/FavoritePlaceCard';
import { FacilityInfoCard } from '@components/common/FacilityInfoCard';
import { NaverMapMarker } from '@components/map/NaverMapMarker';
import { PlaceMapDetailView } from '@components/map/PlaceMapDetailView';
import { HongdaeCategoryChips } from '@components/hongdae/HongdaeCategoryChips';
import { DUMMY_FACILITY_IMAGES } from '@constant/dummyFacilityInfo';
import { DUMMY_HONGDAE_PLACES, HongdaeCategory } from '@constant/dummyHongdaePlaces';
import { toRoutePlaceLabel, useRouteButtonProps } from '@hooks/useRouteButtonProps';
import { useCloseOnHardwareBack } from '@hooks/useCloseOnHardwareBack';
import { MainTabParamList, RootStackParamList } from '@navigation/types';

// Figma "주변상권"(773:3725) 목록 + "주변상권_시설 클릭 시"(773:4093) 상세.
// 상단 헤더는 목록 상태일 때만 MainTabNavigator가 타이틀("주변상권")을 보여주고,
// 상세 상태일 때는 map 탭처럼 자체 검색바 UI를 쓰기 위해 헤더를 꺼야 해서 setOptions로 토글한다.
export default function HongdaeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'hongdae'>>();
  // Search는 탭 내비게이터의 형제(루트 스택)에 있어서, navigate가 루트 스택까지 올라가 처리된다.
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<HongdaeCategory | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const routeButtonProps = useRouteButtonProps();

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

  const closeDetail = useCallback(() => setSelectedPlaceId(null), []);
  useCloseOnHardwareBack(!!selectedPlace, closeDetail);

  if (selectedPlace) {
    // 홍대 상권은 건물 내부가 없는 외부 장소라, 시설카드의 CTA를 "건물 내부 보기" 대신
    // 네이버 지도 딥링크로 바꿔서 그대로 재활용한다(FacilityInfoCard 'facility' variant).
    const closingTime = selectedPlace.hours.split(' - ')[1] ?? selectedPlace.hours;

    return (
      <PlaceMapDetailView
        latitude={selectedPlace.latitude}
        longitude={selectedPlace.longitude}
        onBack={closeDetail}
        onSearchPress={() => rootNavigation.navigate('Search')}
        marker={
          <NaverMapMarker
            latitude={selectedPlace.latitude}
            longitude={selectedPlace.longitude}
            favorite={favoriteIds.has(selectedPlace.id)}
          />
        }
        card={
          <FacilityInfoCard
            variant="facility"
            buildingCode={selectedPlace.tagline}
            buildingName=""
            facilityName={selectedPlace.name}
            isFavorite={favoriteIds.has(selectedPlace.id)}
            onToggleFavorite={() => toggleFavorite(selectedPlace.id)}
            {...routeButtonProps(toRoutePlaceLabel(selectedPlace.name))}
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
        }
      />
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
