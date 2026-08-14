import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NaverMapView } from '@mj-studio/react-native-naver-map';
import { SearchBar } from '@components/common/SearchBar';
import { CategoryChipList } from '@components/common/CategoryChipList';
import { FacilityInfoCard } from '@components/common/FacilityInfoCard';
import { Toast } from '@components/common/Toast';
import {
  DismissibleBottomSheet,
  DismissibleBottomSheetRef,
} from '@components/common/DismissibleBottomSheet';
import { NaverMapMarker } from '@components/map/NaverMapMarker';
import { NaverMapCategoryMarker } from '@components/map/NaverMapCategoryMarker';
import { CategoryKey } from '@constant/categoryChips';
import { CATEGORY_MARKER_ICONS } from '@constant/categoryMarkerIcons';
import {
  DUMMY_MAP_MARKERS,
  DUMMY_CATEGORY_MARKERS,
  DummyMapMarker,
  DummyCategoryMarker,
} from '@constant/dummyMapMarkers';
import { DUMMY_FACILITY_COUNTS, DUMMY_MAIN_ENTRANCE, DUMMY_OPERATING_HOURS } from '@constant/dummyFacilityInfo';

interface Props {
  onSearchPress?: () => void;
}

// 지도 위 마커를 탭하면 아래에서 올려줄 시설 정보 바텀시트가 어떤 마커에 대한 것인지.
type SelectedFacility =
  | { type: 'dong'; marker: DummyMapMarker }
  | { type: 'category'; marker: DummyCategoryMarker };

const TOAST_DURATION_MS = 2000;

export default function MapScreen({ onSearchPress }: Props) {
  // 메인홈 카테고리 칩은 한 번에 하나만 선택된다. 실제 지도 필터링과의 연결은
  // 추후 지도 데이터가 준비되면 여기 selectedKey를 그대로 넘기면 된다.
  const [selectedKey, setSelectedKey] = useState<CategoryKey | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<SelectedFacility | null>(null);
  const bottomSheetRef = useRef<DismissibleBottomSheetRef>(null);

  // 더미 데이터의 favorite 값을 그대로 두고, 토글한 것만 id 기준으로 덮어써서 들고 있는다.
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const isFavorite = (marker: { id: string; favorite?: boolean }) =>
    favoriteOverrides[marker.id] ?? marker.favorite ?? false;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toggleFavorite = (marker: { id: string; favorite?: boolean }, name: string) => {
    const nextIsFavorite = !isFavorite(marker);
    setFavoriteOverrides(prev => ({ ...prev, [marker.id]: nextIsFavorite }));

    setToastMessage(`${name}의 즐겨찾기가 ${nextIsFavorite ? '등록' : '해제'}되었습니다.`);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  };

  // 지도 바닥을 탭했을 때도 스와이프로 닫을 때와 동일하게 부드럽게 슬라이드다운시킨다.
  // (state를 바로 null로 바꾸면 애니메이션 없이 뚝 끊겨서 사라진다.)
  const closeFacilitySheet = () => {
    if (selectedFacility) bottomSheetRef.current?.close();
  };

  // 동(건물) 마커는 칩이 하나도 안 켜져 있을 때만 보여준다. 특정 카테고리를 고르면 그
  // 카테고리 마커만 남기고, 동 마커는 화면에서 사라진다.
  const dongMarkers = selectedKey === null ? DUMMY_MAP_MARKERS : [];

  // "즐겨찾기" 칩은 시설 카테고리가 아니라 상태라서, 동 마커/카테고리 마커 중
  // isFavorite인 것들만 모아서 보여준다.
  const categoryMarkers =
    selectedKey === null
      ? []
      : selectedKey === 'favorite'
        ? DUMMY_CATEGORY_MARKERS.filter(isFavorite)
        : DUMMY_CATEGORY_MARKERS.filter(marker => marker.category === selectedKey);

  const favoriteDongMarkers = selectedKey === 'favorite' ? DUMMY_MAP_MARKERS.filter(isFavorite) : [];

  return (
    <View style={styles.container}>
      <NaverMapView
        style={StyleSheet.absoluteFill}
        initialCamera={{
          latitude: 37.5504,
          longitude: 126.9251,
          zoom: 16,
        }}
        // 마커가 아닌 지도 바닥을 탭하면 열려있던 시설 정보 바텀시트를 닫는다.
        onTapMap={closeFacilitySheet}
      >
        {[...dongMarkers, ...favoriteDongMarkers].map(marker => (
          <NaverMapMarker
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            label={marker.label}
            favorite={isFavorite(marker)}
            count={marker.count}
            onPress={() => setSelectedFacility({ type: 'dong', marker })}
          />
        ))}
        {categoryMarkers.map(marker => (
          <NaverMapCategoryMarker
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            favorite={isFavorite(marker)}
            count={marker.count}
            onPress={() => setSelectedFacility({ type: 'category', marker })}
            {...CATEGORY_MARKER_ICONS[marker.category]}
          />
        ))}
      </NaverMapView>
      <SafeAreaView edges={['top']} style={styles.searchBarWrapper} pointerEvents="box-none">
        <View style={styles.searchBarPadding}>
          <SearchBar value="" onChangeText={() => {}} onPress={onSearchPress} />
        </View>
        <CategoryChipList selectedKey={selectedKey} onSelect={setSelectedKey} />
        {toastMessage && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.toastWrapper}
          >
            <Toast text={toastMessage} variant="success" />
          </Animated.View>
        )}
      </SafeAreaView>
      {selectedFacility && (
        <DismissibleBottomSheet
          ref={bottomSheetRef}
          onClose={() => setSelectedFacility(null)}
          style={styles.facilityCardWrapper}
        >
          {selectedFacility.type === 'dong' ? (
            <FacilityInfoCard
              variant="outside"
              buildingCode={selectedFacility.marker.label ?? ''}
              buildingName={selectedFacility.marker.buildingName}
              description={selectedFacility.marker.description}
              isFavorite={isFavorite(selectedFacility.marker)}
              onToggleFavorite={() =>
                toggleFavorite(selectedFacility.marker, selectedFacility.marker.buildingName)
              }
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
              isFavorite={isFavorite(selectedFacility.marker)}
              onToggleFavorite={() => toggleFavorite(selectedFacility.marker, selectedFacility.marker.room)}
              images={selectedFacility.marker.images}
              operatingHours={DUMMY_OPERATING_HOURS}
              onViewInsidePress={() => {}}
            />
          )}
        </DismissibleBottomSheet>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBarWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 13,
    gap: 12,
  },
  searchBarPadding: {
    paddingHorizontal: 20,
  },
  toastWrapper: {
    paddingHorizontal: 20,
  },
  facilityCardWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
