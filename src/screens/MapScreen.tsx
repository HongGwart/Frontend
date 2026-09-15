import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NaverMapView, NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import { useFacilityCardCameraFocus } from '@hooks/useFacilityCardCameraFocus';
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM } from '@constant/mapCamera';
import { SearchBar } from '@components/common/SearchBar';
import { CategoryChipList } from '@components/common/CategoryChipList';
import { FacilityInfoCard } from '@components/common/FacilityInfoCard';
import { FacilityListSheet, FacilityListSheetItem } from '@components/common/FacilityListSheet';
import { Toast } from '@components/common/Toast';
import {
  DismissibleBottomSheet,
  DismissibleBottomSheetRef,
  SWIPE_UP_DISTANCE,
} from '@components/common/DismissibleBottomSheet';
import {
  BUILDING_DETAIL_HEADER_HEIGHT,
  BuildingDetailBody,
  BuildingDetailHeader,
} from '@components/common/BuildingDetailContent';
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
import {
  DUMMY_FACILITY_COUNTS,
  DUMMY_FACILITY_IMAGES,
  DUMMY_MAIN_ENTRANCE,
  DUMMY_OPERATING_HOURS,
} from '@constant/dummyFacilityInfo';
import { DUMMY_FACILITY_LIST_ITEMS } from '@constant/dummyFacilityListItems';
import { FocusFacilityParam, MainTabParamList } from '@navigation/types';

interface Props {
  onSearchPress?: () => void;
  /** 시설 정보 카드를 위로 슬라이드했을 때 열어줄 건물 상세보기(BuildingDetailScreen). */
  onOpenBuildingDetail?: (buildingCode: string) => void;
  /** 마이페이지/즐겨찾기 목록에서 시설을 탭하고 넘어왔을 때, 열어줄 시설 정보 */
  focusFacility?: FocusFacilityParam;
}

// 지도 위 마커를 탭하면 아래에서 올려줄 시설 정보 바텀시트가 어떤 마커에 대한 것인지.
// 'list'는 숫자 배지가 붙은(군집된) 마커를 탭했을 때의 건물/시설 리스트, 'item'은 그
// 리스트에서 항목 하나를 골랐을 때 보여줄 상세 카드다.
type SelectedFacility =
  | { type: 'dong'; marker: DummyMapMarker }
  | { type: 'category'; marker: DummyCategoryMarker }
  | { type: 'list'; items: FacilityListSheetItem[] }
  | { type: 'item'; item: FacilityListSheetItem }
  // 마이페이지/즐겨찾기 목록에서 넘어온 시설(지도 마커가 아니라 라우트 파라미터로 들어옴)
  | { type: 'external'; facility: FocusFacilityParam };

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

// 시설 카드를 위로 슬라이드할 때 뒤에 겹쳐 그리는 건물 상세보기 미리보기가 화면 아래
// 어디서부터 올라오기 시작할지 계산하는 데 쓴다.
const WINDOW_HEIGHT = Dimensions.get('window').height;

export default function MapScreen({ onSearchPress, onOpenBuildingDetail, focusFacility }: Props) {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'map'>>();
  // 메인홈 카테고리 칩은 한 번에 하나만 선택된다. 실제 지도 필터링과의 연결은
  // 추후 지도 데이터가 준비되면 여기 selectedKey를 그대로 넘기면 된다.
  const [selectedKey, setSelectedKey] = useState<CategoryKey | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<SelectedFacility | null>(null);
  const bottomSheetRef = useRef<DismissibleBottomSheetRef>(null);
  const mapViewRef = useRef<NaverMapViewRef>(null);

  // 마커(동/카테고리)를 탭했을 때만 좌표가 있어서 카메라를 옮길 수 있다. 리스트/외부에서
  // 넘어온 시설은 지금은 카메라를 건드리지 않는다(검색 화면도 동일한 범위로만 지원).
  const cameraFocusTarget = useMemo(() => {
    if (!selectedFacility) return null;
    if (selectedFacility.type === 'dong' || selectedFacility.type === 'category') {
      return { latitude: selectedFacility.marker.latitude, longitude: selectedFacility.marker.longitude };
    }
    return null;
  }, [selectedFacility]);

  // 마커가 시설 카드에 가리지 않도록, 검색창+카테고리 칩 아래쪽 끝과 시설 카드 위쪽 끝
  // 사이의 세로 중앙에 마커가 오도록 카메라를 옮긴다(SearchScreen과 공유하는 훅).
  const { chipsBottomY, handleChipsAreaLayout, handleFacilityCardLayout } = useFacilityCardCameraFocus(
    mapViewRef,
    cameraFocusTarget,
  );
  // 리스트 시트는 그 지점 + 235px 아래에서부터 시작하도록 top으로 직접 고정한다(window
  // 높이로 역산하는 방식은 여러 화면 크기/세이프에어리어에서 오차가 생기기 쉬워서, top을
  // 직접 고정하는 쪽이 정확하다).
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

  // 시설 카드를 위로 슬라이드하면 그 건물의 상세보기(BuildingDetailScreen)로 넘어간다.
  // 'list'(겹친 마커 묶음)는 특정 건물 하나를 가리키지 않아서 지원하지 않는다.
  const swipeUpBuildingCode = useMemo(() => {
    if (!selectedFacility) return null;
    switch (selectedFacility.type) {
      case 'dong':
        return selectedFacility.marker.label ?? null;
      case 'category':
        return selectedFacility.marker.buildingCode;
      case 'item':
        return selectedFacility.item.building;
      case 'external':
        return selectedFacility.facility.buildingCode;
      default:
        return null;
    }
  }, [selectedFacility]);

  const handleSwipeUp = useCallback(() => {
    if (!swipeUpBuildingCode) return;
    onOpenBuildingDetail?.(swipeUpBuildingCode);
    // animateClose와 마찬가지로, 슬라이드업 애니메이션이 끝난 뒤 호출되므로 여기서
    // 바로 언마운트시켜도 끊겨 보이지 않는다 — 돌아왔을 때 카드가 화면 밖에 걸친
    // 채로 남아있지 않도록 정리한다.
    setSelectedFacility(null);
  }, [swipeUpBuildingCode, onOpenBuildingDetail]);

  // 카드를 드래그하는 동안(그리고 그 뒤 슬라이드업 애니메이션이 끝날 때까지) 실제
  // 화면 전환을 기다리지 않고, 카드 바로 뒤에 다음(BuildingDetailScreen) 내용을 실시간
  // 미리보기로 겹쳐 그려서 같이 딸려 올라오게 한다. DismissibleBottomSheet에 넘겨서
  // 그 컴포넌트가 직접 쓰는 translateY를 여기서도 그대로 들여다본다.
  const swipeCardTranslateY = useSharedValue(0);
  useEffect(() => {
    // 새 카드가 열릴 때마다(혹은 닫힐 때) 이전 드래그의 잔여값이 남아있지 않게 초기화한다.
    swipeCardTranslateY.value = 0;
  }, [selectedFacility, swipeCardTranslateY]);

  // 헤더는 -SWIPE_UP_DISTANCE만큼(= 실제로 커밋되는 지점) 끌어올리면 검색창 자리 위로
  // 빠르게 트랜지션해 나타난다. 본문과 달리 카드 이동 거리에 1:1로 붙지 않고 짧은
  // 구간에서 훅 나타나는 편이 헤더답게 느껴져서 progress(0~1)로 페이드+슬라이드한다.
  const insets = useSafeAreaInsets();
  const detailHeaderHeight = BUILDING_DETAIL_HEADER_HEIGHT + insets.top;
  const detailHeaderStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      swipeCardTranslateY.value,
      [0, -SWIPE_UP_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: progress,
      transform: [{ translateY: (1 - progress) * -12 }],
    };
  });

  // 본문은 헤더와 달리 카드 이동 거리를 그대로 따라간다 — 시설 카드의 bottom(항상 0,
  // 화면 진짜 바닥)이 곧 본문의 top이 되도록, 카드가 위로 밀린 만큼(swipeCardTranslateY)
  // 화면 바닥(WINDOW_HEIGHT)에서 그만큼 끌어올린 지점에 본문 상단이 오게 한다. 헤더
  // 아래로는 파고들지 않도록 헤더 높이에서 멈춘다.
  const detailBodyStyle = useAnimatedStyle(() => {
    const topY = WINDOW_HEIGHT + swipeCardTranslateY.value;
    const clampedTopY = Math.min(WINDOW_HEIGHT, Math.max(detailHeaderHeight, topY));
    return {
      transform: [{ translateY: clampedTopY }],
    };
  });

  // 시설 카드와 상세보기 본문이 사진/설명/"건물 내부 보기" 버튼처럼 거의 같은 내용을
  // 담고 있어서, 카드가 이동만 하고 그대로 안 사라지면 같은 정보가 두 겹으로 겹쳐
  // 보인다. 헤더와 같은 구간(커밋 지점까지)에서 카드를 반대로 페이드아웃시켜서, 카드가
  // 위로 밀려나며 사라지는 동시에 상세 내용이 그 자리를 이어받는 크로스페이드로 만든다.
  const cardFadeStyle = useAnimatedStyle(() => {
    if (!swipeUpBuildingCode) return { opacity: 1 };
    const progress = interpolate(
      swipeCardTranslateY.value,
      [0, -SWIPE_UP_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity: 1 - progress };
  });

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
      if (isFavorite(dongMarker)) {
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

  // 마이페이지/즐겨찾기 목록에서 시설을 탭하고 넘어오면, 그 시설 정보 바텀시트를 연다.
  // 한 번 소비한 뒤에는 파라미터를 비워서(같은 시설을 다시 눌러도 id가 바뀌면 다시 열리도록)
  // 탭을 평범하게 다시 방문했을 때 카드가 되살아나지 않게 한다.
  const consumedFocusIdRef = useRef<string | null>(null);
  useEffect(() => {
    // 파라미터를 소비한 뒤 비워지면(setParams) 여기서 ref를 초기화해서, 같은 시설을
    // 다시 선택했을 때도 카드가 다시 열리게 한다.
    if (!focusFacility) {
      consumedFocusIdRef.current = null;
      return;
    }
    if (consumedFocusIdRef.current === focusFacility.id) return;
    consumedFocusIdRef.current = focusFacility.id;
    setSelectedFacility({ type: 'external', facility: focusFacility });
    navigation.setParams({ focusFacility: undefined });
  }, [focusFacility, navigation]);

  return (
    <View style={styles.container}>
      <NaverMapView
        ref={mapViewRef}
        style={StyleSheet.absoluteFill}
        initialCamera={{
          latitude: 37.5504,
          longitude: 126.9251,
          zoom: 16,
        }}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
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
        // 탭 내비게이터의 화면 컨테이너(react-native-screens)는 탭 바를 실제로 숨겨도
        // 처음 잡은 크기를 그대로 들고 있어서, 카드를 그 안에 두면 탭 바가 차지하던
        // 만큼 화면 바닥에 못 붙고 그 위에 지도가 살짝 보이는 문제가 있었다. Modal로
        // 감싸면 탭 화면 크기와 완전히 무관하게 항상 진짜 디바이스 화면 전체를 기준으로
        // 그려져서 이 문제가 아예 생기지 않는다.
        <Modal transparent animationType="none" statusBarTranslucent onRequestClose={closeFacilitySheet}>
          {/* Modal은 iOS에서 별도의 네이티브 윈도우라, 안에서 스와이프로 닫는 제스처가
              동작하려면 gesture-handler 루트를 여기 한 번 더 둬야 한다. */}
          <GestureHandlerRootView style={styles.modalRoot}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeFacilitySheet}
              accessibilityLabel="시설 정보 닫기"
            />
            {/* 본문은 카드보다 먼저(=아래에) 그려서, 카드 밑단이 밀려 올라간 만큼만
                뒤에서 드러나는 것처럼 보이게 한다. 아직 실제 화면 전환 전이라 조작은
                막아둔다. */}
            {swipeUpBuildingCode && (
              <Animated.View
                style={[StyleSheet.absoluteFill, detailBodyStyle]}
                pointerEvents="none"
                // 안에 무거운(용량 큰) 더미 사진 SVG가 여러 장 있어서, 매 프레임 벡터를
                // 다시 그리는 대신 한 번 래스터화한 텍스처를 그대로 이동만 시킨다.
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
              // 상세 본문 미리보기(detailBodyStyle)가 완전히 자리잡으려면 화면 바닥에서
              // 헤더 높이까지(WINDOW_HEIGHT - detailHeaderHeight)는 밀어올려야 한다 —
              // 카드가 그보다 먼저 사라져서 화면 전환이 일어나면, 미리보기가 아직 덜
              // 올라온 채로 실제 화면으로 툭 끊겨 바뀌어 보인다.
              minSwipeUpDistance={swipeUpBuildingCode ? WINDOW_HEIGHT - detailHeaderHeight : undefined}
              style={[
                styles.facilityCardWrapper,
                selectedFacility.type === 'list' ? { top: listSheetTop } : null,
                cardFadeStyle,
              ]}
            >
              <View onLayout={handleFacilityCardLayout}>
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
          ) : selectedFacility.type === 'external' ? (
            <FacilityInfoCard
              variant="facility"
              buildingCode={selectedFacility.facility.buildingCode}
              buildingName={selectedFacility.facility.buildingName}
              facilityName={selectedFacility.facility.facilityName}
              isFavorite={
                favoriteOverrides[selectedFacility.facility.id] ?? selectedFacility.facility.isFavorite
              }
              onToggleFavorite={() =>
                toggleFavorite(
                  { id: selectedFacility.facility.id, favorite: selectedFacility.facility.isFavorite },
                  selectedFacility.facility.facilityName,
                )
              }
              images={DUMMY_FACILITY_IMAGES}
              operatingHours={DUMMY_OPERATING_HOURS}
              onViewInsidePress={() => {}}
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
          </GestureHandlerRootView>
        </Modal>
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
  modalRoot: {
    flex: 1,
  },
});
