import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Linking, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import styled from 'styled-components/native';
import RestaurantIcon from '@assets/svgs/icons/restaurant.svg';
import { FavoritePlaceCard } from '@components/mypage/FavoritePlaceCard';
import { FacilityInfoCard } from '@components/common/FacilityInfoCard';
import { AnimatedToast } from '@components/mypage/AnimatedToast';
import { NaverMapMarker } from '@components/map/NaverMapMarker';
import { PlaceMapDetailView } from '@components/map/PlaceMapDetailView';
import { HongdaeCategoryChips } from '@components/hongdae/HongdaeCategoryChips';
import { HongdaeCategory, HongdaePlace, hongdaeFavoriteInput } from '@constant/hongdaePlaces';
import { useFavorites } from '@hooks/useFavorites';
import { useHongdaePlaces } from '@api/hongdae/useHongdaePlaces';
import { useNow } from '@hooks/useNow';
import { getOperatingStatus } from '@utils/operatingHours';
import { toRoutePlaceLabel, useRouteButtonProps } from '@hooks/useRouteButtonProps';
import { useCloseOnHardwareBack } from '@hooks/useCloseOnHardwareBack';
import { MainTabParamList } from '@navigation/types';

// 메인 지도(MapScreen)의 즐겨찾기 토스트와 같은 노출 시간
const TOAST_DURATION_MS = 2000;

// Figma "주변상권"(773:3725) 목록 + "주변상권_시설 클릭 시"(773:4093) 상세.
// 상단 헤더는 목록 상태일 때만 MainTabNavigator가 타이틀("주변상권")을 보여주고,
// 상세 상태일 때는 map 탭처럼 자체 검색바 UI를 쓰기 위해 헤더를 꺼야 해서 setOptions로 토글한다.
export default function HongdaeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'hongdae'>>();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<HongdaeCategory | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const routeButtonProps = useRouteButtonProps();
  const { places: allPlaces, asOf } = useHongdaePlaces();
  // 운영 상태는 데이터에 고정된 문구가 아니라 지금 시각으로 계산한다(1분마다 갱신).
  const now = useNow();

  // 즐겨찾기는 기기에 저장되는 앱 전역 상태(지도·마이페이지와 같은 상태). 앱을 다시 켜도 남고 MY 탭에도 보인다.
  const { isFavorite: isFavoriteInput, toggleFavorite: toggleFavoriteInput } = useFavorites();
  const isFavorite = (place: HongdaePlace) => isFavoriteInput(hongdaeFavoriteInput(place));
  // 즐겨찾기를 누를 때마다 "OOO의 즐겨찾기가 등록/해제되었습니다." 토스트를 띄운다(메인 지도와 같은 문구).
  // 목록에서는 화면 아래에서 올라오는 AnimatedToast, 상세에서는 메인 지도처럼 칩 아래에 뜬다.
  const [toast, setToast] = useState<{ key: number; message: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const toggleFavorite = (place: HongdaePlace) => {
    const name = place.name;
    const nextIsFavorite = toggleFavoriteInput(hongdaeFavoriteInput(place));
    // key를 바꿔서 이미 떠 있는 토스트도 새로 띄우고(목록의 AnimatedToast 리마운트) 타이머를 다시 잰다.
    setToast(prev => ({ key: (prev?.key ?? 0) + 1, message: `${name}의 즐겨찾기가 ${nextIsFavorite ? '등록' : '해제'}되었습니다.` }));
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  };

  const places = useMemo(
    () => (selectedCategory === null ? allPlaces : allPlaces.filter(place => place.category === selectedCategory)),
    [allPlaces, selectedCategory],
  );

  // 마이페이지 즐겨찾기에서 넘어오면 그 장소 상세를 바로 열고, 파라미터는 비워서 탭을 다시 와도 되살아나지 않게 한다.
  const focusPlaceId = useRoute<RouteProp<MainTabParamList, 'hongdae'>>().params?.focusPlaceId;
  useEffect(() => {
    if (!focusPlaceId) return;
    setSelectedPlaceId(focusPlaceId);
    navigation.setParams({ focusPlaceId: undefined });
  }, [focusPlaceId, navigation]);

  const selectedPlace = useMemo(
    () => allPlaces.find(place => place.id === selectedPlaceId) ?? null,
    [allPlaces, selectedPlaceId],
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
    const status = getOperatingStatus(selectedPlace.hours, now);

    return (
      <PlaceMapDetailView
        latitude={selectedPlace.latitude}
        longitude={selectedPlace.longitude}
        onBack={closeDetail}
        toastMessage={toast?.message}
        marker={
          <NaverMapMarker
            latitude={selectedPlace.latitude}
            longitude={selectedPlace.longitude}
            favorite={isFavorite(selectedPlace)}
          />
        }
        card={
          <FacilityInfoCard
            variant="facility"
            buildingCode={selectedPlace.tagline ?? `${selectedPlace.district} ${selectedPlace.neighborhood}`}
            buildingName=""
            facilityName={selectedPlace.name}
            isFavorite={isFavorite(selectedPlace)}
            onToggleFavorite={() => toggleFavorite(selectedPlace)}
            {...routeButtonProps(toRoutePlaceLabel(selectedPlace.name))}
            images={selectedPlace.photos}
            placeholderIcon={RestaurantIcon}
            operatingHours={status}
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
        {asOf && <AsOfText>운영 시간은 변동될 수 있어요 · {formatAsOf(asOf)} 기준</AsOfText>}
        {places.map((place, index) => (
          <FavoritePlaceCard
            key={place.id}
            name={place.name}
            buildingCode={place.district}
            buildingName={place.neighborhood}
            photo={place.photos?.[0]}
            // 사진이 없는 가게는 즐겨찾기/편의시설 목록의 기본 썸네일처럼 옅은 남색 박스에 식당 아이콘을 띄운다.
            icon={RestaurantIcon}
            operatingHours={place.hours}
            isFavorite={isFavorite(place)}
            onToggleFavorite={() => toggleFavorite(place)}
            onPress={() => setSelectedPlaceId(place.id)}
            showDivider={index !== places.length - 1}
          />
        ))}
      </ScrollView>
      {toast && (
        // 사라지는 애니메이션은 AnimatedToast가 직접 재고, 끝나면 onHide로 내린다. 위의 타이머는 상세용이라
        // 여기선 duration을 그보다 살짝 짧게 줘서 사라지는 애니메이션이 잘리지 않게 한다.
        <AnimatedToast
          key={toast.key}
          text={toast.message}
          duration={TOAST_DURATION_MS - 250}
          bottomOffset={16}
          onHide={() => setToast(null)}
        />
      )}
    </Container>
  );
}

// "2026-10-13" → "2026년 10월"
const formatAsOf = (date: string) => `${date.slice(0, 4)}년 ${Number(date.slice(5, 7))}월`;

const AsOfText = styled.Text`
  padding: 12px 20px 4px;
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

const ChipsWrap = styled.View`
  padding-vertical: 8px;
`;
