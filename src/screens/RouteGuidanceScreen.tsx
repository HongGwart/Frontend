import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NaverMapView, NaverMapPolylineOverlay, NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import WalkIcon from '@assets/svgs/icons/walk.svg';
import ElevatorIcon from '@assets/svgs/icons/elevator.svg';
import StairsIcon from '@assets/svgs/icons/stairs.svg';
import EntranceIcon from '@assets/svgs/icons/entrance.svg';
import { MoveInfoCard } from '@components/navigation/MoveInfoCard';
import { GuidanceStepButtons } from '@components/navigation/GuidanceStepButtons';
import { NaverMapMarker } from '@components/map/NaverMapMarker';
import { NaverMapStartPointMarker } from '@components/map/NaverMapStartPointMarker';
import { NaverMapUserPointMarker } from '@components/map/NaverMapUserPointMarker';
import {
  DUMMY_GUIDANCE_STEPS,
  DUMMY_ROUTE_MAP,
  DUMMY_ROUTE_PATH,
  GuidanceMoveType,
} from '@constant/dummyRouteResults';
import { MAP_MIN_ZOOM, MAP_MAX_ZOOM } from '@constant/mapCamera';
import { RootStackParamList } from '@navigation/types';
import { splitPathAt } from '@utils/routePath';

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

/**
 * 길찾기 "경로 안내 시작"을 누르면 뜨는 길 안내 화면. Figma "길 안내_걷기"(784:4466).
 * 지도 전체 위에 상단 "move info" 카드(지금 구간 안내)와 우하단 이전/다음 버튼을 얹는다.
 * 지나온 구간은 회색, 남은 구간은 파란색 경로선으로 나누고, 그 경계에 현재 위치 마커를
 * 찍은 뒤 카메라를 현재 위치에 맞춘다. 아직 실제 위치 추적이 없어서 구간은 버튼으로 넘긴다.
 */
export default function RouteGuidanceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [stepIndex, setStepIndex] = useState(0);
  const step = DUMMY_GUIDANCE_STEPS[stepIndex];

  // 구간을 넘기면 경로선을 한 번에 바꾸지 않고, 화면에 그리는 진행 비율(displayProgress)을
  // 새 구간 값까지 매 프레임 조금씩 옮겨서 파란 남은 경로가 줄어드는(이전으로 가면 늘어나는)
  // 애니메이션을 만든다. 카메라 기본 easing(EaseOut)과 맞춰 ease-out cubic으로 움직인다.
  const [displayProgress, setDisplayProgress] = useState(step.progress);
  const displayProgressRef = useRef(step.progress);
  useEffect(() => {
    const from = displayProgressRef.current;
    const to = step.progress;
    if (from === to) return;
    const startedAt = Date.now();
    let frameId = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / STEP_TRANSITION_MS);
      const eased = 1 - (1 - t) ** 3;
      const next = from + (to - from) * eased;
      displayProgressRef.current = next;
      setDisplayProgress(next);
      if (t < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    // 애니메이션 도중 또 넘기면, 지금 그려진 위치에서 새 목표로 이어서 움직인다.
    return () => cancelAnimationFrame(frameId);
  }, [step.progress]);

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
    const target = splitPathAt(DUMMY_ROUTE_PATH, step.progress).position;
    mapRef.current?.animateCameraTo({ ...target, zoom: GUIDANCE_ZOOM, duration: STEP_TRANSITION_MS });
  }, [step.progress]);

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
        <NaverMapUserPointMarker latitude={position.latitude} longitude={position.longitude} />
      </NaverMapView>

      <CardWrapper style={{ top: insets.top + 8 }}>
        <MoveInfoCard
          icon={MOVE_TYPE_ICONS[step.moveType]}
          title={step.title}
          durationText={step.durationText}
          onClose={() => navigation.goBack()}
          stepCount={DUMMY_GUIDANCE_STEPS.length}
          activeStepIndex={stepIndex}
        />
      </CardWrapper>

      <StepButtonsWrapper>
        <GuidanceStepButtons
          onPrev={() => setStepIndex(index => Math.max(0, index - 1))}
          onNext={() => setStepIndex(index => Math.min(DUMMY_GUIDANCE_STEPS.length - 1, index + 1))}
          prevDisabled={stepIndex === 0}
          nextDisabled={stepIndex === DUMMY_GUIDANCE_STEPS.length - 1}
        />
      </StepButtonsWrapper>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;

// Figma: 상태바(48) 아래 8px, 좌우 20px 여백으로 지도 위에 뜬다.
const CardWrapper = styled.View`
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
