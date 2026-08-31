import React, { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NaverMapView } from '@mj-studio/react-native-naver-map';
import { SearchBar } from '@components/common/SearchBar';
import { CategoryChipList } from '@components/common/CategoryChipList';
import { FacilityInfoCard } from '@components/common/FacilityInfoCard';
import { FacilityListSheet, FacilityListSheetItem } from '@components/common/FacilityListSheet';
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
import { DUMMY_FACILITY_LIST_ITEMS } from '@constant/dummyFacilityListItems';

interface Props {
  onSearchPress?: () => void;
}

// 지도 위 마커를 탭하면 아래에서 올려줄 시설 정보 바텀시트가 어떤 마커에 대한 것인지.
// 'list'는 숫자 배지가 붙은(군집된) 마커를 탭했을 때의 건물/시설 리스트, 'item'은 그
// 리스트에서 항목 하나를 골랐을 때 보여줄 상세 카드다.
type SelectedFacility =
  | { type: 'dong'; marker: DummyMapMarker }
  | { type: 'category'; marker: DummyCategoryMarker }
  | { type: 'list'; items: FacilityListSheetItem[] }
  | { type: 'item'; item: FacilityListSheetItem };

// "즐겨찾기" 칩에서 지도에 찍을 동 하나의 정보. 그 동 자체가 즐겨찾기됐을 수도 있고,
// 그 동 안의 시설(카테고리 마커) 중 일부만 즐겨찾기됐을 수도 있어서 둘을 같이 들고 있는다.
interface FavoriteMapEntry {
  dongMarker: DummyMapMarker;
  facilityItems: DummyCategoryMarker[];
}

const TOAST_DURATION_MS = 2000;

// 겹쳐진 마커 리스트 시트는 카테고리 칩 아래로 이 간격(피그마 기준)만큼 띄우고, 그 지점부터
// 화면 끝까지를 항상 채운다(항목이 적어도 빈 공간으로 남지 않고 시트 자체가 그 높이를 가짐).
const LIST_SHEET_GAP_FROM_CHIPS = 235;

export default function MapScreen({ onSearchPress }: Props) {
  // 메인홈 카테고리 칩은 한 번에 하나만 선택된다. 실제 지도 필터링과의 연결은
  // 추후 지도 데이터가 준비되면 여기 selectedKey를 그대로 넘기면 된다.
  const [selectedKey, setSelectedKey] = useState<CategoryKey | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<SelectedFacility | null>(null);
  const bottomSheetRef = useRef<DismissibleBottomSheetRef>(null);

  // 검색창+카테고리 칩 영역의 화면상 y 좌표(하단)를 재서, 리스트 시트를 그 지점 + 235px
  // 아래에서부터 시작하도록 top으로 직접 고정한다(window 높이로 역산하는 방식은 여러
  // 화면 크기/세이프에어리어에서 오차가 생기기 쉬워서, top을 직접 고정하는 쪽이 정확하다).
  const [chipsBottomY, setChipsBottomY] = useState(0);
  const handleChipsAreaLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setChipsBottomY(y + height);
  }, []);
  const listSheetTop = chipsBottomY + LIST_SHEET_GAP_FROM_CHIPS;

  // 더미 데이터의 favorite 값을 그대로 두고, 토글한 것만 id 기준으로 덮어써서 들고 있는다.
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const isFavorite = useCallback(
    (marker: { id: string; favorite?: boolean }) => favoriteOverrides[marker.id] ?? marker.favorite ?? false,
    [favoriteOverrides],
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toggleFavorite = useCallback(
    (marker: { id: string; favorite?: boolean }, name: string) => {
      const nextIsFavorite = !isFavorite(marker);
      setFavoriteOverrides(prev => ({ ...prev, [marker.id]: nextIsFavorite }));

      setToastMessage(`${name}의 즐겨찾기가 ${nextIsFavorite ? '등록' : '해제'}되었습니다.`);
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
    },
    [isFavorite],
  );

  // 숫자 배지가 붙은(군집된) 카테고리 마커는 시설 하나의 정보가 아니라 그 자리에 겹친 여러
  // 시설의 리스트를 보여줘야 한다. 더미 리스트가 있으면 리스트를, 없으면(방금 만든 예시 말고
  // 나머지 count 마커들) 기존 단일 카드로 fallback한다. 동(건물) 마커 자체는 위치가 서로
  // 겹칠 일이 없어서 평소엔 항상 단일 카드로 연다("즐겨찾기" 칩에서 동 안 시설이 여러 개
  // 즐겨찾기된 경우는 openFavoriteDongSheet가 별도로 처리한다).
  const openDongMarkerSheet = useCallback((marker: DummyMapMarker) => {
    setSelectedFacility({ type: 'dong', marker });
  }, []);

  const openCategoryMarkerSheet = useCallback((marker: DummyCategoryMarker) => {
    const listItems = marker.count !== undefined ? DUMMY_FACILITY_LIST_ITEMS[marker.id] : undefined;
    if (listItems) {
      setSelectedFacility({ type: 'list', items: listItems });
    } else {
      setSelectedFacility({ type: 'category', marker });
    }
  }, []);

  // 카테고리 마커를 리스트 시트 항목 형태로 바꾼다. "즐겨찾기" 칩에서 같은 동에 즐겨찾기가
  // 여러 개 묶였을 때, 그 묶음을 FacilityListSheet에 그대로 넘기기 위해 쓴다.
  const toFacilityListItem = useCallback(
    (marker: DummyCategoryMarker): FacilityListSheetItem => ({
      id: marker.id,
      ...CATEGORY_MARKER_ICONS[marker.category],
      building: marker.buildingCode,
      place: marker.buildingName,
      room: marker.room,
      description: marker.description,
      isFavorite: isFavorite(marker),
      images: marker.images,
    }),
    [isFavorite],
  );

  const openFavoriteClusterSheet = useCallback(
    (group: DummyCategoryMarker[]) => {
      setSelectedFacility({ type: 'list', items: group.map(toFacilityListItem) });
    },
    [toFacilityListItem],
  );

  const openFavoriteDongSheet = useCallback((entry: FavoriteMapEntry) => {
    if (entry.facilityItems.length > 0) {
      openFavoriteClusterSheet(entry.facilityItems);
    } else {
      openDongMarkerSheet(entry.dongMarker);
    }
  }, [openFavoriteClusterSheet, openDongMarkerSheet]);

  // 지도 바닥을 탭했을 때도 스와이프로 닫을 때와 동일하게 부드럽게 슬라이드다운시킨다.
  // (state를 바로 null로 바꾸면 애니메이션 없이 뚝 끊겨서 사라진다.)
  const closeFacilitySheet = useCallback(() => {
    if (selectedFacility) bottomSheetRef.current?.close();
  }, [selectedFacility]);

  // 카테고리 칩을 누르면(활성/비활성 어느 방향이든) 지도 위 마커 구성 자체가 바뀌므로,
  // 열려있던 시설 정보 카드는 이전 마커를 가리키는 채로 남지 않게 항상 닫는다.
  const handleSelectCategory = useCallback(
    (key: CategoryKey | null) => {
      closeFacilitySheet();
      setSelectedKey(key);
    },
    [closeFacilitySheet],
  );

  // 동(건물) 마커는 칩이 하나도 안 켜져 있을 때만 보여준다. 특정 카테고리를 고르면 그
  // 카테고리 마커만 남기고, 동 마커는 화면에서 사라진다. "즐겨찾기" 칩은 아래 favoriteEntries가
  // 동 마커 자리를 대신 맡아서 그린다.
  const dongMarkers = useMemo(() => (selectedKey === null ? DUMMY_MAP_MARKERS : []), [selectedKey]);

  // 특정 카테고리 칩(즐겨찾기 제외)을 골랐을 때만 그 카테고리의 마커를 그대로 보여준다.
  const categoryMarkers = useMemo(
    () =>
      selectedKey === null || selectedKey === 'favorite'
        ? []
        : DUMMY_CATEGORY_MARKERS.filter(marker => marker.category === selectedKey),
    [selectedKey],
  );

  // "즐겨찾기" 칩은 새 마커를 만들지 않고, 실제 그 동(건물) 마커 위치에 그대로 표시한다.
  // 동 자체가 즐겨찾기됐을 수도 있고, 동 안의 시설(카테고리 마커) 중 일부만 즐겨찾기됐을
  // 수도 있어서(예: G동 식당·카페·편의점만 즐겨찾기) 둘을 동 단위로 합친다. 좌표 근접도가
  // 아니라 "같은 동 소속인지"로 묶는 것 — 실제 좌표 클러스터링(줌 레벨 기반)은 별도 이슈.
  const favoriteEntries = useMemo<FavoriteMapEntry[]>(() => {
    if (selectedKey !== 'favorite') return [];

    const entryByLabel = new Map<string, FavoriteMapEntry>();
    DUMMY_MAP_MARKERS.forEach(dongMarker => {
      if (dongMarker.favorite) {
        entryByLabel.set(dongMarker.label ?? dongMarker.id, { dongMarker, facilityItems: [] });
      }
    });
    DUMMY_CATEGORY_MARKERS.forEach(marker => {
      if (!isFavorite(marker)) return;
      let entry = entryByLabel.get(marker.buildingCode);
      if (!entry) {
        const dongMarker = DUMMY_MAP_MARKERS.find(dong => dong.label === marker.buildingCode);
        if (!dongMarker) return; // 매칭되는 동 마커가 없으면(더미 데이터 누락 등) 표시할 자리가 없어 건너뜀
        entry = { dongMarker, facilityItems: [] };
        entryByLabel.set(marker.buildingCode, entry);
      }
      entry.facilityItems.push(marker);
    });
    return Array.from(entryByLabel.values());
  }, [selectedKey, isFavorite]);

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
        {dongMarkers.map(marker => (
          <NaverMapMarker
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            label={marker.label}
            favorite={isFavorite(marker)}
            onPress={() => openDongMarkerSheet(marker)}
          />
        ))}
        {favoriteEntries.map(entry => (
          <NaverMapMarker
            key={entry.dongMarker.id}
            latitude={entry.dongMarker.latitude}
            longitude={entry.dongMarker.longitude}
            label={entry.dongMarker.label}
            favorite={isFavorite(entry.dongMarker)}
            count={entry.facilityItems.length || undefined}
            onPress={() => openFavoriteDongSheet(entry)}
          />
        ))}
        {categoryMarkers.map(marker => (
          <NaverMapCategoryMarker
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            favorite={isFavorite(marker)}
            count={marker.count}
            onPress={() => openCategoryMarkerSheet(marker)}
            {...CATEGORY_MARKER_ICONS[marker.category]}
          />
        ))}
      </NaverMapView>
      <SafeAreaView
        edges={['top']}
        style={styles.searchBarWrapper}
        pointerEvents="box-none"
        onLayout={handleChipsAreaLayout}
      >
        <View style={styles.searchBarPadding}>
          <SearchBar value="" onChangeText={() => {}} onPress={onSearchPress} />
        </View>
        <CategoryChipList selectedKey={selectedKey} onSelect={handleSelectCategory} />
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
          style={[
            styles.facilityCardWrapper,
            selectedFacility.type === 'list' ? { top: listSheetTop } : null,
          ]}
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
          ) : selectedFacility.type === 'category' ? (
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
          ) : selectedFacility.type === 'list' ? (
            <FacilityListSheet
              items={selectedFacility.items.map(item => ({
                ...item,
                isFavorite: favoriteOverrides[item.id] ?? item.isFavorite,
              }))}
              onSelectItem={item => setSelectedFacility({ type: 'item', item })}
              onToggleFavorite={item => toggleFavorite({ id: item.id, favorite: item.isFavorite }, item.room ?? item.place)}
              fillHeight
            />
          ) : (
            <FacilityInfoCard
              variant="facility"
              buildingCode={selectedFacility.item.building}
              buildingName={selectedFacility.item.place}
              facilityName={selectedFacility.item.room ?? selectedFacility.item.place}
              isFavorite={favoriteOverrides[selectedFacility.item.id] ?? selectedFacility.item.isFavorite}
              onToggleFavorite={() =>
                toggleFavorite(
                  { id: selectedFacility.item.id, favorite: selectedFacility.item.isFavorite },
                  selectedFacility.item.room ?? selectedFacility.item.place,
                )
              }
              images={selectedFacility.item.images}
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
