import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NaverMapView, NaverMapPolylineOverlay, NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import Animated, { FadeIn, FadeOut, useSharedValue } from 'react-native-reanimated';
import styled, { useTheme } from 'styled-components/native';
import NavigationArrowIcon from '@assets/svgs/icons/navigationArrow.svg';
import NavigationStartIcon from '@assets/svgs/icons/navigationStart.svg';
import DestinationMarkerIcon from '@assets/svgs/icons/destinationMarker.svg';
import GpsIcon from '@assets/svgs/icons/gps.svg';
import ExchangeIcon from '@assets/svgs/icons/exchange.svg';
import IndoorIcon from '@assets/svgs/icons/indoor.svg';
import BlueLogoSymbol from '@assets/svgs/blueLogoSymbol.svg';
import { RouteInputField } from '@components/navigation/RouteInputField';
import { RouteOptionChip } from '@components/navigation/RouteOptionChip';
import { RouteResultCard } from '@components/navigation/RouteResultCard';
import { RouteStepRow } from '@components/navigation/RouteStepRow';
import { Toast } from '@components/common/Toast';
import { Button } from '@components/common/Button';
import { CollapsibleBottomSheet } from '@components/common/CollapsibleBottomSheet';
import Header from '@components/layout/Header';
import { NaverMapMarker } from '@components/map/NaverMapMarker';
import { NaverMapStartPointMarker } from '@components/map/NaverMapStartPointMarker';
import { ROUTE_OPTIONS, RouteOptionKey } from '@constant/routeOptions';
import { DUMMY_DEFAULT_DEPARTURE } from '@constant/dummyMypage';
import { buildTestRoute, getRouteMapData, isTestRoutePair } from '@constant/testIndoorRoute';
import {
  DUMMY_ROUTE_RESULTS,
  DUMMY_ELEVATOR_WARNING_MESSAGE,
} from '@constant/dummyRouteResults';
import { MAP_MIN_ZOOM, MAP_MAX_ZOOM } from '@constant/mapCamera';
import { RootStackParamList } from '@navigation/types';
import { regionToFit } from '@utils/routePath';
import { useRouteSearch } from '@api/route/useRouteSearch';
import { getErrorMessage } from '@api/errors';

// Header.tsx의 Container height와 동일한 값 — 경로 보기 화면에서 지도 위에 얹는
// 투명 헤더의 실제 높이(세이프에어리어 제외)를 지도 카메라 패딩 계산에 재사용한다.
const ROUTE_VIEW_HEADER_HEIGHT = 56;
// 경로 보기 카드를 끌어내렸을 때 하단 세이프에어리어 위로 남겨둘 높이 —
// 시트 padding-top(8) + 그래버(4) + 아래 여백 12px.
const DETAIL_SHEET_PEEK_HEIGHT = 24;

// "길 찾기_경로 선택"(720:10860). 탭이 아니라 루트 스택(RootNavigator)에 push되는 화면이라 —
// native-stack의 기본 스와이프 백 제스처(gestureEnabled)가 그대로 적용돼서, 오른쪽으로 밀면
// 진짜로 살아있는 이전 화면(map 탭 등)이 애플뮤직처럼 실시간으로 비친다. 탭이던 시절엔 화면이
// 늘 마운트돼 있어서 이 효과를 직접(제스처+가짜 미리보기로) 흉내내야 했는데, 이제는 필요 없다.
export default function NavigationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Navigation'>>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  // 서버 검색 결과에서 고른 출발/도착의 노드 id. 둘 다 있으면 실제 경로 탐색 API를 쓴다.
  const [departureNodeId, setDepartureNodeId] = useState<number | undefined>();
  const [destinationNodeId, setDestinationNodeId] = useState<number | undefined>();
  // 경로 옵션은 라디오처럼 한 번에 하나만 고를 수 있다. 같은 칩을 다시 누르면 선택 해제.
  const [selectedOption, setSelectedOption] = useState<RouteOptionKey | null>(null);

  // RouteLocationSearchScreen에서 항목을 골라 돌아오면 routeSelection 파라미터로 실려 온다.
  // 항상 출발/도착 값을 함께 담아 오므로 두 값을 각각 독립적으로 반영하면 되고(한쪽만
  // 왔다고 다른 쪽을 건드리지 않음), 적용한 뒤에는 파라미터를 비워서 같은 곳을 다시
  // 골랐을 때도 이 effect가 또 반응하게 한다.
  useEffect(() => {
    const selection = params?.routeSelection;
    if (!selection) return;
    if (selection.departureLabel !== undefined) {
      setDeparture(selection.departureLabel);
      setDepartureNodeId(selection.departureNodeId);
    }
    if (selection.destinationLabel !== undefined) {
      setDestination(selection.destinationLabel);
      setDestinationNodeId(selection.destinationNodeId);
    }
    navigation.setParams({ routeSelection: undefined });
  }, [params?.routeSelection, navigation]);

  const swapValues = () => {
    setDeparture(destination);
    setDestination(departure);
    setDepartureNodeId(destinationNodeId);
    setDestinationNodeId(departureNodeId);
  };

  const toggleOption = (key: RouteOptionKey) => {
    setSelectedOption(prev => (prev === key ? null : key));
  };

  // 출발/도착지가 둘 다 채워지면 빈 상태 대신 경로 목록을 보여준다.
  const hasRoute = departure.length > 0 && destination.length > 0;
  // 둘 다 서버 검색 결과로 골랐으면 서버 경로(GET /api/route)를 쓴다.
  const routeSearch = useRouteSearch({ fromNodeId: departureNodeId, toNodeId: destinationNodeId });
  // 서버 경로를 못 쓰면(앱 더미 장소를 골랐을 때) — 출발/도착이 실내 길찾기 테스트 쌍(R동 카페나무 → C동
  // 816호)이고 노드를 다 찍어뒀으면 그 경로 하나만, 아니면 더미 경로를 보여준다.
  const allRouteResults = useMemo(() => {
    if (routeSearch.enabled) return routeSearch.routes.map(view => view.result);
    const testRoute = isTestRoutePair(departure, destination) ? buildTestRoute() : null;
    return testRoute ? [testRoute.result] : DUMMY_ROUTE_RESULTS;
  }, [routeSearch.enabled, routeSearch.routes, departure, destination]);
  // 경로 옵션 칩을 고르면 그 옵션 경로만 보여준다.
  const routeResults = useMemo(
    () => (selectedOption ? allRouteResults.filter(route => route.option === selectedOption) : allRouteResults),
    [allRouteResults, selectedOption],
  );
  // 경로 목록 대신 띄울 안내 — 찾는 중/경로 없음/실패/고른 옵션의 경로 없음.
  const routeStatusText = routeSearch.isLoading
    ? '경로를 찾고 있어요'
    : routeSearch.notFound
      ? '두 장소를 잇는 경로를 찾지 못했어요'
      : routeSearch.error
        ? getErrorMessage(routeSearch.error, '경로를 불러오지 못했어요.')
        : routeResults.length === 0
          ? '이 옵션으로 갈 수 있는 경로가 없어요'
          : null;
  const hasElevatorWarning = useMemo(() => routeResults.some(route => route.elevatorWarning), [routeResults]);

  // 경로 카드를 누르면 페이지 이동 대신 이 화면 안에서 지도+구간 안내 컴포넌트로 바꿔치기한다.
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const selectedRoute = useMemo(
    () => routeResults.find(route => route.id === selectedRouteId) ?? null,
    [routeResults, selectedRouteId],
  );
  // 경로선/출발·도착 핀/경로 보기 카메라 — 선택한 경로 기준.
  const routeMap = useMemo(() => {
    const apiView = routeSearch.routes.find(view => view.result.id === selectedRouteId);
    return apiView ? apiView.map : getRouteMapData(selectedRouteId);
  }, [routeSearch.routes, selectedRouteId]);

  // 경로 보기 카드를 끌어내리면(Figma "길 찾기_전체 경로" 762:4620) 지도를 전체로 펼치고
  // 상단에 헤더 + 출발/도착 입력을 띄운다. 지도 카메라 패딩을 맞추려고 시트/상단 패널 높이를 잰다.
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [detailSheetHeight, setDetailSheetHeight] = useState(0);
  const [collapsedTopPanelHeight, setCollapsedTopPanelHeight] = useState(0);
  const detailScrollOffset = useSharedValue(0);
  useEffect(() => {
    setIsSheetCollapsed(false);
  }, [selectedRouteId]);

  // 경로선 꺾이는 점 + 출발·도착 핀이 전부 "헤더 밑~카드 위" 사이에 들어오게 카메라를 맞춘다. 좌표는
  // 지금은 더미/테스트 경로지만, 백엔드가 넘겨주는 경로 좌표를 routeMap.path에 넣으면 그대로 맞춰진다.
  const fitRegion = useMemo(
    () => regionToFit([...routeMap.path, routeMap.start, routeMap.end]),
    [routeMap],
  );

  // 카드를 내린 동안엔 지도를 자유롭게 확대/이동할 수 있으니, 다시 올리면 경로 전체가 보이게 되돌린다.
  // 이 effect는 mapPadding이 펼친 상태 값(카드 높이 포함)으로 바뀐 렌더 뒤에 돌아서, 지도가 가려진 부분을
  // 뺀 영역 기준으로 맞춘다. 카드 높이를 처음 잰 순간에는 애니메이션 없이 바로 맞춰서, 화면에 들어오자마자
  // 줌이 한 번 더 바뀌어 보이지 않게 한다.
  const mapRef = useRef<NaverMapViewRef>(null);
  const hasFittedRef = useRef(false);
  useEffect(() => {
    hasFittedRef.current = false;
  }, [selectedRouteId]);
  useEffect(() => {
    if (isSheetCollapsed || !fitRegion || detailSheetHeight === 0) return;
    mapRef.current?.animateRegionTo({ ...fitRegion, duration: hasFittedRef.current ? 300 : 0 });
    hasFittedRef.current = true;
  }, [isSheetCollapsed, fitRegion, detailSheetHeight]);

  // @mj-studio/react-native-naver-map의 NaverMapPolylineOverlay 버그 우회: capType/joinType의
  // "선언된 기본값"이 둘 다 Round라서, 처음부터 "Round"를 넘기면 네이티브가 "이전 값과
  // 같다"고 보고 실제로 반영을 안 한다(outlineWidth=0이 안 먹히던 것과 같은 버그). 그래서
  // 기본값과 다른 값(Butt/Miter)으로 먼저 그렸다가, 마운트 직후 진짜로 Round로 "바꿔서"
  // 네이티브가 변경을 감지하게 만든다.
  const [routeLineCapReady, setRouteLineCapReady] = useState(false);
  useEffect(() => {
    if (!selectedRoute) {
      setRouteLineCapReady(false);
      return;
    }
    const id = requestAnimationFrame(() => setRouteLineCapReady(true));
    return () => cancelAnimationFrame(id);
  }, [selectedRoute]);

  // 기본 화면 상단과, 경로 보기 카드를 끌어내렸을 때의 상단 패널이 같은 입력 영역을 쓴다.
  // 카드를 접었을 때는 보여주기만 하고 검색 이동/지우기/출발·도착 바꾸기를 모두 막는다.
  const renderRouteInputSection = (disabled: boolean) => (
    <InputSection>
      <SwapButton onPress={swapValues} disabled={disabled} hitSlop={8}>
        <ExchangeIcon width={24} height={24} color={theme.semantic.icon.secondary} />
      </SwapButton>
      <InputColumn>
        <RouteInputField
          icon={NavigationArrowIcon}
          value={departure}
          placeholder="출발지를 입력하세요"
          onPress={() =>
            navigation.navigate('RouteLocationSearch', {
              target: 'departure',
              departureLabel: departure,
              destinationLabel: destination,
              departureNodeId,
              destinationNodeId,
            })
          }
          onClear={() => {
            setDeparture('');
            setDepartureNodeId(undefined);
          }}
          disabled={disabled}
          rightSlot={
            <GpsButton
              onPress={() => {
                // 기본 출발지는 아직 앱 더미라 노드 id가 없다(서버 경로 대신 더미 경로가 나온다).
                setDeparture(
                  `${DUMMY_DEFAULT_DEPARTURE.buildingCode} ${DUMMY_DEFAULT_DEPARTURE.buildingName} ${DUMMY_DEFAULT_DEPARTURE.roomNumber}`,
                );
                setDepartureNodeId(undefined);
              }}
              hitSlop={8}
            >
              <GpsIcon width={24} height={24} />
            </GpsButton>
          }
        />
        <RouteInputField
          icon={DestinationMarkerIcon}
          value={destination}
          placeholder="도착지를 입력하세요"
          onPress={() =>
            navigation.navigate('RouteLocationSearch', {
              target: 'destination',
              departureLabel: departure,
              destinationLabel: destination,
              departureNodeId,
              destinationNodeId,
            })
          }
          onClear={() => {
            setDestination('');
            setDestinationNodeId(undefined);
          }}
          disabled={disabled}
        />
      </InputColumn>
    </InputSection>
  );

  if (selectedRoute) {
    return (
      <DetailContainer>
        <MapArea>
          {isSheetCollapsed ? (
            <CollapsedTopPanel
              key="collapsed"
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(120)}
              style={{ paddingTop: insets.top }}
              onLayout={event => setCollapsedTopPanelHeight(event.nativeEvent.layout.height)}
            >
              <Header title="길찾기" onBackPress={() => setSelectedRouteId(null)} />
              {renderRouteInputSection(true)}
            </CollapsedTopPanel>
          ) : (
            <RouteViewHeaderWrapper
              key="expanded"
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(120)}
              style={{ paddingTop: insets.top }}
            >
              <Header title="길찾기" transparent onBackPress={() => setSelectedRouteId(null)} />
            </RouteViewHeaderWrapper>
          )}
          <NaverMapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialCamera={routeMap.camera}
            // 지도는 화면 전체에 깔리고 위(헤더/입력 패널)·아래(카드)가 그 위에 얹혀서 가린다.
            // 카메라 중심이 지도 뷰 "전체" 기준으로 잡히면 출발/도착 지점이 가려진 쪽으로
            // 치우쳐 보이니, 실제로 가린 높이만큼 mapPadding을 줘서 "위 패널 밑~카드 위"
            // 사이 보이는 영역 기준으로 중앙 정렬되게 한다. 카드를 접고 펼 때마다 같이 바뀐다.
            mapPadding={{
              top: isSheetCollapsed ? collapsedTopPanelHeight : insets.top + ROUTE_VIEW_HEADER_HEIGHT,
              left: 0,
              right: 0,
              bottom: isSheetCollapsed ? DETAIL_SHEET_PEEK_HEIGHT + insets.bottom : detailSheetHeight,
            }}
            minZoom={MAP_MIN_ZOOM}
            maxZoom={MAP_MAX_ZOOM}
            // 카드를 펼친 경로 보기는 경로 전체가 보이는 줌으로 고정 — 핀치/더블탭 줌을 막고, 카드를 끌어내려
            // 지도를 전체로 펼쳤을 때만 확대/축소를 풀어준다.
            isZoomGesturesEnabled={isSheetCollapsed}
            // 카드를 올릴 때 animateCameraTo로 되돌리는데, 회전/기울기는 되돌릴 방법이 없어서
            // 경로 보기에선 아예 막아 둔다(확대/축소·이동만 허용).
            isRotateGesturesEnabled={false}
            isTiltGesturesEnabled={false}
          >
            <NaverMapPolylineOverlay
              // L자 경로선 좌표(꺾이는 지점 포함) — 길 안내 화면과 같이 쓴다.
              coords={routeMap.path}
              width={6}
              color={theme.blue[500]}
              // capType/joinType 둘 다 "Round"가 목표값인데, 선언된 기본값도 Round라
              // 바로 넘기면 네이티브 diff가 "변경 없음"으로 보고 무시한다(위 routeLineCapReady
              // 참고). 그래서 처음엔 기본값과 다른 값(Butt/Miter)으로 그렸다가, 다음 틱에
              // 진짜 Round로 바꿔서 강제로 반영시킨다.
              capType={routeLineCapReady ? 'Round' : 'Butt'}
              joinType={routeLineCapReady ? 'Round' : 'Miter'}
              zIndex={0}
            />
            <NaverMapStartPointMarker
              latitude={routeMap.start.latitude}
              longitude={routeMap.start.longitude}
              label={routeMap.start.label}
            />
            <NaverMapMarker
              latitude={routeMap.end.latitude}
              longitude={routeMap.end.longitude}
              label={routeMap.end.label}
              zIndex={1}
              scale={1}
            />
          </NaverMapView>
        </MapArea>

        <DetailSheet
          peekHeight={DETAIL_SHEET_PEEK_HEIGHT + insets.bottom}
          onCollapsedChange={setIsSheetCollapsed}
          onHeightChange={setDetailSheetHeight}
          scrollOffset={detailScrollOffset}
          header={<Grabber />}
        >
          <DetailSheetBody>
            <DetailScrollWrapper>
              <DetailScroll
                showsVerticalScrollIndicator={false}
                // 맨 위에서 아래로 끌면 카드가 접혀야 하므로, 그때 스크롤이 같이 튕기지 않게 막는다.
                bounces={false}
                scrollEventThrottle={16}
                onScroll={event => {
                  detailScrollOffset.value = event.nativeEvent.contentOffset.y;
                }}
              >
                <DetailTopRow>
                  <DurationBlock>
                    <DurationRow>
                      <DurationText>{selectedRoute.durationMinutes}</DurationText>
                      <DurationUnitText>분</DurationUnitText>
                    </DurationRow>
                    <SummaryText>{selectedRoute.distanceMeters}m · 걷기</SummaryText>
                  </DurationBlock>
                  <IndoorRow>
                    <IndoorIcon width={20} height={20} color={theme.semantic.icon.secondary} />
                    <IndoorText>
                      실내 <IndoorValueText>{selectedRoute.indoorPercent}%</IndoorValueText>
                    </IndoorText>
                  </IndoorRow>
                </DetailTopRow>

                {selectedRoute.steps.map((step, index) => (
                  <RouteStepRow
                    key={step.id}
                    step={step}
                    showDivider={index !== selectedRoute.steps.length - 1}
                  />
                ))}
              </DetailScroll>
            </DetailScrollWrapper>

            <CtaWrapper bottomInset={insets.bottom}>
              <Button
                label="경로 안내 시작"
                icon={NavigationStartIcon}
                onPress={() =>
                  navigation.navigate('RouteGuidance', {
                    routeId: selectedRoute.id,
                    destinationLabel: destination,
                    fromNodeId: departureNodeId,
                    toNodeId: destinationNodeId,
                  })
                }
              />
            </CtaWrapper>
          </DetailSheetBody>
        </DetailSheet>
      </DetailContainer>
    );
  }

  return (
    <Container>
      <HeaderWrapper style={{ paddingTop: insets.top }}>
        <Header title="길찾기" onBackPress={() => navigation.goBack()} />
      </HeaderWrapper>

      {renderRouteInputSection(false)}

      <OptionRow showDivider={hasRoute}>
        {ROUTE_OPTIONS.map(({ key, label, icon }) => (
          <RouteOptionChip
            key={key}
            label={label}
            icon={icon}
            active={selectedOption === key}
            onPress={() => toggleOption(key)}
          />
        ))}
      </OptionRow>

      {hasRoute && routeStatusText ? (
        <EmptyState>
          <EmptyText>{routeStatusText}</EmptyText>
        </EmptyState>
      ) : hasRoute ? (
        <ResultsArea>
          <ScrollView
            contentContainerStyle={{ paddingBottom: hasElevatorWarning ? insets.bottom + 76 : insets.bottom + 16 }}
            showsVerticalScrollIndicator={false}
          >
            {routeResults.map((result, index) => (
              <RouteResultCard
                key={result.id}
                result={result}
                optionLabel={ROUTE_OPTIONS.find(option => option.key === result.option)?.label ?? ''}
                showDivider={index !== routeResults.length - 1}
                onPress={() => setSelectedRouteId(result.id)}
              />
            ))}
          </ScrollView>
          {hasElevatorWarning && (
            <ToastWrapper bottomInset={insets.bottom}>
              <Toast text={DUMMY_ELEVATOR_WARNING_MESSAGE} variant="warning" />
            </ToastWrapper>
          )}
        </ResultsArea>
      ) : (
        <EmptyState>
          {/* blueLogoSymbol 원본 비율(117.27x152.443)이 정사각형이 아니라, width/height를 같은
              값으로 주면 옆으로 눌려 보인다. 세로 120px 기준으로 원본 비율을 유지한 가로값을 쓴다. */}
          <BlueLogoSymbol width={92} height={120} style={{ opacity: 0.35 }} />
          <EmptyText>
            도착지를 설정하면{'\n'}경로를 안내해 드릴게요
          </EmptyText>
        </EmptyState>
      )}
    </Container>
  );
}

const HeaderWrapper = styled.View`
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

const DetailContainer = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;

const MapArea = styled.View`
  flex: 1;
`;

// bottom-tabs 내비게이터의 header는 항상 레이아웃 공간을 차지해서, 배경만 투명하게 해선
// 지도가 비치지 않는다(그래서 그 헤더는 이 상태일 땐 아예 끈다 — MainTabNavigator 참고).
// 대신 여기서 지도 위에 절대위치로 직접 얹어서, 공통 Header 컴포넌트를 투명 배경으로
// 띄운다(Figma "길 찾기_경로 보기" 733:2584/733:3264).
const RouteViewHeaderWrapper = styled(Animated.View)`
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  z-index: 1;
`;

// 카드를 끌어내렸을 때 지도 위에 얹는 상단 패널(Figma "길 찾기_전체 경로" 762:4620) —
// 불투명 헤더 + 출발/도착 입력. 입력 영역(InputSection)이 자체 아래쪽 그림자를 갖고 있다.
const CollapsedTopPanel = styled(Animated.View)`
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  z-index: 1;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

// Figma "path info"(762:5945). 그래버 + (요약/구간 목록 스크롤 영역) + CTA로 구성된 바텀시트.
// 지도 위에 절대위치로 얹혀서, 끌어내리면 그래버만 남기고 접힌다(CollapsibleBottomSheet).
const DetailSheet = styled(CollapsibleBottomSheet)`
  position: absolute;
  left: 0px;
  right: 0px;
  bottom: 0px;
  width: 100%;
  max-height: 60%;
  align-items: center;
  gap: 16px;
  padding-top: 8px;
  background-color: ${({ theme }) => theme.semantic.background.primary};
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  /* Figma box-shadow: 0px -4px 10px 0px rgba(0,0,0,0.05) */
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.05;
  shadow-radius: 10px;
  elevation: 8;
`;

const Grabber = styled.View`
  width: 36px;
  height: 4px;
  border-radius: 100px;
  background-color: ${({ theme }) => theme.semantic.line.primary};
`;

const DetailSheetBody = styled.View`
  width: 100%;
  gap: 16px;
`;

const DetailScrollWrapper = styled.View`
  width: 100%;
  max-height: 268px;
`;

const DetailScroll = styled.ScrollView.attrs({ contentContainerStyle: { paddingHorizontal: 20, gap: 16 } })`
  width: 100%;
`;

const DetailTopRow = styled.View`
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
`;

const DurationBlock = styled.View`
  align-items: flex-start;
`;

const DurationRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const DurationText = styled.Text`
  font-family: ${({ theme }) => theme.typography.title.bold.fontFamily};
  font-size: ${({ theme }) => theme.typography.title.bold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.title.bold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.title.bold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const DurationUnitText = styled.Text`
  font-family: ${({ theme }) => theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.medium.fontSize}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const SummaryText = styled.Text`
  font-family: ${({ theme }) => theme.typography.caption.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.caption.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.caption.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.caption.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const IndoorRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const IndoorText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const IndoorValueText = styled.Text`
  color: ${({ theme }) => theme.blue[700]};
`;

const CtaWrapper = styled.View<{ bottomInset: number }>`
  width: 100%;
  padding-horizontal: 20px;
  padding-bottom: ${({ bottomInset }) => bottomInset + 8}px;
`;

const InputSection = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 20px;
  background-color: ${({ theme }) => theme.semantic.background.primary};
  /* Figma box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.05) */
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.05;
  shadow-radius: 10px;
  elevation: 3;
`;

const SwapButton = styled(Pressable)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

const InputColumn = styled.View`
  flex: 1;
  gap: 4px;
`;

const GpsButton = styled(Pressable)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

const OptionRow = styled.View<{ showDivider: boolean }>`
  flex-direction: row;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 20px;
  border-bottom-width: ${({ showDivider }) => (showDivider ? '1px' : '0px')};
  border-bottom-color: ${({ theme }) => theme.semantic.line.tertiary};
`;

const ResultsArea = styled.View`
  flex: 1;
`;

const ToastWrapper = styled.View<{ bottomInset: number }>`
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: ${({ bottomInset }) => bottomInset + 16}px;
`;

const EmptyState = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 16px;
  /* justify-content: center가 위아래를 똑같이 나누는데, 그 정중앙보다 8px 위로 올려달라는
     요청이라 아래쪽 패딩만 16px 더 줘서(위아래 차이의 절반=8px) 시각적으로 위로 밀어낸다. */
  padding-bottom: 50px;
`;

const EmptyText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
  text-align: center;
`;
