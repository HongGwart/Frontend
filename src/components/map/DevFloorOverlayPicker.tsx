import React, { RefObject, useCallback, useRef, useState } from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import styled from 'styled-components/native';
import { NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import { FLOOR_GEO_ANCHORS } from '@constant/floorGeoAnchors';
import { FLOOR_MAPS } from '@constant/floorMaps';
import { getDevServerUrl, saveDevJson } from '@utils/devSave';
import { FloorGeoAnchors } from '@utils/floorGeoTransform';
import { FloorPlanOverlay, getFreshOverlayImage, LiveFloorImage } from './FloorPlanOverlay';
import { FloorPlanEditor, FloorPlanEditorHandle, FloorPlanPlacement } from './FloorPlanEditor';
import { DevSaveStatus, DevSaveStatusRow } from './DevRouteNodePicker';

// 지도에 얹어볼 층. 칩 순서 그대로 보여준다.
export const OVERLAY_FLOOR_IDS = ['R_L', 'R_1', 'C_1', 'C_8'];

/**
 * 화면 좌표 ↔ 위경도 변환을 한 번에 하나씩 돌린다. 네이버 지도 라이브러리는 이 변환 요청을 하나만 들고 있다가
 * 새 요청이 오면 앞 요청을 isValid: false로 끝내 버려서, Promise.all로 동시에 부르면 마지막 것 빼고 다 실패한다.
 */
async function sequential<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (const item of items) results.push(await fn(item));
  return results;
}

// 미세 조정 버튼 한 번에 돌리는 각도/키우는 비율
const ROTATE_STEP = (0.5 * Math.PI) / 180;
const SCALE_STEP = 1.01;

/**
 * [개발용] 층 평면도를 네이버 지도에 맞춰 얹는 모드. 층을 고르고 "도면 맞추기"를 누르면 건물 내부 지도와 같은
 * SVG가 지도 위에 반투명하게 뜨고, 끌어서 옮기고 두 손가락으로 돌리고 크기를 조절한다(모양은 그대로 유지).
 * "저장"을 누르면 도면 네 모서리의 화면 위치를 위경도로 바꿔 기준점으로 삼고, Metro 개발 서버(devSaveMiddleware)가
 * floorGeoAnchors.json에 저장한 뒤 renderFloorOverlay.js로 그 층 PNG를 구워 바로 지도에 얹는다.
 * PNG가 없거나 낡았으면 대신 방 도형 폴리곤 + 계단/엘리베이터 아이콘을 그린다.
 * __DEV__에서만 켤 수 있고, 릴리스 빌드엔 버튼 자체가 안 뜬다.
 */
export function useDevFloorOverlay(mapRef: RefObject<NaverMapViewRef | null>) {
  const [active, setActive] = useState(false);
  const [floorId, setFloorId] = useState(OVERLAY_FLOOR_IDS[0]);
  const [anchors, setAnchors] = useState<Record<string, FloorGeoAnchors>>(FLOOR_GEO_ANCHORS);
  // 개발 서버가 방금 구운 PNG. 번들 PNG가 HMR로 들어오기 전에도 바로 평면도를 띄우려고 httpUri로 들고 있는다.
  const [liveImages, setLiveImages] = useState<Record<string, LiveFloorImage>>({});
  const [saveStatus, setSaveStatus] = useState<DevSaveStatus>('idle');
  // 도면 맞추기 중이면 편집 시작 위치, 아니면 null
  const [editing, setEditing] = useState<FloorPlanPlacement | null>(null);
  const editorRef = useRef<FloorPlanEditorHandle>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  /** 기준점을 파일에 저장하고, render로 넘긴 층은 PNG까지 구워서 개발 서버 주소로 바로 띄운다. */
  const save = useCallback(async (all: Record<string, FloorGeoAnchors>, render: string[] = []) => {
    setSaveStatus('saving');
    const res = await saveDevJson('floorGeoAnchors', all, { render });
    setSaveStatus(res?.ok ? 'saved' : 'failed');
    const overlays = res?.overlays ?? {};
    if (Object.keys(overlays).length === 0) return;
    setLiveImages(prev => {
      const next = { ...prev };
      Object.entries(overlays).forEach(([id, overlay]) => {
        next[id] = {
          image: { httpUri: `${getDevServerUrl()}${overlay.path}` },
          region: overlay.region,
          anchors: overlay.anchors,
        };
      });
      return next;
    });
  }, []);

  /** 도면 맞추기 시작. 이미 얹은 층이면 지금 위치 그대로, 처음이면 화면 가운데에 화면 폭 70% 크기로 띄운다. */
  const startEditing = useCallback(async () => {
    const { data } = FLOOR_MAPS[floorId]();
    const cb = data.contentBounds ?? { minX: 0, minY: 0, width: data.width, height: data.height };
    const saved = anchors[floorId];
    if (saved && mapRef.current) {
      const pts = await sequential(saved, a => mapRef.current!.coordinateToScreen(a));
      if (pts.every(p => p.isValid)) {
        const [tl, tr] = pts;
        setEditing({
          centerX: pts.reduce((sum, p) => sum + p.screenX, 0) / 4,
          centerY: pts.reduce((sum, p) => sum + p.screenY, 0) / 4,
          pxPerUnit: Math.hypot(tr.screenX - tl.screenX, tr.screenY - tl.screenY) / cb.width,
          rotation: Math.atan2(tr.screenY - tl.screenY, tr.screenX - tl.screenX),
        });
        return;
      }
    }
    setEditing({
      centerX: screenWidth / 2,
      centerY: screenHeight / 2,
      pxPerUnit: (screenWidth * 0.7) / cb.width,
      rotation: 0,
    });
  }, [floorId, anchors, mapRef, screenWidth, screenHeight]);

  /** 지금 도면 네 모서리의 화면 위치 → 위경도로 바꿔 기준점으로 저장하고 PNG를 굽는다. */
  const commitEditing = useCallback(async () => {
    const corners = editorRef.current?.getCornerScreenPoints();
    if (!corners || !mapRef.current) return;
    const coords = await sequential(corners, ({ x, y }) =>
      mapRef.current!.screenToCoordinate({ screenX: x, screenY: y }),
    );
    const next = coords.map(({ latitude, longitude }) => ({ latitude, longitude })) as FloorGeoAnchors;
    const all = { ...anchors, [floorId]: next };
    console.log(`[FLOOR_ANCHORS] ${JSON.stringify(all)}`);
    setAnchors(all);
    setEditing(null);
    save(all, [floorId]);
  }, [anchors, floorId, mapRef, save]);

  const reset = useCallback(() => {
    if (!anchors[floorId]) return;
    const next = { ...anchors };
    delete next[floorId];
    setAnchors(next);
    save(next);
  }, [anchors, floorId, save]);

  return {
    active,
    toggle: () => {
      setActive(prev => !prev);
      setEditing(null);
    },
    floorId,
    selectFloor: (id: string) => {
      setFloorId(id);
      setEditing(null);
    },
    anchors,
    liveImages,
    saveStatus,
    // 저장이 실패했던 기준점을 전부 다시 보내고 PNG도 전부 다시 굽는다(맞춘 값은 앱 상태에 남아 있다).
    retrySave: () => save(anchors, Object.keys(anchors)),
    editing,
    editorRef,
    startEditing,
    commitEditing,
    cancelEditing: () => setEditing(null),
    reset,
  };
}

type FloorOverlayPicker = ReturnType<typeof useDevFloorOverlay>;

/** 선택한 층의 평면도. 도면 맞추기 중엔 FloorPlanEditor가 대신 보여서 안 그린다. NaverMapView의 children으로 넣는다. */
export function DevFloorOverlayLayer({ picker }: { picker: FloorOverlayPicker }) {
  const { active, floorId, anchors, editing } = picker;
  if (!active || editing) return null;
  return (
    <FloorPlanOverlay
      floorId={floorId}
      anchors={anchors[floorId]}
      liveImage={picker.liveImages[floorId]}
      showAnchorOutline
    />
  );
}

/**
 * 토글 버튼 + 모드가 켜졌을 때 상단 층 선택/조작 패널 + 도면 맞추기 레이어.
 * NaverMapView와 같은 부모 안(형제)에 둬야 편집 레이어의 화면 좌표가 지도와 맞는다.
 */
export function DevFloorOverlayPanel({ picker, topInset }: { picker: FloorOverlayPicker; topInset: number }) {
  if (!__DEV__) return null;
  const { active, floorId, anchors, editing } = picker;
  const placed = Boolean(anchors[floorId]);

  const title = editing
    ? `${floorId} 도면을 끌어서 옮기고, 두 손가락으로 돌리고 크기를 맞추세요`
    : !placed
      ? `${floorId} 아직 안 얹었어요 — 도면 맞추기를 누르세요`
      : getFreshOverlayImage(floorId, anchors[floorId], picker.liveImages[floorId])
        ? `${floorId} 평면도를 얹었어요`
        : picker.saveStatus === 'failed'
          ? `${floorId} 방 도형만 그렸어요 — 저장이 안 돼서 평면도 PNG를 못 구웠어요`
          : `${floorId} 평면도 PNG를 굽는 중이에요`;

  return (
    <>
      {active && editing && (
        <FloorPlanEditor key={floorId} ref={picker.editorRef} floorId={floorId} initial={editing} />
      )}

      <ToggleButton onPress={picker.toggle} active={active}>
        <ToggleText>🏢</ToggleText>
      </ToggleButton>

      {active && (
        <Panel style={{ top: topInset + 8 }}>
          <ButtonRow>
            {OVERLAY_FLOOR_IDS.map(id => (
              <PanelButton key={id} onPress={() => picker.selectFloor(id)} primary={id === floorId}>
                <PanelButtonText primary={id === floorId}>
                  {id}
                  {anchors[id] ? ' ✓' : ''}
                </PanelButtonText>
              </PanelButton>
            ))}
          </ButtonRow>
          <PanelTitle>{title}</PanelTitle>
          {!editing && <DevSaveStatusRow status={picker.saveStatus} onRetry={picker.retrySave} />}
          {editing ? (
            <>
              <ButtonRow>
                <PanelButton onPress={() => picker.editorRef.current?.rotateBy(-ROTATE_STEP)}>
                  <PanelButtonText>↺ 0.5°</PanelButtonText>
                </PanelButton>
                <PanelButton onPress={() => picker.editorRef.current?.rotateBy(ROTATE_STEP)}>
                  <PanelButtonText>↻ 0.5°</PanelButtonText>
                </PanelButton>
                <PanelButton onPress={() => picker.editorRef.current?.scaleBy(1 / SCALE_STEP)}>
                  <PanelButtonText>－ 1%</PanelButtonText>
                </PanelButton>
                <PanelButton onPress={() => picker.editorRef.current?.scaleBy(SCALE_STEP)}>
                  <PanelButtonText>＋ 1%</PanelButtonText>
                </PanelButton>
              </ButtonRow>
              <ButtonRow>
                <PanelButton onPress={picker.cancelEditing}>
                  <PanelButtonText>취소</PanelButtonText>
                </PanelButton>
                <PanelButton onPress={picker.commitEditing} primary>
                  <PanelButtonText primary>저장</PanelButtonText>
                </PanelButton>
              </ButtonRow>
            </>
          ) : (
            <ButtonRow>
              <PanelButton onPress={picker.reset} disabled={!placed}>
                <PanelButtonText>지우기</PanelButtonText>
              </PanelButton>
              <PanelButton onPress={picker.startEditing} primary>
                <PanelButtonText primary>{placed ? '도면 다시 맞추기' : '도면 맞추기'}</PanelButtonText>
              </PanelButton>
            </ButtonRow>
          )}
        </Panel>
      )}
    </>
  );
}

const ToggleButton = styled(Pressable)<{ active: boolean }>`
  position: absolute;
  left: 16px;
  bottom: 172px;
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
