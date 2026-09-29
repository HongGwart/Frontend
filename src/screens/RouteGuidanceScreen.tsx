import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  NaverMapView,
  NaverMapCircleOverlay,
  NaverMapPolylineOverlay,
  NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
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
  DUMMY_GUIDANCE_STEPS,
  DUMMY_ROUTE_MAP,
  DUMMY_ROUTE_RESULTS,
  DUMMY_ROUTE_PATH,
  GuidanceMoveType,
} from '@constant/dummyRouteResults';
import { MAP_MIN_ZOOM, MAP_MAX_ZOOM } from '@constant/mapCamera';
import { RootStackParamList } from '@navigation/types';
import { splitPathAt } from '@utils/routePath';
import { animateValue } from '@utils/animateValue';

const MOVE_TYPE_ICONS: Record<GuidanceMoveType, React.FC<SvgProps>> = {
  walk: WalkIcon,
  elevator: ElevatorIcon,
  stairs: StairsIcon,
  entrance: EntranceIcon,
};

// 길찾기 경로 보기 화면과 같은 줌으로 시작한다.
const GUIDANCE_ZOOM = 17;
// 구간을 넘길 때 경로선/현재 위치가 옮겨가는 시간. 카메라 이동(animateCameraTo)과 같게 맞춘다.
const STEP_TRANSITION_MS = 300;

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
 * 길찾기 "경로 안내 시작"을 누르면 뜨는 길 안내 화면. Figma "길 안내_걷기"(784:4466).
 * 지도 전체 위에 상단 "move info" 카드(지금 구간 안내)와 우하단 이전/다음 버튼을 얹는다.
 * 지나온 구간은 회색, 남은 구간은 파란색 경로선으로 나누고, 그 경계에 현재 위치 마커를
 * 찍은 뒤 카메라를 현재 위치에 맞춘다. 아직 실제 위치 추적이 없어서 구간은 버튼으로 넘긴다.
 */
export default function RouteGuidanceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'RouteGuidance'>>();
  const route = DUMMY_ROUTE_RESULTS.find(result => result.id === params.routeId) ?? DUMMY_ROUTE_RESULTS[0];
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [stepIndex, setStepIndex] = useState(0);
  const step = DUMMY_GUIDANCE_STEPS[stepIndex];
  const isLastStep = stepIndex === DUMMY_GUIDANCE_STEPS.length - 1;
  // 마지막 구간에서 "다음"을 누르면 도착한 것으로 본다. 별도 화면을 띄우지 않고 지도 위에서
  // 남은 경로를 끝까지 줄이고, 상단 카드를 도착 안내로 바꾸고, 하단에 "안내 종료" 버튼을 띄운다.
  const [hasArrived, setHasArrived] = useState(false);
  // 지금 경로선/현재 위치/카메라가 향해야 할 진행 비율 — 도착하면 경로 끝(1).
  const targetProgress = hasArrived ? 1 : step.progress;
  useEffect(() => {
    if (hasArrived) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [hasArrived]);

  // 구간을 넘기면 경로선을 한 번에 바꾸지 않고, 화면에 그리는 진행 비율(displayProgress)을
  // 새 구간 값까지 매 프레임 조금씩 옮겨서 파란 남은 경로가 줄어드는(이전으로 가면 늘어나는)
  // 애니메이션을 만든다. 카메라 기본 easing(EaseOut)과 맞춰 ease-out cubic으로 움직인다.
  const [displayProgress, setDisplayProgress] = useState(step.progress);
  const displayProgressRef = useRef(step.progress);
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

  const { position, traveled, remaining } = useMemo(
    () => splitPathAt(DUMMY_ROUTE_PATH, displayProgress),
    [displayProgress],
  );

  // NavigationScreen의 routeLineCapReady와 같은 우회: 선언된 기본값(Round)을 처음부터 넘기면
  // 네이티브가 변경으로 보지 않아 반영이 안 되니, Butt/Miter로 그렸다가 다음 틱에 Round로 바꾼다.
  const [lineCapReady, setLineCapReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLineCapReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // 구간을 넘기면 현재 위치가 옮겨가니 카메라도 새 위치로 한 번에 애니메이션한다(선 애니메이션과
  // 같은 시간). 매 프레임 바뀌는 position이 아니라 목표 구간 기준이다. 첫 위치는 initialCamera로 잡는다.
  const mapRef = useRef<NaverMapViewRef>(null);
  const isFirstStep = useRef(true);
  useEffect(() => {
    if (isFirstStep.current) {
      isFirstStep.current = false;
      return;
    }
    const target = splitPathAt(DUMMY_ROUTE_PATH, targetProgress).position;
    mapRef.current?.animateCameraTo({ ...target, zoom: GUIDANCE_ZOOM, duration: STEP_TRANSITION_MS });
  }, [targetProgress]);

  // 길찾기를 마쳤으니 경로 보기로 돌아가지 않고 지도 탭으로 나간다.
  const endGuidance = () => navigation.popTo('MainTabs', { screen: 'map' });

  return (
    <Container>
      <NaverMapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialCamera={{ ...position, zoom: GUIDANCE_ZOOM }}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        isRotateGesturesEnabled={false}
        isTiltGesturesEnabled={false}
      >
        <NaverMapPolylineOverlay
          coords={traveled}
          width={6}
          color={theme.semantic.line.primary}
          capType={lineCapReady ? 'Round' : 'Butt'}
          joinType={lineCapReady ? 'Round' : 'Miter'}
          zIndex={0}
        />
        <NaverMapPolylineOverlay
          coords={remaining}
          width={6}
          color={theme.blue[500]}
          // 끝까지 가면 남은 구간이 길이 0(같은 점 두 개)이 되니 숨긴다.
          isHidden={displayProgress >= 1}
          capType={lineCapReady ? 'Round' : 'Butt'}
          joinType={lineCapReady ? 'Round' : 'Miter'}
          zIndex={0}
        />
        <NaverMapStartPointMarker
          latitude={DUMMY_ROUTE_MAP.startLatitude}
          longitude={DUMMY_ROUTE_MAP.startLongitude}
          label={DUMMY_ROUTE_MAP.startLabel}
          // 이미 떠난 출발지라 Figma처럼 회색 비활성 톤으로 그린다.
          active={false}
        />
        <NaverMapMarker
          latitude={DUMMY_ROUTE_MAP.endLatitude}
          longitude={DUMMY_ROUTE_MAP.endLongitude}
          label={DUMMY_ROUTE_MAP.endLabel}
          zIndex={1}
          scale={1}
        />
        {ripples.map((ripple, index) => (
          <NaverMapCircleOverlay
            key={index}
            latitude={DUMMY_ROUTE_MAP.endLatitude}
            longitude={DUMMY_ROUTE_MAP.endLongitude}
            radius={ripple.radius}
            // theme.blue[500](#343B9D)에 파동 진행에 따른 투명도만 입힌다.
            color={`rgba(52, 59, 157, ${ripple.alpha})`}
            isHidden={ripple.alpha <= 0}
            // 경로선 위, 도착 핀(zIndex 1) 아래에 깔린다.
            zIndex={0}
          />
        ))}
        <NaverMapUserPointMarker
          latitude={position.latitude}
          longitude={position.longitude}
          alpha={userMarkerAlpha}
        />
      </NaverMapView>

      {/* 도착하면 key가 바뀌면서 카드가 도착 안내로 페이드 전환된다. */}
      <CardWrapper key={hasArrived ? 'arrived' : 'guiding'} entering={FadeIn.duration(250)} style={{ top: insets.top + 8 }}>
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
          <MoveInfoCard
            icon={MOVE_TYPE_ICONS[step.moveType]}
            title={step.title}
            durationText={step.durationText}
            onClose={() => navigation.goBack()}
            stepCount={DUMMY_GUIDANCE_STEPS.length}
            activeStepIndex={stepIndex}
          />
        )}
      </CardWrapper>

      {hasArrived ? (
        <EndButtonWrapper entering={FadeInDown.duration(300)} style={{ paddingBottom: insets.bottom + 8 }}>
          <Button label="안내 종료" onPress={endGuidance} />
        </EndButtonWrapper>
      ) : (
        <StepButtonsWrapper>
          <GuidanceStepButtons
            onPrev={() => setStepIndex(index => Math.max(0, index - 1))}
            onNext={() => (isLastStep ? setHasArrived(true) : setStepIndex(index => index + 1))}
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
