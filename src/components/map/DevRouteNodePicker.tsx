import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';
import { NaverMapCircleOverlay, NaverMapPolylineOverlay } from '@mj-studio/react-native-naver-map';
import {
  getIncompleteStages,
  setTestRouteNodes,
  TEST_ROUTE_NODES,
  TEST_ROUTE_STAGES,
  TestRouteNodes,
} from '@constant/testIndoorRoute';
import { saveDevJson } from '@utils/devSave';
import { FloorGeoAnchors, GeoCoord } from '@utils/floorGeoTransform';
import { FloorPlanOverlay, LiveFloorImage } from './FloorPlanOverlay';
import { NaverMapMarker } from './NaverMapMarker';

/**
 * [개발용] 실내 길찾기 테스트 경로(testIndoorRoute.ts)의 노드를 지도에서 직접 찍는 모드. 구간을 고르면 그
 * 층 평면도(🏢 모드에서 앉힌 것)가 깔리고, 탭할 때마다 그 구간 끝에 노드가 붙는다. 첫 노드는 구간 시작
 * 지점(예: 카페나무), 마지막 노드는 끝 지점(예: 계단)에 찍는다. "다음 구간"으로 넘어가면 앞 구간 마지막
 * 노드를 새 구간 첫 노드로 이어준다(계단/엘리베이터/출입구는 같은 자리라서). 노드가 바뀔 때마다 Metro 개발
 * 서버(devSaveMiddleware)가 testRouteNodes.json에 바로 저장해서, 앱을 껐다 켜도 찍은 노드가 남고 길찾기에 쓰인다.
 * __DEV__에서만 켤 수 있고, 릴리스 빌드엔 버튼 자체가 안 뜬다.
 */
export type DevSaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export function useDevRouteNodes({ onComplete }: { onComplete: () => void }) {
  const [active, setActive] = useState(false);
  const [saveStatus, setSaveStatus] = useState<DevSaveStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [nodes, setNodes] = useState<TestRouteNodes>(TEST_ROUTE_NODES);
  const stage = TEST_ROUTE_STAGES[stageIndex];
  const stageNodes = nodes[stage.key] ?? [];

  const setStageNodes = useCallback(
    (key: string, next: GeoCoord[]) => setNodes(prev => ({ ...prev, [key]: next })),
    [],
  );

  const logAll = useCallback((all: TestRouteNodes) => {
    console.log(`[ROUTE_NODES] ${JSON.stringify(all)}`);
  }, []);

  const save = useCallback(async (all: TestRouteNodes) => {
    setSaveStatus('saving');
    const res = await saveDevJson('testRouteNodes', all);
    setSaveStatus(res?.ok ? 'saved' : 'failed');
  }, []);

  // 찍거나 지울 때마다 길찾기가 바로 쓰게 넘기고 파일에도 저장한다. 처음 불러온 값(파일 내용 그대로)은 다시 쓰지 않는다.
  const loadedRef = useRef(nodes);
  useEffect(() => {
    setTestRouteNodes(nodes);
    if (nodes === loadedRef.current) return;
    setMessage(null);
    save(nodes);
  }, [nodes, save]);

  const handleTap = useCallback(
    ({ latitude, longitude }: GeoCoord) => {
      console.log(`[ROUTE_NODE] ${stage.title} #${stageNodes.length + 1} ${latitude.toFixed(7)}, ${longitude.toFixed(7)}`);
      setStageNodes(stage.key, [...stageNodes, { latitude, longitude }]);
    },
    [stage, stageNodes, setStageNodes],
  );

  const selectStage = useCallback(
    (index: number) => {
      const target = TEST_ROUTE_STAGES[index];
      const prevNodes = index > 0 ? nodes[TEST_ROUTE_STAGES[index - 1].key] : undefined;
      // 비어있는 구간으로 넘어가면 앞 구간 끝 노드(층 이동/출입 지점)를 첫 노드로 이어 둔다.
      if (!nodes[target.key]?.length && prevNodes?.length) {
        setStageNodes(target.key, [prevNodes[prevNodes.length - 1]]);
      }
      setStageIndex(index);
    },
    [nodes, setStageNodes],
  );

  const isLastStage = stageIndex === TEST_ROUTE_STAGES.length - 1;

  return {
    active,
    toggle: () => setActive(prev => !prev),
    stage,
    stageIndex,
    stageNodes,
    nodes,
    isLastStage,
    handleTap,
    selectStage,
    undo: () => setStageNodes(stage.key, stageNodes.slice(0, -1)),
    clear: () => setStageNodes(stage.key, []),
    saveStatus,
    message,
    retrySave: () => save(nodes),
    next: () => {
      logAll(nodes);
      if (!isLastStage) {
        selectStage(stageIndex + 1);
        return;
      }
      const missing = getIncompleteStages(nodes);
      if (missing.length > 0) {
        setMessage(`아직 덜 찍은 구간: ${missing.map(s => s.title).join(', ')} (구간마다 노드 2개 이상)`);
        return;
      }
      // 다 찍었으면 모드를 닫고 길찾기로 넘어가서 방금 찍은 경로를 바로 확인한다.
      setActive(false);
      onComplete();
    },
  };
}

type RouteNodePicker = ReturnType<typeof useDevRouteNodes>;

/** 지금 구간의 평면도 + 전 구간 노드/경로선. NaverMapView의 children으로 넣는다. */
export function DevRouteNodeLayer({
  picker,
  floorAnchors,
  liveFloorImages,
}: {
  picker: RouteNodePicker;
  /** 🏢 평면도 앉히기 모드가 들고 있는 층별 기준점 (저장된 값 + 이번 세션에 찍은 값) */
  floorAnchors: Record<string, FloorGeoAnchors>;
  /** 🏢 모드에서 방금 구워 개발 서버로 바로 띄우는 평면도 PNG */
  liveFloorImages: Record<string, LiveFloorImage>;
}) {
  const { active, stage, stageNodes, nodes } = picker;
  if (!active) return null;

  return (
    <>
      {stage.floorId && (
        <FloorPlanOverlay
          floorId={stage.floorId}
          anchors={floorAnchors[stage.floorId]}
          liveImage={liveFloorImages[stage.floorId]}
        />
      )}
      {TEST_ROUTE_STAGES.map(({ key }) => {
        const coords = nodes[key] ?? [];
        const current = key === stage.key;
        return (
          <React.Fragment key={`route-stage-${key}`}>
            {coords.length >= 2 && (
              <NaverMapPolylineOverlay
                coords={coords}
                width={current ? 5 : 3}
                color={current ? '#007AFF' : 'rgba(60, 60, 67, 0.45)'}
                zIndex={current ? 6 : 5}
              />
            )}
            {coords.map((coord, i) => (
              <NaverMapCircleOverlay
                key={`route-node-${key}-${i}`}
                latitude={coord.latitude}
                longitude={coord.longitude}
                radius={current ? 0.8 : 0.5}
                color={current ? '#007AFF' : 'rgba(60, 60, 67, 0.6)'}
                outlineColor="#FFFFFF"
                outlineWidth={1}
                zIndex={7}
              />
            ))}
          </React.Fragment>
        );
      })}
      {stageNodes.length > 0 && (
        <NaverMapMarker
          latitude={stageNodes[0].latitude}
          longitude={stageNodes[0].longitude}
          label={stage.from}
          zIndex={10}
        />
      )}
      {stageNodes.length > 1 && (
        <NaverMapMarker
          latitude={stageNodes[stageNodes.length - 1].latitude}
          longitude={stageNodes[stageNodes.length - 1].longitude}
          label={`${stageNodes.length}`}
          zIndex={10}
        />
      )}
    </>
  );
}

/** 토글 버튼 + 모드가 켜졌을 때 상단 구간 선택/조작 패널. 지도 위(NaverMapView 형제)에 absolute로 얹는다. */
export function DevRouteNodePanel({
  picker,
  topInset,
  floorAnchors,
}: {
  picker: RouteNodePicker;
  topInset: number;
  floorAnchors: Record<string, FloorGeoAnchors>;
}) {
  if (!__DEV__) return null;
  const { active, stage, stageIndex, stageNodes, nodes, isLastStage, saveStatus, message } = picker;
  const missingFloor = stage.floorId !== null && !floorAnchors[stage.floorId];

  const hint =
    stageNodes.length === 0
      ? `시작 지점(${stage.from})을 탭하세요`
      : `꺾이는 곳마다 탭하고, 마지막은 ${stage.to}에 찍으세요 (노드 ${stageNodes.length}개)`;

  return (
    <>
      <ToggleButton onPress={picker.toggle} active={active}>
        <ToggleText>🧭</ToggleText>
      </ToggleButton>

      {active && (
        <Panel style={{ top: topInset + 8 }}>
          <ButtonRow>
            {TEST_ROUTE_STAGES.map((item, index) => (
              <PanelButton
                key={item.key}
                onPress={() => picker.selectStage(index)}
                primary={index === stageIndex}
              >
                <PanelButtonText primary={index === stageIndex} numberOfLines={1}>
                  {item.key === 'outdoor' ? '바깥' : item.key}
                  {(nodes[item.key]?.length ?? 0) >= 2 ? ' ✓' : ''}
                </PanelButtonText>
              </PanelButton>
            ))}
          </ButtonRow>
          <PanelTitle>
            {stage.title}: {stage.from} → {stage.to}
          </PanelTitle>
          <PanelHint>
            {hint}
            {missingFloor ? `\n${stage.floorId} 평면도 기준점이 없어요 — 🏢에서 먼저 앉히면 도면 위에 찍을 수 있어요` : ''}
          </PanelHint>
          {message && <PanelWarning>{message}</PanelWarning>}
          <DevSaveStatusRow status={saveStatus} onRetry={picker.retrySave} />
          <ButtonRow>
            <PanelButton onPress={picker.undo} disabled={stageNodes.length === 0}>
              <PanelButtonText>되돌리기</PanelButtonText>
            </PanelButton>
            <PanelButton onPress={picker.clear} disabled={stageNodes.length === 0}>
              <PanelButtonText>비우기</PanelButtonText>
            </PanelButton>
            <PanelButton onPress={picker.next} primary disabled={stageNodes.length < 2}>
              <PanelButtonText primary>{isLastStage ? '완료' : '다음 구간'}</PanelButtonText>
            </PanelButton>
          </ButtonRow>
        </Panel>
      )}
    </>
  );
}

const SAVE_STATUS_TEXT: Record<DevSaveStatus, string> = {
  idle: '',
  saving: '저장 중…',
  saved: '파일에 저장됨',
  failed: '저장 실패 — Metro(expo start)를 껐다 켠 뒤 다시 저장을 누르세요',
};

/** 파일 저장 상태 한 줄 + 실패했을 때 다시 저장 버튼. 🏢/🧭 패널이 같이 쓴다. */
export function DevSaveStatusRow({ status, onRetry }: { status: DevSaveStatus; onRetry: () => void }) {
  if (status === 'idle') return null;
  return (
    <StatusRow>
      {status === 'failed' ? (
        <PanelWarning style={{ flex: 1 }}>{SAVE_STATUS_TEXT[status]}</PanelWarning>
      ) : (
        <PanelHint style={{ flex: 1 }}>{SAVE_STATUS_TEXT[status]}</PanelHint>
      )}
      {status === 'failed' && (
        <RetryButton onPress={onRetry}>
          <PanelButtonText>다시 저장</PanelButtonText>
        </RetryButton>
      )}
    </StatusRow>
  );
}

const StatusRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const RetryButton = styled(Pressable)`
  padding: 6px 12px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;

const PanelWarning = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  color: #d93025;
`;

const ToggleButton = styled(Pressable)<{ active: boolean }>`
  position: absolute;
  left: 16px;
  bottom: 224px;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, active }) => (active ? theme.semantic.background.brand : theme.semantic.background.primary)};
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 6px;
  elevation: 4;
`;

const ToggleText = styled.Text`
  font-size: 20px;
`;

const Panel = styled.View`
  position: absolute;
  left: 16px;
  right: 16px;
  z-index: 20;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.semantic.background.primary};
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 8px;
  elevation: 6;
`;

const PanelTitle = styled.Text`
  font-family: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontSize}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const PanelHint = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const ButtonRow = styled.View`
  flex-direction: row;
  gap: 8px;
`;

const PanelButton = styled(Pressable)<{ primary?: boolean }>`
  flex: 1;
  align-items: center;
  padding-vertical: 8px;
  border-radius: 8px;
  background-color: ${({ theme, primary }) => (primary ? theme.semantic.background.brand : theme.semantic.background.fill)};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

const PanelButtonText = styled.Text<{ primary?: boolean }>`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  color: ${({ theme, primary }) => (primary ? theme.semantic.text.white : theme.semantic.text.primary)};
`;
