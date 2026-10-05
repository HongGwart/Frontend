import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  NaverMapView,
  NaverMapCircleOverlay,
  NaverMapPolylineOverlay,
  NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import WalkIcon from '@assets/svgs/icons/walk.svg';
import ElevatorIcon from '@assets/svgs/icons/elevator.svg';
import StairsIcon from '@assets/svgs/icons/stairs.svg';
import EntranceIcon from '@assets/svgs/icons/entrance.svg';
import DestinationMarkerIcon from '@assets/svgs/icons/destinationMarker.svg';
import { MoveInfoCard } from '@components/navigation/MoveInfoCard';
import { GuidanceStepButtons } from '@components/navigation/GuidanceStepButtons';
import { Button } from '@components/common/Button';
import { NaverMapMarker } from '@components/map/NaverMapMarker';
import { NaverMapStartPointMarker } from '@components/map/NaverMapStartPointMarker';
import { NaverMapUserPointMarker } from '@components/map/NaverMapUserPointMarker';
import {
  DUMMY_ROUTE_RESULTS,
  GuidanceMoveType,
} from '@constant/dummyRouteResults';
import { MAP_MIN_ZOOM, MAP_MAX_ZOOM } from '@constant/mapCamera';
import { RootStackParamList } from '@navigation/types';
import { regionToFit, slicePath, splitPathAt } from '@utils/routePath';
import { buildTestRoute, getRouteMapData, RouteMapData } from '@constant/testIndoorRoute';
import { FLOOR_GEO_ANCHORS } from '@constant/floorGeoAnchors';
import { FloorPlanOverlay } from '@components/map/FloorPlanOverlay';
import { animateValue } from '@utils/animateValue';

const MOVE_TYPE_ICONS: Record<GuidanceMoveType, React.FC<SvgProps>> = {
  walk: WalkIcon,
  elevator: ElevatorIcon,
  stairs: StairsIcon,
  entrance: EntranceIcon,
};

// 길찾기 경로 보기 화면과 같은 줌으로 시작한다.
const GUIDANCE_ZOOM = 17;
// 건물 안 구간은 평면도가 보이도록 더 당겨서 시작한다(첫 화면용 — 지도가 준비되면 지금 구간 경로에 맞춘다).
const INDOOR_GUIDANCE_ZOOM = 19;
// 지금 구간 경로에 카메라를 맞출 때, 구간이 아주 짧아도 이보다는 좁게 잡지 않는다(위도 도 단위).
// 실내는 약 20m, 실외는 약 60m.
const INDOOR_MIN_FIT_SPAN = 0.00018;
const OUTDOOR_MIN_FIT_SPAN = 0.00055;
// 오른쪽 아래 이전/다음 버튼(하단 40px + 버튼 높이)이 가리는 높이. 경로가 그 밑으로 들어가지 않게 지도 패딩으로 뺀다.
const STEP_BUTTONS_AREA_HEIGHT = 110;
// 구간을 넘길 때 경로선/현재 위치가 옮겨가는 시간. 카메라 이동(animateCameraTo)과 같게 맞춘다.
const STEP_TRANSITION_MS = 300;

// 안내 카드 스와이프: 이 거리(px)나 속도(px/s)를 넘기면 구간을 넘긴다.
const SWIPE_DISTANCE = 72;
const SWIPE_VELOCITY = 600;
// 더 갈 곳이 없는 방향(첫 구간에서 오른쪽)으로 밀면 손가락 이동의 이 비율만큼만 따라온다.
const RUBBER_BAND = 0.25;
// 카드가 빠져나가고/들어오는 거리(화면 폭 대비)와 시간.
const CARD_SLIDE_RATIO = 0.35;
const CARD_OUT_MS = 160;
const CARD_IN_MS = 240;

// 도착 파동: 도착 핀 좌표에서 반지름 0 → RIPPLE_MAX_RADIUS_M 으로 퍼지면서 옅어지는 원 두 개.
const RIPPLE_MAX_RADIUS_M = 22;
const RIPPLE_MAX_ALPHA = 0.28;
const RIPPLE_DURATION_MS = 1000;
const RIPPLE_INTERVAL_MS = 450;

interface RippleFrame {
  radius: number;
  alpha: number;
}
const HIDDEN_RIPPLE: RippleFrame = { radius: 0, alpha: 0 };
// 진행도 t(0~1, 이미 ease-out 적용)에 따라 커지면서 사라진다.
const toRippleFrame = (t: number): RippleFrame => ({
  radius: RIPPLE_MAX_RADIUS_M * t,
  alpha: RIPPLE_MAX_ALPHA * (1 - t),
});

/**
 * 길 안내 지도 위 오버레이(경로선, 출발/도착 핀, 도착 파동, 현재 위치 마커). 경로선·파동·마커
 * alpha는 네이버 지도 네이티브 prop이라 Reanimated로 못 움직이고 JS state로 매 프레임 바꿔야
 * 하는데, 그 state를 화면에 두면 카드·버튼까지 초당 60번 다시 렌더된다 — 그래서 여기로 떼어낸다.
 * 오버레이 순서(같은 zIndex끼리는 나중 것이 위)는 원래 화면에 있던 그대로다.
 */
function GuidanceMapOverlays({
  routeMap,
  targetProgress,
  hasArrived,
  currentFloorId,
}: {
  routeMap: RouteMapData;
  targetProgress: number;
  hasArrived: boolean;
  /** 지금 있는 층. 있으면 경로선/출발·도착 핀을 그 층 구간 것만 그린다 */
  currentFloorId?: string;
}) {
  const theme = useTheme();

  // 구간을 넘기면 경로선을 한 번에 바꾸지 않고, 화면에 그리는 진행 비율(displayProgress)을
  // 새 구간 값까지 매 프레임 조금씩 옮겨서 파란 남은 경로가 줄어드는(이전으로 가면 늘어나는)
  // 애니메이션을 만든다. 카메라 기본 easing(EaseOut)과 맞춰 ease-out cubic으로 움직인다.
  const [displayProgress, setDisplayProgress] = useState(targetProgress);
  const displayProgressRef = useRef(targetProgress);
  useEffect(() => {
    if (displayProgressRef.current === targetProgress) return;
    // 애니메이션 도중 또 넘기면(cleanup으로 이전 것이 멈추고), 지금 그려진 위치에서 새 목표로 이어서 움직인다.
    return animateValue({
      from: displayProgressRef.current,
      to: targetProgress,
      durationMs: STEP_TRANSITION_MS,
      onUpdate: value => {
        displayProgressRef.current = value;
        setDisplayProgress(value);
      },
    });
  }, [targetProgress]);

  // 도착하면 현재 위치 마커가 도착 핀과 겹쳐 보이지 않게, 핀까지 이동한 뒤 서서히 사라지게 하고
  // 대신 핀 아래에서 파란 파동이 두 번 퍼져 "여기 도착했다"를 보여준다.
  const [userMarkerAlpha, setUserMarkerAlpha] = useState(1);
  const [ripples, setRipples] = useState<RippleFrame[]>([HIDDEN_RIPPLE, HIDDEN_RIPPLE]);
  useEffect(() => {
    if (!hasArrived) return;
    const stops = [
      animateValue({
        from: 1,
        to: 0,
        delayMs: STEP_TRANSITION_MS,
        durationMs: 250,
        onUpdate: setUserMarkerAlpha,
      }),
      ...[0, 1].map(index =>
        animateValue({
          from: 0,
          to: 1,
          delayMs: STEP_TRANSITION_MS + 150 + index * RIPPLE_INTERVAL_MS,
          durationMs: RIPPLE_DURATION_MS,
          onUpdate: t =>
            setRipples(prev => prev.map((ripple, i) => (i === index ? toRippleFrame(t) : ripple))),
          onEnd: () => setRipples(prev => prev.map((ripple, i) => (i === index ? HIDDEN_RIPPLE : ripple))),
        }),
      ),
    ];
    return () => stops.forEach(stop => stop());
  }, [hasArrived]);

  // 건물 안에 있으면 그 층 구간(from~to)만 그린다 — C동 1층에서 8층 경로가 겹쳐 보이지 않게. 바깥이면 전체.
  const visibleRange = useMemo(() => {
    if (!currentFloorId) return { from: 0, to: 1 };
    const segments = routeMap.floorSegments.filter(segment => segment.floorId === currentFloorId);
    const segment =
      segments.find(({ from, to }) => targetProgress >= from && targetProgress <= to) ?? segments[0];
    return segment ?? { from: 0, to: 1 };
  }, [currentFloorId, routeMap.floorSegments, targetProgress]);

  const { position, traveled, remaining } = useMemo(() => {
    const split = splitPathAt(routeMap.path, displayProgress);
    if (visibleRange.from === 0 && visibleRange.to === 1) return split;
    const clamped = Math.min(visibleRange.to, Math.max(visibleRange.from, displayProgress));
    return {
      position: split.position,
      traveled: slicePath(routeMap.path, visibleRange.from, clamped),
      remaining: slicePath(routeMap.path, clamped, visibleRange.to),
    };
  }, [routeMap.path, displayProgress, visibleRange]);
  // 출발지/도착지 핀도 그 지점이 지금 보이는 구간에 있을 때만 (출발 = 경로 맨 앞, 도착 = 맨 끝)
  const showStart = visibleRange.from === 0;
  const showEnd = visibleRange.to === 1;
  // 폴리라인은 점 2개 미만이면 못 그려서, 비었을 땐 현재 위치 두 점으로 채우고 숨긴다(오버레이는 계속 마운트 —
  // 아래 lineCapReady 우회가 마운트 직후 한 번만 먹기 때문).
  const lineCoords = (coords: typeof traveled) => (coords.length >= 2 ? coords : [position, position]);

  // NavigationScreen의 routeLineCapReady와 같은 우회: 선언된 기본값(Round)을 처음부터 넘기면
  // 네이티브가 변경으로 보지 않아 반영이 안 되니, Butt/Miter로 그렸다가 다음 틱에 Round로 바꾼다.
  const [lineCapReady, setLineCapReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLineCapReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <NaverMapPolylineOverlay
        coords={lineCoords(traveled)}
        isHidden={traveled.length < 2}
        width={6}
        color={theme.semantic.line.primary}
        capType={lineCapReady ? 'Round' : 'Butt'}
        joinType={lineCapReady ? 'Round' : 'Miter'}
        zIndex={0}
      />
      <NaverMapPolylineOverlay
        coords={lineCoords(remaining)}
        width={6}
        color={theme.blue[500]}
        // 끝까지 가면 남은 구간이 길이 0(같은 점 두 개)이 되니 숨긴다.
        isHidden={displayProgress >= visibleRange.to || remaining.length < 2}
        capType={lineCapReady ? 'Round' : 'Butt'}
        joinType={lineCapReady ? 'Round' : 'Miter'}
        zIndex={0}
      />
      {showStart && (
        <NaverMapStartPointMarker
          latitude={routeMap.start.latitude}
          longitude={routeMap.start.longitude}
          label={routeMap.start.label}
          // 이미 떠난 출발지라 Figma처럼 회색 비활성 톤으로 그린다.
          active={false}
        />
      )}
      {showEnd && (
        <NaverMapMarker
          latitude={routeMap.end.latitude}
          longitude={routeMap.end.longitude}
          label={routeMap.end.label}
          zIndex={1}
          scale={1}
        />
      )}
      {ripples.map((ripple, index) => (
        <NaverMapCircleOverlay
          key={index}
          latitude={routeMap.end.latitude}
          longitude={routeMap.end.longitude}
          radius={ripple.radius}
          // theme.blue[500](#343B9D)에 파동 진행에 따른 투명도만 입힌다.
          color={`rgba(52, 59, 157, ${ripple.alpha})`}
          isHidden={ripple.alpha <= 0}
          // 경로선 위, 도착 핀(zIndex 1) 아래에 깔린다.
          zIndex={0}
        />
      ))}
      <NaverMapUserPointMarker latitude={position.latitude} longitude={position.longitude} alpha={userMarkerAlpha} />
    </>
  );
}

/**
 * 길찾기 "경로 안내 시작"을 누르면 뜨는 길 안내 화면. Figma "길 안내_걷기"(784:4466).
 * 지도 전체 위에 상단 "move info" 카드(지금 구간 안내)와 우하단 이전/다음 버튼을 얹는다.
 * 지나온 구간은 회색, 남은 구간은 파란색 경로선으로 나누고, 그 경계에 현재 위치 마커를
 * 찍은 뒤 카메라를 현재 위치에 맞춘다. 아직 실제 위치 추적이 없어서 구간은 버튼으로 넘긴다.
 */
export default function RouteGuidanceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'RouteGuidance'>>();
  // 실내 길찾기 테스트 경로면 찍어둔 노드로 만든 경로/구간 안내를, 아니면 기존 더미를 쓴다.
  const [{ route, routeMap }] = useState(() => {
    const testRoute = buildTestRoute();
    const routes = testRoute ? [testRoute.result, ...DUMMY_ROUTE_RESULTS] : DUMMY_ROUTE_RESULTS;
    return {
      route: routes.find(result => result.id === params.routeId) ?? DUMMY_ROUTE_RESULTS[0],
      routeMap: getRouteMapData(params.routeId),
    };
  });
  const guidanceSteps = routeMap.guidance;
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [stepIndex, setStepIndex] = useState(0);
  const step = guidanceSteps[stepIndex];
  // 마지막 구간에서 "다음"을 누르면 도착한 것으로 본다. 별도 화면을 띄우지 않고 지도 위에서
  // 남은 경로를 끝까지 줄이고, 상단 카드를 도착 안내로 바꾸고, 하단에 "안내 종료" 버튼을 띄운다.
  const [hasArrived, setHasArrived] = useState(false);

  // 안내 카드(move info)를 좌우로 밀어 구간을 넘긴다. 카드 틀은 고정이고 안쪽 내용만 손가락을
  // 따라오다가, 충분히 밀거나 빠르게 튕기면 그 방향으로 빠져나가며 흐려지고, 새 구간 내용이 반대편에서 들어온다. 이전/다음
  // 버튼도 같은 애니메이션을 탄다. 첫 구간에서 오른쪽으로 밀면 고무줄처럼 버티기만 하고, 마지막
  // 구간에서 왼쪽으로 밀면 다음 버튼처럼 도착으로 넘어간다.
  const { width: screenWidth } = useWindowDimensions();
  const cardX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const enterFromRef = useRef<1 | -1 | 0>(0);
  const slideOffset = screenWidth * CARD_SLIDE_RATIO;
  const canGoPrev = stepIndex > 0;

  // 지금 구간을 렌더 결과(stepIndex)가 아니라 여기서 바로 읽는다. 커밋 직후 리렌더 전에 버튼/스와이프가
  // 또 들어오면 옛 클로저의 isLastStep(false)으로 한 칸 더 넘겨 범위를 벗어나(step이 undefined) 크래시가
  // 났다. stepIndex는 commitStep에서만 바뀌므로 이 ref가 항상 최신이다.
  const stepIndexRef = useRef(0);

  // dir: 1 = 다음 구간, -1 = 이전 구간. 카드가 빠져나간 뒤 JS에서 실제로 구간을 바꾼다.
  const commitStep = useCallback(
    (dir: 1 | -1) => {
      const lastIndex = guidanceSteps.length - 1;
      if (dir === 1 && stepIndexRef.current === lastIndex) {
        // 도착 카드는 기존처럼 제자리 페이드로 뜨니 위치/투명도만 원래대로 돌려둔다.
        cardX.value = 0;
        cardOpacity.value = 1;
        setHasArrived(true);
        return;
      }
      const nextIndex = Math.min(lastIndex, Math.max(0, stepIndexRef.current + dir));
      if (nextIndex === stepIndexRef.current) {
        // 첫 구간에서 이전으로 가려던 경우 — 빠져나간 카드만 제자리로 되돌린다.
        cardX.value = withTiming(0, { duration: CARD_IN_MS, easing: Easing.out(Easing.cubic) });
        cardOpacity.value = withTiming(1, { duration: CARD_IN_MS });
        return;
      }
      stepIndexRef.current = nextIndex;
      enterFromRef.current = dir;
      setStepIndex(nextIndex);
    },
    [cardX, cardOpacity],
  );

  const slideOut = useCallback(
    (dir: 1 | -1) => {
      'worklet';
      cardX.value = withTiming(-dir * slideOffset, { duration: CARD_OUT_MS, easing: Easing.in(Easing.quad) });
      cardOpacity.value = withTiming(0, { duration: CARD_OUT_MS }, finished => {
        if (finished) scheduleOnRN(commitStep, dir);
      });
    },
    [cardX, cardOpacity, slideOffset, commitStep],
  );

  // 구간이 바뀌면 새 카드를 반대편에서 들여보낸다(다음 구간이면 오른쪽에서, 이전이면 왼쪽에서).
  useEffect(() => {
    const dir = enterFromRef.current;
    if (!dir) return;
    enterFromRef.current = 0;
    cardX.value = dir * slideOffset;
    cardX.value = withTiming(0, { duration: CARD_IN_MS, easing: Easing.out(Easing.cubic) });
    cardOpacity.value = withTiming(1, { duration: CARD_IN_MS });
  }, [stepIndex, cardX, cardOpacity, slideOffset]);

  const cardSwipe = useMemo(
    () =>
      Gesture.Pan()
        // 가로로 확실히 민 경우만 스와이프로 보고, 세로 움직임이 먼저 크면 포기한다(카드 X 버튼 탭은 그대로).
        .activeOffsetX([-12, 12])
        .failOffsetY([-12, 12])
        .onUpdate(event => {
          const x = event.translationX;
          cardX.value = x > 0 && !canGoPrev ? x * RUBBER_BAND : x;
          cardOpacity.value = 1 - Math.min(Math.abs(cardX.value) / screenWidth, 1) * 0.5;
        })
        .onEnd(event => {
          const x = event.translationX;
          const wantsNext = x < -SWIPE_DISTANCE || event.velocityX < -SWIPE_VELOCITY;
          const wantsPrev = canGoPrev && (x > SWIPE_DISTANCE || event.velocityX > SWIPE_VELOCITY);
          if (wantsNext) slideOut(1);
          else if (wantsPrev) slideOut(-1);
          else {
            cardX.value = withSpring(0, { damping: 20, stiffness: 260 });
            cardOpacity.value = withTiming(1, { duration: 150 });
          }
        }),
    [canGoPrev, screenWidth, cardX, cardOpacity, slideOut],
  );
  const cardSwipeStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateX: cardX.value }],
  }));
  // 지금 경로선/현재 위치/카메라가 향해야 할 진행 비율 — 도착하면 경로 끝(1).
  const targetProgress = hasArrived ? 1 : step.progress;
  // 지금 있는 층 — 건물 안 구간이면 그 층 평면도를 지도에 깔고, 바깥 구간이면 아무것도 안 깐다.
  // 도착하면 마지막 구간의 층(도착지가 있는 층)을 그대로 보여준다.
  const currentFloorId = hasArrived ? guidanceSteps[guidanceSteps.length - 1].floorId : step.floorId;
  useEffect(() => {
    if (hasArrived) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [hasArrived]);

  const mapRef = useRef<NaverMapViewRef>(null);
  // initialCamera는 처음 한 번만 쓰이니 첫 구간 위치로 고정해 둔다(지도가 준비되기 전 첫 화면용).
  const [initialCamera] = useState(() => ({
    ...splitPathAt(routeMap.path, guidanceSteps[0].progress).position,
    zoom: guidanceSteps[0].floorId ? INDOOR_GUIDANCE_ZOOM : GUIDANCE_ZOOM,
  }));

  // 지금 구간(현재 위치 ~ 다음 안내 지점)의 경로 전체가 "상단 안내 카드 밑 ~ 하단 버튼 위" 사이에 꽉 차게
  // 확대한다. 구간을 넘기면 경로선 애니메이션과 같은 시간으로 다음 구간에 맞춰 옮겨간다.
  const activeStepIndex = hasArrived ? guidanceSteps.length - 1 : stepIndex;
  const segmentFrom = guidanceSteps[activeStepIndex].progress;
  const segmentTo = guidanceSteps[activeStepIndex + 1]?.progress ?? 1;
  const fitRegion = useMemo(
    () =>
      regionToFit(
        slicePath(routeMap.path, segmentFrom, segmentTo),
        currentFloorId ? INDOOR_MIN_FIT_SPAN : OUTDOOR_MIN_FIT_SPAN,
      ),
    [routeMap.path, segmentFrom, segmentTo, currentFloorId],
  );
  const [cardHeight, setCardHeight] = useState(0);
  const [isMapReady, setIsMapReady] = useState(false);
  const hasFittedRef = useRef(false);
  useEffect(() => {
    // 지도가 준비되고 상단 카드 높이(지도 패딩)를 잰 뒤에 맞춘다. 첫 번째는 애니메이션 없이 바로.
    if (!isMapReady || cardHeight === 0 || !fitRegion) return;
    mapRef.current?.animateRegionTo({ ...fitRegion, duration: hasFittedRef.current ? STEP_TRANSITION_MS : 0 });
    hasFittedRef.current = true;
  }, [isMapReady, cardHeight, fitRegion]);

  // 길찾기를 마쳤으니 경로 보기로 돌아가지 않고 지도 탭으로 나간다.
  const endGuidance = () => navigation.popTo('MainTabs', { screen: 'map' });

  return (
    <Container>
      <NaverMapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialCamera={initialCamera}
        onInitialized={() => setIsMapReady(true)}
        // 상단 안내 카드와 하단 버튼에 가려진 만큼 빼서, 경로가 보이는 영역 가운데에 맞춰지게 한다.
        mapPadding={{
          top: insets.top + 8 + cardHeight,
          left: 0,
          right: 0,
          bottom: insets.bottom + STEP_BUTTONS_AREA_HEIGHT,
        }}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        isRotateGesturesEnabled={false}
        isTiltGesturesEnabled={false}
      >
        {currentFloorId && (
          <FloorPlanOverlay
            key={currentFloorId}
            floorId={currentFloorId}
            anchors={FLOOR_GEO_ANCHORS[currentFloorId]}
          />
        )}
        <GuidanceMapOverlays
          routeMap={routeMap}
          targetProgress={targetProgress}
          hasArrived={hasArrived}
          currentFloorId={currentFloorId}
        />
      </NaverMapView>

      {/* 도착하면 key가 바뀌면서 카드가 도착 안내로 페이드 전환된다. */}
      <CardWrapper
        key={hasArrived ? 'arrived' : 'guiding'}
        entering={FadeIn.duration(250)}
        style={{ top: insets.top + 8 }}
        onLayout={event => setCardHeight(event.nativeEvent.layout.height)}
      >
        {hasArrived ? (
          <MoveInfoCard
            icon={DestinationMarkerIcon}
            title={`${params.destinationLabel}에\n도착했어요`}
            // 아직 실측이 없어서 고른 경로의 예상 소요 시간/거리를 보여준다.
            durationText={`총 ${route.durationMinutes}분 · ${route.distanceMeters}m`}
            onClose={endGuidance}
            stepCount={1}
            activeStepIndex={0}
          />
        ) : (
          // 카드 어디를 밀어도 인식하되, 움직이는 건 카드 안 내용(contentStyle)뿐이다.
          <GestureDetector gesture={cardSwipe}>
            <Animated.View>
              <MoveInfoCard
                icon={MOVE_TYPE_ICONS[step.moveType]}
                title={step.title}
                durationText={step.durationText}
                onClose={() => navigation.goBack()}
                stepCount={guidanceSteps.length}
                activeStepIndex={stepIndex}
                contentStyle={cardSwipeStyle}
              />
            </Animated.View>
          </GestureDetector>
        )}
      </CardWrapper>

      {hasArrived ? (
        <EndButtonWrapper entering={FadeInDown.duration(300)} style={{ paddingBottom: insets.bottom + 8 }}>
          <Button label="안내 종료" onPress={endGuidance} />
        </EndButtonWrapper>
      ) : (
        <StepButtonsWrapper>
          <GuidanceStepButtons
            onPrev={() => canGoPrev && slideOut(-1)}
            onNext={() => slideOut(1)}
            prevDisabled={stepIndex === 0}
          />
        </StepButtonsWrapper>
      )}
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;

// Figma: 상태바(48) 아래 8px, 좌우 20px 여백으로 지도 위에 뜬다.
const CardWrapper = styled(Animated.View)`
  position: absolute;
  left: 20px;
  right: 20px;
`;

// Figma: 화면 하단에서 40px, 오른쪽 20px.
const StepButtonsWrapper = styled.View`
  position: absolute;
  right: 20px;
  bottom: 40px;
`;

// 도착 후 하단 "안내 종료" CTA — 경로 보기 화면의 "경로 안내 시작" 버튼과 같은 여백.
const EndButtonWrapper = styled(Animated.View)`
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 0px;
`;
