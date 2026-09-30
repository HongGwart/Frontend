import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import {
  NaverMapGroundOverlay,
  NaverMapMarkerOverlay,
  NaverMapPolygonOverlay,
} from '@mj-studio/react-native-naver-map';
import { FloorMapData } from '@appTypes/room';
import { FLOOR_MAPS } from '@constant/floorMaps';
import { FLOOR_OVERLAY_IMAGES, FloorOverlayImage } from '@constant/floorOverlayImages';
import { createFloorToGeo, FloorGeoAnchors } from '@utils/floorGeoTransform';
import ElevatorIcon from '@assets/svgs/icons/elevator.svg';
import StairsIcon from '@assets/svgs/icons/stairs.svg';

/** 개발 서버가 방금 구워서 httpUri로 바로 띄우는 평면도 (앱에 번들된 PNG가 HMR로 들어오기 전까지 쓴다) */
export type LiveFloorImage = Omit<FloorOverlayImage, 'image'> & { image: { httpUri: string } };

const ICON_BOX = 22;
// 방 도형 폴리곤을 경로선(폴리라인, 같은 기본 전역 z -200000)보다 아래, 평면도 PNG(GroundOverlay -300000)보다
// 위에 깐다. 이걸 안 주면 zIndex가 같은 전역 층에서 비교돼서 방 도형이 길찾기 경로선을 덮는다.
const FLOOR_SHAPE_GLOBAL_Z = -250000;

/** contentBounds가 없는 층은 방 좌표로 바운딩 박스를 계산한다. */
function getContentBounds(data: FloorMapData) {
  if (data.contentBounds) return data.contentBounds;
  const xs = data.rooms.flatMap(r => r.points.map(p => p[0]));
  const ys = data.rooms.flatMap(r => r.points.map(p => p[1]));
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

const sameAnchors = (a: FloorGeoAnchors, b: FloorGeoAnchors) => JSON.stringify(a) === JSON.stringify(b);

/**
 * 이 층에 지금 기준점으로 구운 평면도 PNG가 있으면 돌려준다 — 번들된 PNG 우선, 없으면 개발 서버가 방금 구운 것.
 * 기준점을 다시 찍었으면 둘 다 낡은 PNG라 안 쓴다.
 */
export function getFreshOverlayImage(
  floorId: string,
  anchors: FloorGeoAnchors | undefined,
  liveImage?: LiveFloorImage,
): FloorOverlayImage | LiveFloorImage | null {
  if (!anchors) return null;
  const bundled = FLOOR_OVERLAY_IMAGES[floorId];
  if (bundled && sameAnchors(bundled.anchors, anchors)) return bundled;
  if (liveImage && sameAnchors(liveImage.anchors, anchors)) return liveImage;
  return null;
}

interface Props {
  floorId: string;
  anchors: FloorGeoAnchors | undefined;
  /** 기준점 네 모서리를 이은 빨간 테두리를 같이 그릴지 (평면도 앉히기 모드에서 위치 비교용) */
  showAnchorOutline?: boolean;
  liveImage?: LiveFloorImage;
}

/**
 * [개발용] 층 평면도를 네이버 지도 위에 그린다. renderFloorOverlay.js로 구운 PNG가 지금 기준점과 맞으면
 * 그 PNG를 GroundOverlay로 얹고, 없거나 낡았으면(PNG를 굽는 중이거나 개발 서버가 없을 때) 방 도형 폴리곤 +
 * 호수 라벨 + 계단/엘리베이터 아이콘으로 대신 그린다.
 * 기준점이 없는 층은 아무것도 안 그린다. NaverMapView의 children으로 넣는다.
 */
export function FloorPlanOverlay({ floorId, anchors, showAnchorOutline = false, liveImage }: Props) {
  const overlayImage = getFreshOverlayImage(floorId, anchors, liveImage);
  const hasImage = Boolean(overlayImage);

  const fallback = useMemo(() => {
    if (!anchors || hasImage) return null;
    const data = FLOOR_MAPS[floorId]().data;
    const toGeo = createFloorToGeo(getContentBounds(data), anchors);
    const icons = (data.icons ?? []).map(icon => ({ ...icon, position: toGeo(icon.center[0], icon.center[1]) }));
    const rooms = data.rooms.map(room => {
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
    return { rooms, icons };
  }, [floorId, anchors, hasImage]);
  const shapes = fallback?.rooms;

  return (
    <>
      {overlayImage && (
        <NaverMapGroundOverlay
          key={`floor-image-${floorId}-${typeof overlayImage.image === 'number' ? 'bundled' : overlayImage.image.httpUri}`}
          image={overlayImage.image}
          region={overlayImage.region}
          zIndex={1}
        />
      )}
      {showAnchorOutline && anchors && (
        <NaverMapPolygonOverlay
          coords={anchors}
          color="rgba(0, 0, 0, 0)"
          outlineColor="#FF3B30"
          outlineWidth={2}
          globalZIndex={FLOOR_SHAPE_GLOBAL_Z}
          zIndex={2}
        />
      )}
      {shapes?.map(shape => (
        <NaverMapPolygonOverlay
          key={`floor-${floorId}-${shape.id}`}
          coords={shape.coords}
          color="rgba(0, 122, 255, 0.25)"
          outlineColor="#007AFF"
          outlineWidth={1}
          globalZIndex={FLOOR_SHAPE_GLOBAL_Z}
          zIndex={3}
        />
      ))}
      {shapes?.map(shape =>
        shape.label ? (
          <NaverMapMarkerOverlay
            key={`floor-label-${floorId}-${shape.id}`}
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
      {fallback?.icons.map(icon => {
        const Icon = icon.type === 'elevator' ? ElevatorIcon : StairsIcon;
        return (
          <NaverMapMarkerOverlay
            key={`floor-icon-${floorId}-${icon.id}`}
            latitude={icon.position.latitude}
            longitude={icon.position.longitude}
            width={ICON_BOX}
            height={ICON_BOX}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={5}
          >
            <View
              key={icon.type}
              collapsable={false}
              style={{
                width: ICON_BOX,
                height: ICON_BOX,
                borderRadius: 4,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Icon width={ICON_BOX - 4} height={ICON_BOX - 4} color="#1D2056" />
            </View>
          </NaverMapMarkerOverlay>
        );
      })}
    </>
  );
}
