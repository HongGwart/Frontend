import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import {
  NaverMapCircleOverlay,
  NaverMapPolygonOverlay,
  NaverMapPolylineOverlay,
  NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { BuildingMasks, getBuildingMasks, setBuildingMasks } from '@constant/buildingMasks';
import { FLOOR_MAPS, parseFloorId } from '@constant/floorMaps';
import { FLOOR_PLAN_ANCHORS } from '@constant/floorPlanReferencePoints';
import { saveDevJson } from '@utils/devSave';
import { GeoCoord } from '@utils/floorGeoTransform';
import { DevSaveStatus, DevSaveStatusRow } from './DevSaveStatusRow';
import { FloorPlanOverlay } from './FloorPlanOverlay';

/** 덮개를 찍을 수 있는 건물(평면도가 있는 건물)과, 찍을 때 참고로 깔 층(1층, 없으면 가장 낮은 지상층). */
const BUILDINGS = (() => {
  const byBuilding = new Map<string, { floorId: string; floorNum: number }[]>();
  Object.keys(FLOOR_MAPS).forEach(floorId => {
    const { building, floorNum } = parseFloorId(floorId);
    byBuilding.set(building, [...(byBuilding.get(building) ?? []), { floorId, floorNum }]);
  });
  return [...byBuilding.entries()]
    .map(([building, floors]) => {
      const sorted = [...floors].sort((a, b) => Math.abs(a.floorNum - 1) - Math.abs(b.floorNum - 1));
      return { building, floorId: sorted[0].floorId };
    })
    .sort((a, b) => a.building.localeCompare(b.building));
})();

const anchorsOf = (floorId: string) => FLOOR_PLAN_ANCHORS[floorId];

/**
 * [개발용] 건물 덮개 찍기 모드. 건물을 고르면 그 건물 평면도가 깔리고, 네이버 지도에 그려진 그 건물의 모서리를
 * 차례로 탭하면 덮개 다각형이 된다. 찍거나 지울 때마다 Metro 개발 서버(devSaveMiddleware)가 buildingMasks.json에
 * 바로 저장한다. 찍는 동안에는 네이버 건물이 보여야 하니 덮개는 칠하지 않고 테두리만 그린다.
 * __DEV__에서만 켤 수 있고, 릴리스 빌드엔 버튼 자체가 안 뜬다.
 */
export function useDevBuildingMasks(mapRef: RefObject<NaverMapViewRef | null>) {
  const [active, setActive] = useState(false);
  const [saveStatus, setSaveStatus] = useState<DevSaveStatus>('idle');
  const [masks, setMasks] = useState<BuildingMasks>(getBuildingMasks);
  const [building, setBuilding] = useState(BUILDINGS[0]?.building ?? '');
  const current = BUILDINGS.find(item => item.building === building);
  const points = masks[building] ?? [];

  const save = useCallback(async (all: BuildingMasks) => {
    setSaveStatus('saving');
    const res = await saveDevJson('buildingMasks', all);
    setSaveStatus(res?.ok ? 'saved' : 'failed');
  }, []);

  // 찍거나 지울 때마다 다른 지도 화면에도 바로 쓰이게 넘기고 파일에도 저장한다. 처음 불러온 값은 다시 쓰지 않는다.
  const loadedRef = useRef(masks);
  useEffect(() => {
    setBuildingMasks(masks);
    if (masks === loadedRef.current) return;
    save(masks);
  }, [masks, save]);

  const setPoints = useCallback(
    (next: GeoCoord[]) =>
      setMasks(prev => {
        const all = { ...prev };
        if (next.length > 0) all[building] = next;
        else delete all[building];
        return all;
      }),
    [building],
  );

  const handleTap = useCallback(
    ({ latitude, longitude }: GeoCoord) => {
      console.log(`[BUILDING_MASK] ${building} #${points.length + 1} ${latitude.toFixed(7)}, ${longitude.toFixed(7)}`);
      setPoints([...points, { latitude, longitude }]);
    },
    [building, points, setPoints],
  );

  // 건물을 고르면 그 건물 평면도가 화면 가운데 오도록 카메라를 옮긴다.
  const selectBuilding = useCallback(
    (next: string) => {
      setBuilding(next);
      const floorId = BUILDINGS.find(item => item.building === next)?.floorId;
      const anchors = floorId ? anchorsOf(floorId) : undefined;
      if (!anchors) return;
      const latitude = anchors.reduce((sum, p) => sum + p.latitude, 0) / anchors.length;
      const longitude = anchors.reduce((sum, p) => sum + p.longitude, 0) / anchors.length;
      mapRef.current?.animateCameraTo({ latitude, longitude, zoom: 18.5, duration: 300 });
    },
    [mapRef],
  );

  return {
    active,
    toggle: () => setActive(prev => !prev),
    building,
    floorId: current?.floorId,
    points,
    masks,
    handleTap,
    selectBuilding,
    undo: () => setPoints(points.slice(0, -1)),
    clear: () => setPoints([]),
    saveStatus,
    retrySave: () => save(masks),
  };
}

type BuildingMaskPicker = ReturnType<typeof useDevBuildingMasks>;

/** 고른 건물의 평면도(덮개 없이) + 찍고 있는 덮개 테두리·꼭짓점. NaverMapView의 children으로 넣는다. */
export function DevBuildingMaskLayer({ picker }: { picker: BuildingMaskPicker }) {
  const { active, floorId, points } = picker;
  if (!active) return null;
  const closed = points.length >= 3 ? [...points, points[0]] : points;

  return (
    <>
      {floorId && <FloorPlanOverlay floorId={floorId} anchors={anchorsOf(floorId)} hideBuildingMask />}
      {points.length >= 3 && (
        <NaverMapPolygonOverlay
          coords={points}
          color="rgba(255, 59, 48, 0.12)"
          outlineColor="#FF3B30"
          outlineWidth={2}
          zIndex={6}
        />
      )}
      {points.length === 2 && <NaverMapPolylineOverlay coords={closed} width={2} color="#FF3B30" zIndex={6} />}
      {points.map((point, i) => (
        <NaverMapCircleOverlay
          key={`mask-point-${i}`}
          latitude={point.latitude}
          longitude={point.longitude}
          radius={0.6}
          color={i === points.length - 1 ? '#FF3B30' : '#FFFFFF'}
          outlineColor="#FF3B30"
          outlineWidth={1}
          zIndex={7}
        />
      ))}
    </>
  );
}

/** 토글 버튼 + 모드가 켜졌을 때 상단 건물 선택/조작 패널. 지도 위(NaverMapView 형제)에 absolute로 얹는다. */
export function DevBuildingMaskPanel({ picker, topInset }: { picker: BuildingMaskPicker; topInset: number }) {
  const doneCount = useMemo(
    () => Object.values(picker.masks).filter(mask => mask.length >= 3).length,
    [picker.masks],
  );
  if (!__DEV__) return null;
  const { active, building, points, masks, saveStatus } = picker;

  return (
    <>
      <ToggleButton onPress={picker.toggle} active={active}>
        <ToggleText>⬛</ToggleText>
      </ToggleButton>

      {active && (
        <Panel style={{ top: topInset + 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {BUILDINGS.map(item => (
              <Chip key={item.building} onPress={() => picker.selectBuilding(item.building)} primary={item.building === building}>
                <PanelButtonText primary={item.building === building}>
                  {item.building}
                  {(masks[item.building]?.length ?? 0) >= 3 ? ' ✓' : ''}
                </PanelButtonText>
              </Chip>
            ))}
          </ScrollView>
          <PanelTitle>
            {building}동 덮개 · 꼭짓점 {points.length}개 (완료 {doneCount}/{BUILDINGS.length})
          </PanelTitle>
          <PanelHint>
            네이버 지도에 그려진 {building}동 건물의 모서리를 한 바퀴 순서대로 탭하세요. 꼭짓점 3개부터 덮개가 되고, 앱에서는
            찍은 선보다 살짝 넓게 칠해 건물 테두리까지 가려요.
          </PanelHint>
          <DevSaveStatusRow status={saveStatus} onRetry={picker.retrySave} />
          <ButtonRow>
            <PanelButton onPress={picker.undo} disabled={points.length === 0}>
              <PanelButtonText>되돌리기</PanelButtonText>
            </PanelButton>
            <PanelButton onPress={picker.clear} disabled={points.length === 0}>
              <PanelButtonText>비우기</PanelButtonText>
            </PanelButton>
          </ButtonRow>
        </Panel>
      )}
    </>
  );
}

const ToggleButton = styled(Pressable)<{ active: boolean }>`
  position: absolute;
  left: 16px;
  bottom: 276px;
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

const Chip = styled(Pressable)<{ primary?: boolean }>`
  padding: 6px 12px;
  border-radius: 8px;
  background-color: ${({ theme, primary }) => (primary ? theme.semantic.background.brand : theme.semantic.background.fill)};
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
