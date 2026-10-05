import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NaverMapView, NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import * as Haptics from 'expo-haptics';
import { useFacilityCardCameraFocus } from '@hooks/useFacilityCardCameraFocus';
import { useBuildingDetailSwipeUp } from '@hooks/useBuildingDetailSwipeUp';
import { useCloseWhenCovered } from '@hooks/useCloseWhenCovered';
import { toRoutePlaceLabel, useRouteButtonProps } from '@hooks/useRouteButtonProps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM } from '@constant/mapCamera';
import { SearchBar } from '@components/common/SearchBar';
import { CategoryChipList } from '@components/common/CategoryChipList';
import { FacilityInfoCard } from '@components/common/FacilityInfoCard';
import { FacilityListSheet, FacilityListSheetItem } from '@components/common/FacilityListSheet';
import { Toast } from '@components/common/Toast';
import { DismissibleBottomSheet, DismissibleBottomSheetRef } from '@components/common/DismissibleBottomSheet';
import { BuildingDetailBody, BuildingDetailHeader } from '@components/common/BuildingDetailContent';
import { DevFloorOverlayLayer, DevFloorOverlayPanel, useDevFloorOverlay } from '@components/map/DevFloorOverlayPicker';
import { DevRouteNodeLayer, DevRouteNodePanel, useDevRouteNodes } from '@components/map/DevRouteNodePicker';
import { TEST_ROUTE_DEPARTURE_LABEL, TEST_ROUTE_DESTINATION_LABEL } from '@constant/testIndoorRoute';
import { FocusableCategoryMarker, FocusableDongMarker } from '@components/map/FocusableMarkers';
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
import {
  favoriteFromCategoryMarker,
  favoriteFromDongMarker,
  favoriteFromFocusParam,
  favoriteFromListItem,
} from '@constant/favoriteInputs';
import { FavoriteInput, useFavorites } from '@hooks/useFavorites';
import { FocusFacilityParam, MainTabParamList, RootStackParamList } from '@navigation/types';

interface Props {
  onSearchPress?: () => void;
  /** 시설 정보 카드를 위로 슬라이드했을 때 열어줄 건물 상세보기(BuildingDetailScreen). */
  onOpenBuildingDetail?: (buildingCode: string) => void;
  /** 건물 카드의 "건물 내부 보기"를 눌렀을 때 열어줄 건물 내부 지도(BuildingIndoorScreen). */
  onOpenBuildingIndoor?: (building: RootStackParamList['BuildingIndoor']) => void;
  /** 마이페이지/즐겨찾기 목록에서 시설을 탭하고 넘어왔을 때, 열어줄 시설 정보 */
  focusFacility?: FocusFacilityParam;
}

// 지도 위 마커를 탭하면 아래에서 올려줄 시설 정보 바텀시트가 어떤 마커에 대한 것인지.
// 'list'는 숫자 배지가 붙은(군집된) 마커를 탭했을 때의 건물/시설 리스트, 'item'은 그
// 리스트에서 항목 하나를 골랐을 때 보여줄 상세 카드다.
type SelectedFacility =
  | { type: 'dong'; marker: DummyMapMarker }
  | { type: 'category'; marker: DummyCategoryMarker }
  // markerId는 이 리스트를 열게 한 지도 위 군집 마커의 id — 강조 표시(active)에만 쓴다.
  | { type: 'list'; items: FacilityListSheetItem[]; markerId?: string }
  // markerId는 이 항목이 들어있던 리스트를 열게 한 군집 마커의 id — 리스트에서 항목으로 넘어가도 그 마커만 지도에 남긴다.
  | { type: 'item'; item: FacilityListSheetItem; markerId?: string }
  // 마이페이지/즐겨찾기 목록에서 넘어온 시설(지도 마커가 아니라 라우트 파라미터로 들어옴)
  | { type: 'external'; facility: FocusFacilityParam };

// "즐겨찾기" 칩에서 지도에 찍을 동 하나의 정보. 그 동 자체가 즐겨찾기됐을 수도 있고,
// 그 동 안의 시설(카테고리 마커) 중 일부만 즐겨찾기됐을 수도 있어서 둘을 같이 들고 있는다.
interface FavoriteMapEntry {
  dongMarker: DummyMapMarker;
  facilityItems: DummyCategoryMarker[];
}

const TOAST_DURATION_MS = 2000;
// 개발용 지도 도구(🏢 평면도 얹기, 🧭 경로 노드 찍기) 원형 버튼을 메인홈에 보여줄지. 기능 코드는 그대로 두고 버튼만
// 숨겨 둔다 — 평면도/테스트 경로를 다시 손봐야 할 때 true로 바꾸면 된다(개발 빌드에서만 보인다).
const SHOW_DEV_MAP_TOOLS = false;
// 지도 위에서 봤을 때 마커가 다른 요소에 비해 좀 커 보여서, 기본 크기보다 살짝 줄인다.
const MAP_MARKER_SCALE = 0.85;
const INITIAL_ZOOM = 16;

// 겹쳐진 마커 리스트 시트는 카테고리 칩 아래로 이 간격(피그마 기준)만큼 띄우고, 그 지점부터
// 화면 끝까지를 항상 채운다(항목이 적어도 빈 공간으로 남지 않고 시트 자체가 그 높이를 가짐).
const LIST_SHEET_GAP_FROM_CHIPS = 235;

export default function MapScreen({ onSearchPress, onOpenBuildingDetail, onOpenBuildingIndoor, focusFacility }: Props) {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'map'>>();
  // 메인홈 카테고리 칩은 한 번에 하나만 선택된다. 실제 지도 필터링과의 연결은
  // 추후 지도 데이터가 준비되면 여기 selectedKey를 그대로 넘기면 된다.
  const [selectedKey, setSelectedKey] = useState<CategoryKey | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<SelectedFacility | null>(null);
  const bottomSheetRef = useRef<DismissibleBottomSheetRef>(null);
  const mapViewRef = useRef<NaverMapViewRef>(null);
  const insets = useSafeAreaInsets();
  const floorOverlay = useDevFloorOverlay(mapViewRef);
  // 경로 노드를 다 찍고 완료하면 길찾기로 넘어가서 카페나무 → 816호 경로를 바로 띄운다.
  const routeNodes = useDevRouteNodes({
    onComplete: () =>
      navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Navigation', {
        routeSelection: {
          departureLabel: TEST_ROUTE_DEPARTURE_LABEL,
          destinationLabel: TEST_ROUTE_DESTINATION_LABEL,
        },
      }),
  });
  const devModeActive = floorOverlay.active || routeNodes.active;

  // 지금 포커싱된(눌러서 카드가 열리는) 마커의 id — 이 마커만 강조(active) + 네임택으로 남기고 나머지는 숨긴다.
  // 카드(selectedFacility)와 따로 들고 있는 이유: 마커를 누르면 마커 모양은 그 즉시 바뀌고, 무거운 카드는
  // 다음 프레임에 열리게 해서(openFacilityCard) 카드 렌더가 마커 변화를 붙잡아 두지 않게 하려고.
  // list/item은 그 리스트를 열게 한 군집 마커의 id다.
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const openFacilityCard = useCallback((markerId: string, next: SelectedFacility) => {
    setSelectedMarkerId(markerId);
    requestAnimationFrame(() => setSelectedFacility(next));
  }, []);
  // 카드가 닫히면 포커싱도 푼다(열려 있다가 닫힌 경우만 — 마커를 누른 직후 카드가 아직 안 열린 프레임은 제외).
  const hadCardRef = useRef(false);
  useEffect(() => {
    if (selectedFacility) {
      hadCardRef.current = true;
    } else if (hadCardRef.current) {
      hadCardRef.current = false;
      setSelectedMarkerId(null);
    }
  }, [selectedFacility]);
  // 마커 하나를 눌러 카드가 열려 있으면 그 마커만 지도에 남긴다(카드를 닫으면 다시 전부 보인다).
  const isMarkerHidden = useCallback(
    (markerId: string) => selectedMarkerId !== null && markerId !== selectedMarkerId,
    [selectedMarkerId],
  );

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
  const { chipsBottomY, cardHeight, handleChipsAreaLayout, handleFacilityCardLayout } = useFacilityCardCameraFocus(
    mapViewRef,
    cameraFocusTarget,
  );
  // 리스트 시트는 그 지점 + 235px 아래에서부터 시작하도록 top으로 직접 고정한다(window
  // 높이로 역산하는 방식은 여러 화면 크기/세이프에어리어에서 오차가 생기기 쉬워서, top을
  // 직접 고정하는 쪽이 정확하다).
  const listSheetTop = chipsBottomY + LIST_SHEET_GAP_FROM_CHIPS;

  // 즐겨찾기는 기기 로컬에 저장된 앱 전역 상태(FavoritesProvider). 마커/리스트 항목은 favoriteFrom*로
  // 저장 형태로 바꿔서 묻는다 — 같은 장소면 검색/마이페이지/길찾기와 같은 장소 키가 나온다.
  const { isFavorite, toggleFavorite: toggleFavoritePlace } = useFavorites();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toggleFavorite = useCallback(
    (place: FavoriteInput, name: string) => {
      const nextIsFavorite = toggleFavoritePlace(place);

      setToastMessage(`${name}의 즐겨찾기가 ${nextIsFavorite ? '등록' : '해제'}되었습니다.`);
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
    },
    [toggleFavoritePlace],
  );

  // 숫자 배지가 붙은(군집된) 카테고리 마커는 시설 하나의 정보가 아니라 그 자리에 겹친 여러
  // 시설의 리스트를 보여줘야 한다. 더미 리스트가 있으면 리스트를, 없으면(방금 만든 예시 말고
  // 나머지 count 마커들) 기존 단일 카드로 fallback한다. 동(건물) 마커 자체는 위치가 서로
  // 겹칠 일이 없어서 평소엔 항상 단일 카드로 연다("즐겨찾기" 칩에서 동 안 시설이 여러 개
  // 즐겨찾기된 경우는 openFavoriteDongSheet가 별도로 처리한다).
  const openDongMarkerSheet = useCallback((marker: DummyMapMarker) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openFacilityCard(marker.id, { type: 'dong', marker });
  }, [openFacilityCard]);

  const openCategoryMarkerSheet = useCallback((marker: DummyCategoryMarker) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const listItems = marker.count !== undefined ? DUMMY_FACILITY_LIST_ITEMS[marker.id] : undefined;
    if (listItems) {
      openFacilityCard(marker.id, { type: 'list', items: listItems, markerId: marker.id });
    } else {
      openFacilityCard(marker.id, { type: 'category', marker });
    }
  }, [openFacilityCard]);

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
      isFavorite: isFavorite(favoriteFromCategoryMarker(marker)),
      images: marker.images,
    }),
    [isFavorite],
  );

  const openFavoriteClusterSheet = useCallback(
    (group: DummyCategoryMarker[], markerId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      openFacilityCard(markerId, { type: 'list', items: group.map(toFacilityListItem), markerId });
    },
    [toFacilityListItem, openFacilityCard],
  );

  const openFavoriteDongSheet = useCallback((entry: FavoriteMapEntry) => {
    if (entry.facilityItems.length > 0) {
      openFavoriteClusterSheet(entry.facilityItems, entry.dongMarker.id);
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

  // "건물 내부 보기"로 넘어가면 이 카드는 역할을 다했으니(내부 지도 화면 하단에 같은 건물 카드가
  // 이어서 뜬다), 내부 지도 화면이 지도를 완전히 덮은 뒤 조용히 닫아서 돌아왔을 때 남아있지 않게 한다.
  const closeFacilityCard = useCallback(() => setSelectedFacility(null), []);
  // 카드의 출발/도착 → 길찾기 탭으로 가서 입력창을 채운다. 카드가 Modal이라 다른 탭 위에도
  // 그대로 떠 있으니 이동 전에 먼저 닫는다.
  const routeButtonProps = useRouteButtonProps(closeFacilityCard);
  const closeCardWhenCovered = useCloseWhenCovered(
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>(),
    closeFacilityCard,
  );

  // 시설 카드(카페·편의점 등)의 "건물 내부 보기"는 그 시설이 있는 건물(동)의 내부 지도로 간다. 건물명/설명은
  // 동 마커 데이터에서 가져오고, 비어 있으면 카드에 쓰인 건물명을 쓴다.
  const openBuildingIndoorOf = useCallback(
    (buildingCode: string, fallbackBuildingName: string) => {
      const dongMarker = DUMMY_MAP_MARKERS.find(marker => marker.label === buildingCode);
      closeCardWhenCovered();
      onOpenBuildingIndoor?.({
        buildingCode,
        buildingName: dongMarker?.buildingName || fallbackBuildingName,
        description: dongMarker?.description ?? '',
        fromCardHeight: cardHeight,
      });
    },
    [closeCardWhenCovered, onOpenBuildingIndoor, cardHeight],
  );

  const handleSwipeUp = useCallback(() => {
    if (!swipeUpBuildingCode) return;
    onOpenBuildingDetail?.(swipeUpBuildingCode);
    // animateClose와 마찬가지로, 슬라이드업 애니메이션이 끝난 뒤 호출되므로 여기서
    // 바로 언마운트시켜도 끊겨 보이지 않는다 — 돌아왔을 때 카드가 화면 밖에 걸친
    // 채로 남아있지 않도록 정리한다.
    setSelectedFacility(null);
  }, [swipeUpBuildingCode, onOpenBuildingDetail]);

  // 카드를 드래그하는 동안(그리고 그 뒤 슬라이드업 애니메이션이 끝날 때까지) 실제 화면
  // 전환을 기다리지 않고, 카드 바로 뒤/위에 다음(BuildingDetailScreen) 헤더·본문을
  // 실시간 미리보기로 겹쳐 그려서 같이 딸려 올라오게 한다. SearchScreen과 공유하는 훅.
  const {
    swipeCardTranslateY,
    detailHeaderStyle,
    detailBodyStyle,
    cardFadeStyle,
    minSwipeUpDistance,
  } = useBuildingDetailSwipeUp(swipeUpBuildingCode, selectedFacility);

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
      if (isFavorite(favoriteFromDongMarker(dongMarker))) {
        entryByLabel.set(dongMarker.label ?? dongMarker.id, { dongMarker, facilityItems: [] });
      }
    });
    DUMMY_CATEGORY_MARKERS.forEach(marker => {
      if (!isFavorite(favoriteFromCategoryMarker(marker))) return;
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

  // 동 마커. 네임택(R동, T동 …)은 지금 카드가 열려 있는(포커싱된) 마커에만 붙이고 나머지는 핀만 그린다 —
  // 네임택이 전부 떠 있으면 서로 겹치고 지도를 가려서. 포커싱이 바뀌면 그 마커만 다시 그려진다.
  const dongMarkerItems = useMemo(
    () => [
      ...dongMarkers.map(marker => ({
        key: marker.id,
        latitude: marker.latitude,
        longitude: marker.longitude,
        label: marker.label,
        favorite: isFavorite(favoriteFromDongMarker(marker)),
        focused: selectedMarkerId === marker.id,
        scale: MAP_MARKER_SCALE,
        onPress: () => openDongMarkerSheet(marker),
      })),
      ...favoriteEntries.map(entry => ({
        key: entry.dongMarker.id,
        latitude: entry.dongMarker.latitude,
        longitude: entry.dongMarker.longitude,
        label: entry.dongMarker.label,
        favorite: isFavorite(favoriteFromDongMarker(entry.dongMarker)),
        count: entry.facilityItems.length || undefined,
        focused: selectedMarkerId === entry.dongMarker.id,
        scale: MAP_MARKER_SCALE,
        onPress: () => openFavoriteDongSheet(entry),
      })),
    ],
    [dongMarkers, favoriteEntries, isFavorite, selectedMarkerId, openDongMarkerSheet, openFavoriteDongSheet],
  );

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
          zoom: INITIAL_ZOOM,
        }}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        // 마커가 아닌 지도 바닥을 탭하면 열려있던 시설 정보 바텀시트를 닫는다.
        onTapMap={
          routeNodes.active ? routeNodes.handleTap : floorOverlay.active ? undefined : closeFacilitySheet
        }
      >
        <DevFloorOverlayLayer picker={floorOverlay} />
        <DevRouteNodeLayer
          picker={routeNodes}
          floorAnchors={floorOverlay.anchors}
          liveFloorImages={floorOverlay.liveImages}
        />
        {!devModeActive &&
          dongMarkerItems.map(({ key, ...item }) => (
            <FocusableDongMarker key={key} {...item} hidden={isMarkerHidden(key)} />
          ))}
        {!devModeActive && categoryMarkers.map(marker => (
          <FocusableCategoryMarker
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            favorite={isFavorite(favoriteFromCategoryMarker(marker))}
            count={marker.count}
            focused={selectedMarkerId === marker.id}
            hidden={isMarkerHidden(marker.id)}
            scale={MAP_MARKER_SCALE}
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
              // 상세 본문 미리보기가 완전히 자리잡기 전에 카드가 먼저 사라져서 화면
              // 전환이 일어나면(중간에 툭 끊겨 보임) 안 되니, 그만큼은 밀어올리게 한다.
              minSwipeUpDistance={swipeUpBuildingCode ? minSwipeUpDistance : undefined}
              style={[
                styles.facilityCardWrapper,
                selectedFacility.type === 'list' ? { top: listSheetTop } : null,
                cardFadeStyle,
              ]}
            >
              <View style={styles.facilityCardContent} onLayout={handleFacilityCardLayout}>
              {selectedFacility.type === 'dong' ? (
            <FacilityInfoCard
              variant="outside"
              buildingCode={selectedFacility.marker.label ?? ''}
              buildingName={selectedFacility.marker.buildingName}
              description={selectedFacility.marker.description}
              isFavorite={isFavorite(favoriteFromDongMarker(selectedFacility.marker))}
              onToggleFavorite={() =>
                toggleFavorite(favoriteFromDongMarker(selectedFacility.marker), selectedFacility.marker.buildingName)
              }
              images={selectedFacility.marker.images}
              {...routeButtonProps(
                toRoutePlaceLabel(selectedFacility.marker.label, selectedFacility.marker.buildingName),
              )}
              facilityCounts={DUMMY_FACILITY_COUNTS}
              mainEntrance={DUMMY_MAIN_ENTRANCE}
              operatingHours={DUMMY_OPERATING_HOURS}
              onViewInsidePress={() => {
                closeCardWhenCovered();
                onOpenBuildingIndoor?.({
                  buildingCode: selectedFacility.marker.label ?? '',
                  buildingName: selectedFacility.marker.buildingName,
                  description: selectedFacility.marker.description,
                  fromCardHeight: cardHeight,
                });
              }}
            />
          ) : selectedFacility.type === 'category' ? (
            <FacilityInfoCard
              variant="facility"
              buildingCode={selectedFacility.marker.buildingCode}
              buildingName={selectedFacility.marker.buildingName}
              facilityName={selectedFacility.marker.room}
              isFavorite={isFavorite(favoriteFromCategoryMarker(selectedFacility.marker))}
              onToggleFavorite={() =>
                toggleFavorite(favoriteFromCategoryMarker(selectedFacility.marker), selectedFacility.marker.room)
              }
              images={selectedFacility.marker.images}
              {...routeButtonProps(
                toRoutePlaceLabel(
                  selectedFacility.marker.buildingCode,
                  selectedFacility.marker.buildingName,
                  selectedFacility.marker.room,
                ),
              )}
              operatingHours={DUMMY_OPERATING_HOURS}
              onViewInsidePress={() =>
                openBuildingIndoorOf(selectedFacility.marker.buildingCode, selectedFacility.marker.buildingName)
              }
            />
          ) : selectedFacility.type === 'list' ? (
            <FacilityListSheet
              items={selectedFacility.items.map(item => ({
                ...item,
                isFavorite: isFavorite(favoriteFromListItem(item)),
              }))}
              onSelectItem={item =>
                setSelectedFacility({ type: 'item', item, markerId: selectedFacility.markerId })
              }
              onToggleFavorite={item => toggleFavorite(favoriteFromListItem(item), item.room ?? item.place)}
              fillHeight
            />
          ) : selectedFacility.type === 'external' ? (
            <FacilityInfoCard
              variant="facility"
              buildingCode={selectedFacility.facility.buildingCode}
              buildingName={selectedFacility.facility.buildingName}
              facilityName={selectedFacility.facility.facilityName}
              isFavorite={isFavorite(favoriteFromFocusParam(selectedFacility.facility))}
              onToggleFavorite={() =>
                toggleFavorite(
                  favoriteFromFocusParam(selectedFacility.facility),
                  selectedFacility.facility.facilityName,
                )
              }
              images={DUMMY_FACILITY_IMAGES}
              {...routeButtonProps(
                toRoutePlaceLabel(
                  selectedFacility.facility.buildingCode,
                  selectedFacility.facility.buildingName,
                  selectedFacility.facility.facilityName,
                ),
              )}
              operatingHours={DUMMY_OPERATING_HOURS}
              onViewInsidePress={() =>
                openBuildingIndoorOf(selectedFacility.facility.buildingCode, selectedFacility.facility.buildingName)
              }
            />
          ) : (
            <FacilityInfoCard
              variant="facility"
              buildingCode={selectedFacility.item.building}
              buildingName={selectedFacility.item.place}
              facilityName={selectedFacility.item.room ?? selectedFacility.item.place}
              isFavorite={isFavorite(favoriteFromListItem(selectedFacility.item))}
              onToggleFavorite={() =>
                toggleFavorite(
                  favoriteFromListItem(selectedFacility.item),
                  selectedFacility.item.room ?? selectedFacility.item.place,
                )
              }
              images={selectedFacility.item.images}
              {...routeButtonProps(
                toRoutePlaceLabel(selectedFacility.item.building, selectedFacility.item.place, selectedFacility.item.room),
              )}
              operatingHours={DUMMY_OPERATING_HOURS}
              onViewInsidePress={() => openBuildingIndoorOf(selectedFacility.item.building, selectedFacility.item.place)}
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
      {SHOW_DEV_MAP_TOOLS && (
        <>
          <DevFloorOverlayPanel picker={floorOverlay} topInset={insets.top} />
          <DevRouteNodePanel picker={routeNodes} topInset={insets.top} floorAnchors={floorOverlay.anchors} />
        </>
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
  // FacilityListSheet의 fillHeight는 부모가 flex:1로 실제 높이를 내려줘야 동작하는데,
  // 카메라 포커스 측정용으로 감싼 onLayout View에 flex가 없으면 0에 가깝게 찌그러진다.
  facilityCardContent: {
    flex: 1,
  },
  modalRoot: {
    flex: 1,
  },
});
