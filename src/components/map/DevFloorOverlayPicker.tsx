import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import styled from 'styled-components/native';
import {
  NaverMapGroundOverlay,
  NaverMapMarkerOverlay,
  NaverMapPolygonOverlay,
} from '@mj-studio/react-native-naver-map';
import { FloorMapData } from '@appTypes/room';
import { FLOOR_MAPS } from '@constant/floorMaps';
import { FLOOR_GEO_ANCHORS } from '@constant/floorGeoAnchors';
import { FLOOR_OVERLAY_IMAGES } from '@constant/floorOverlayImages';
import { createFloorToGeo, FloorGeoAnchors, GeoCoord } from '@utils/floorGeoTransform';
import { NaverMapMarker } from './NaverMapMarker';

// 지도에 얹어볼 층. 칩 순서 그대로 보여준다.
export const OVERLAY_FLOOR_IDS = ['R_L', 'R_1', 'C_1', 'C_8'];

// 도면 contentBounds 모서리를 찍는 순서 (FloorGeoAnchors 순서와 같다)
const CORNER_LABELS = ['좌상단', '우상단', '우하단', '좌하단'];

/** contentBounds가 없는 층은 방 좌표로 바운딩 박스를 계산한다. */
function getContentBounds(data: FloorMapData) {
  if (data.contentBounds) return data.contentBounds;
  const xs = data.rooms.flatMap(r => r.points.map(p => p[0]));
  const ys = data.rooms.flatMap(r => r.points.map(p => p[1]));
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

/** 이 층의 구워둔 평면도 PNG가 지금 기준점으로 만든 것이면 돌려준다. 기준점을 다시 찍었으면 낡은 PNG라 안 쓴다. */
function getFreshOverlayImage(floorId: string, anchors: FloorGeoAnchors | undefined) {
  const overlay = FLOOR_OVERLAY_IMAGES[floorId];
  if (!overlay || !anchors) return null;
  return JSON.stringify(overlay.anchors) === JSON.stringify(anchors) ? overlay : null;
}

/**
 * [개발용] 층 평면도를 네이버 지도에 얹어보는 모드. 층을 고르고 도면 네 모서리(좌상단→우상단→우하단→좌하단)를
 * 지도에서 차례로 탭한다. 네 점을 다 찍을 때마다 "[FLOOR_ANCHORS]" JSON 로그를 Metro에 남기니
 * 그 값을 floorGeoAnchors.json에 붙여넣고 `node scripts/renderFloorOverlay.js`를 돌리면 실제 평면도 PNG가
 * 지도에 얹힌다. PNG가 없거나 기준점을 다시 찍어 낡았으면 대신 방 도형을 폴리곤으로 그려 위치만 확인한다.
 * __DEV__에서만 켤 수 있고, 릴리스 빌드엔 버튼 자체가 안 뜬다.
 */
export function useDevFloorOverlay() {
  const [active, setActive] = useState(false);
  const [floorId, setFloorId] = useState(OVERLAY_FLOOR_IDS[0]);
  const [anchors, setAnchors] = useState<Record<string, FloorGeoAnchors>>(FLOOR_GEO_ANCHORS);
  const [picking, setPicking] = useState<GeoCoord[]>([]);

  const done = Boolean(anchors[floorId]);

  const handleTap = useCallback(
    ({ latitude, longitude }: GeoCoord) => {
      if (done) return;
      const next = [...picking, { latitude, longitude }];
      console.log(`[FLOOR_PIN] ${floorId} ${CORNER_LABELS[picking.length]} ${latitude.toFixed(7)}, ${longitude.toFixed(7)}`);
      if (next.length < 4) {
        setPicking(next);
        return;
      }
      const all = { ...anchors, [floorId]: next as FloorGeoAnchors };
      setAnchors(all);
      setPicking([]);
      console.log(`[FLOOR_ANCHORS] ${JSON.stringify(all)}`);
    },
    [done, picking, floorId, anchors],
  );

  const undo = useCallback(() => {
    if (picking.length > 0) {
      setPicking(prev => prev.slice(0, -1));
      return;
    }
    // 이미 다 찍은 층이면 마지막 모서리만 되돌려서 다시 찍게 한다.
    const saved = anchors[floorId];
    if (!saved) return;
    setAnchors(prev => {
      const next = { ...prev };
      delete next[floorId];
      return next;
    });
    setPicking(saved.slice(0, 3));
  }, [picking, anchors, floorId]);

  const reset = useCallback(() => {
    setAnchors(prev => {
      const next = { ...prev };
      delete next[floorId];
      return next;
    });
    setPicking([]);
    console.log(`[FLOOR_PIN] ${floorId} 다시 찍기`);
  }, [floorId]);

  return {
    active,
    toggle: () => setActive(prev => !prev),
    floorId,
    selectFloor: (id: string) => {
      setFloorId(id);
      setPicking([]);
    },
    anchors,
    picking,
    done,
    handleTap,
    undo,
    reset,
  };
}

type FloorOverlayPicker = ReturnType<typeof useDevFloorOverlay>;

/** 선택한 층의 방 폴리곤 + 찍는 중인 모서리 마커. NaverMapView의 children으로 넣는다. */
export function DevFloorOverlayLayer({ picker }: { picker: FloorOverlayPicker }) {
  const { active, floorId, anchors, picking } = picker;
  const floorAnchors = anchors[floorId];
  const overlayImage = getFreshOverlayImage(floorId, floorAnchors);

  const shapes = useMemo(() => {
    if (!floorAnchors || overlayImage) return null;
    const data = FLOOR_MAPS[floorId]().data;
    const toGeo = createFloorToGeo(getContentBounds(data), floorAnchors);
    return data.rooms.map(room => {
      const [cx, cy] =
        room.labelAnchor ??
        room.points
          .reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0])
          .map(v => v / room.points.length);
      return {
        id: room.id,
        label: room.label ?? room.id,
        coords: room.points.map(([x, y]) => toGeo(x, y)),
        center: toGeo(cx, cy),
      };
    });
  }, [floorId, floorAnchors, overlayImage]);

  if (!active) return null;

  return (
    <>
      {overlayImage && (
        <NaverMapGroundOverlay
          key={`dev-floor-image-${floorId}`}
          image={overlayImage.image}
          region={overlayImage.region}
          zIndex={1}
        />
      )}
      {floorAnchors && (
        <NaverMapPolygonOverlay
          coords={floorAnchors}
          color="rgba(0, 0, 0, 0)"
          outlineColor="#FF3B30"
          outlineWidth={2}
          zIndex={2}
        />
      )}
      {shapes?.map(shape => (
        <NaverMapPolygonOverlay
          key={`dev-floor-${floorId}-${shape.id}`}
          coords={shape.coords}
          color="rgba(0, 122, 255, 0.25)"
          outlineColor="#007AFF"
          outlineWidth={1}
          zIndex={3}
        />
      ))}
      {shapes?.map(shape =>
        shape.label ? (
          <NaverMapMarkerOverlay
            key={`dev-floor-label-${floorId}-${shape.id}`}
            latitude={shape.center.latitude}
            longitude={shape.center.longitude}
            width={shape.label.length * 8 + 8}
            height={16}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={4}
          >
            <View key={shape.label} collapsable={false} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#003E80' }}>{shape.label}</Text>
            </View>
          </NaverMapMarkerOverlay>
        ) : null,
      )}
      {picking.map((coord, i) => (
        <NaverMapMarker
          key={`dev-floor-pin-${i}`}
          latitude={coord.latitude}
          longitude={coord.longitude}
          label={CORNER_LABELS[i]}
          zIndex={10}
        />
      ))}
    </>
  );
}

/** 토글 버튼 + 모드가 켜졌을 때 상단 층 선택/조작 패널. 지도 위(NaverMapView 형제)에 absolute로 얹는다. */
export function DevFloorOverlayPanel({ picker, topInset }: { picker: FloorOverlayPicker; topInset: number }) {
  if (!__DEV__) return null;
  const { active, floorId, picking, done } = picker;

  return (
    <>
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
                  {picker.anchors[id] ? ' ✓' : ''}
                </PanelButtonText>
              </PanelButton>
            ))}
          </ButtonRow>
          <PanelTitle>
            {done
              ? getFreshOverlayImage(floorId, picker.anchors[floorId])
                ? `${floorId} 평면도를 얹었어요`
                : `${floorId} 방 도형만 그렸어요 — 로그를 floorGeoAnchors.json에 넣고 renderFloorOverlay.js를 돌리면 평면도가 얹혀요`
              : `${floorId} 도면 ${CORNER_LABELS[picking.length]} 모서리를 탭하세요 (${picking.length + 1}/4)`}
          </PanelTitle>
          <ButtonRow>
            <PanelButton onPress={picker.undo} disabled={!done && picking.length === 0}>
              <PanelButtonText>되돌리기</PanelButtonText>
            </PanelButton>
            <PanelButton onPress={picker.reset} disabled={!done && picking.length === 0}>
              <PanelButtonText>다시 찍기</PanelButtonText>
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
