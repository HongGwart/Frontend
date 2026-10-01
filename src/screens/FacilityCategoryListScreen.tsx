import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from 'styled-components/native';
import Header from '@components/layout/Header';
import { FavoritePlaceCard } from '@components/mypage/FavoritePlaceCard';
import { FacilityInfoCard } from '@components/common/FacilityInfoCard';
import { PlaceMapDetailView } from '@components/map/PlaceMapDetailView';
import { NaverMapCategoryMarker } from '@components/map/NaverMapCategoryMarker';
import { NaverMapMarker } from '@components/map/NaverMapMarker';
import { CATEGORY_MARKER_ICONS } from '@constant/categoryMarkerIcons';
import { DUMMY_MAP_MARKERS } from '@constant/dummyMapMarkers';
import { DUMMY_FACILITY_IMAGES } from '@constant/dummyFacilityInfo';
import { toRoutePlaceLabel, useRouteButtonProps } from '@hooks/useRouteButtonProps';
import { useCloseOnHardwareBack } from '@hooks/useCloseOnHardwareBack';
import { FACILITY_CATEGORIES } from '@constant/facilityCategories';
import { DUMMY_FACILITY_CATEGORY_PLACES } from '@constant/dummyFacilityCategoryPlaces';
import { FacilityCategoryId, RootStackParamList } from '@navigation/types';
import { FavoriteInput, useFavorites } from '@hooks/useFavorites';
import { FavoritePlace } from '@constant/dummyMypage';

// 편의시설 카테고리 → 지도 위 원형 카테고리 마커 아이콘(메인 지도와 같은 것). "기타"는 전용
// 아이콘이 없어서 기본 핀 마커로 찍는다.
const MARKER_ICON_BY_CATEGORY: Partial<Record<FacilityCategoryId, keyof typeof CATEGORY_MARKER_ICONS>> = {
  restaurant: 'restaurant',
  cafe: 'cafe',
  store: 'store',
  readingRoom: 'readingRoom',
  pc: 'pcRoom',
  printer: 'printer',
  bookReturn: 'bookReturn',
  smokingArea: 'smokingArea',
};

// 건물 마커를 못 찾았을 때 지도 중심(메인 지도 첫 화면과 같은 캠퍼스 중앙).
const CAMPUS_CENTER = { latitude: 37.5504, longitude: 126.9251 };

// 편의시설 탭에서 카테고리 카드를 탭하면 뜨는 해당 카테고리 장소 목록.
// Figma "편의시설_카페"(719:1582) 등 카테고리별 화면들이 전부 같은 레이아웃(공통
// Header + facility category_list 카드 반복)이라 카테고리 하나로 통일해서 구현했다.
// 탭 바 없이 전체화면으로 뜬다(FavoriteListScreen과 같은 패턴).
export default function FacilityCategoryListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'FacilityCategoryList'>>();

  const category = FACILITY_CATEGORIES.find(item => item.id === params.categoryId);
  const places = DUMMY_FACILITY_CATEGORY_PLACES[params.categoryId];

  // 즐겨찾기는 기기 로컬에 저장된 앱 전역 상태(마이페이지/지도/길찾기와 같은 상태).
  const { isFavorite, toggleFavorite: togglePlaceFavorite } = useFavorites();
  const toFavoriteInput = (place: FavoritePlace): FavoriteInput => ({
    buildingCode: place.buildingCode,
    buildingName: place.buildingName,
    name: place.name,
    category: MARKER_ICON_BY_CATEGORY[params.categoryId],
  });
  const routeButtonProps = useRouteButtonProps();

  // 목록에서 장소를 누르면 주변상권처럼 지도 + 시설 카드 상세로 바뀐다. 편의시설은 아직 자체 좌표가
  // 없어서, 그 시설이 있는 건물(동) 마커의 좌표에 카테고리 마커를 찍는다.
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const selectedPlace = useMemo(
    () => places.find(place => place.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId],
  );
  const closeDetail = useCallback(() => setSelectedPlaceId(null), []);
  useCloseOnHardwareBack(!!selectedPlace, closeDetail);

  if (selectedPlace) {
    const building = DUMMY_MAP_MARKERS.find(marker => marker.label === selectedPlace.buildingCode);
    const { latitude, longitude } = building ?? CAMPUS_CENTER;
    const markerIconKey = MARKER_ICON_BY_CATEGORY[params.categoryId];
    const closingTime = selectedPlace.hours.split(' - ')[1] ?? selectedPlace.hours;
    const facilityName = selectedPlace.name ?? selectedPlace.buildingName;

    return (
      <PlaceMapDetailView
        latitude={latitude}
        longitude={longitude}
        onBack={closeDetail}
        onSearchPress={() => navigation.navigate('Search')}
        marker={
          markerIconKey ? (
            <NaverMapCategoryMarker
              latitude={latitude}
              longitude={longitude}
              favorite={isFavorite(toFavoriteInput(selectedPlace))}
              {...CATEGORY_MARKER_ICONS[markerIconKey]}
            />
          ) : (
            <NaverMapMarker latitude={latitude} longitude={longitude} />
          )
        }
        card={
          // 주변상권과 같은 facility 카드에 하단 CTA만 기본값("건물 내부 보기")으로 둔다.
          <FacilityInfoCard
            variant="facility"
            buildingCode={selectedPlace.buildingCode}
            buildingName={selectedPlace.buildingName}
            facilityName={facilityName}
            locationDetail={selectedPlace.locationDetail}
            isFavorite={isFavorite(toFavoriteInput(selectedPlace))}
            onToggleFavorite={() => togglePlaceFavorite(toFavoriteInput(selectedPlace))}
            {...routeButtonProps(
              toRoutePlaceLabel(selectedPlace.buildingCode, selectedPlace.buildingName, selectedPlace.name),
            )}
            images={DUMMY_FACILITY_IMAGES}
            operatingHours={{
              isOpen: selectedPlace.isOpen,
              statusText: selectedPlace.statusText,
              detailText: `${closingTime}에 운영 종료`,
            }}
            onViewInsidePress={() =>
              navigation.navigate('BuildingIndoor', {
                buildingCode: selectedPlace.buildingCode,
                buildingName: selectedPlace.buildingName,
                description: building?.description ?? '',
              })
            }
          />
        }
      />
    );
  }

  return (
    <Container edges={['top']}>
      <Header title={category?.label ?? ''} onBackPress={() => navigation.goBack()} />
      {places.length > 0 ? (
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
              isFavorite={isFavorite(toFavoriteInput(place))}
              onToggleFavorite={() => togglePlaceFavorite(toFavoriteInput(place))}
              onPress={() => setSelectedPlaceId(place.id)}
              showDivider={index !== places.length - 1}
            />
          ))}
        </ScrollView>
      ) : (
        <EmptyState>
          <EmptyText>등록된 {category?.label ?? '편의시설'} 정보가 없어요</EmptyText>
        </EmptyState>
      )}
    </Container>
  );
}

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

const EmptyState = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const EmptyText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
