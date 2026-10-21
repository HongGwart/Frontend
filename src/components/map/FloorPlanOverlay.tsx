import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import {
  NaverMapGroundOverlay,
  NaverMapMarkerOverlay,
  NaverMapPolygonOverlay,
} from '@mj-studio/react-native-naver-map';
import { getBuildingMask } from '@constant/buildingMasks';
import { FLOOR_MAPS, parseFloorId } from '@constant/floorMaps';
import { FLOOR_OVERLAY_IMAGES, FloorOverlayIconType, FloorOverlayImage } from '@constant/floorOverlayImages';
import { createFloorToGeo, FloorGeoAnchors, GeoCoord, getContentBounds } from '@utils/floorGeoTransform';
import { theme } from '@theme/color';
import ElevatorIcon from '@assets/svgs/icons/elevator.svg';
import StairsIcon from '@assets/svgs/icons/stairs.svg';
import MapElevatorIcon from '@assets/svgs/mapIcon/map_elevator.svg';
import MapStairsIcon from '@assets/svgs/mapIcon/map_stairs.svg';
import MapToiletFemaleIcon from '@assets/svgs/mapIcon/map_toilet_female.svg';
import MapToiletMaleIcon from '@assets/svgs/mapIcon/map_toilet_male.svg';

/** 개발 서버가 방금 구워서 httpUri로 바로 띄우는 평면도 (앱에 번들된 PNG가 HMR로 들어오기 전까지 쓴다) */

const ICON_BOX = 22;
// PNG에서 뺀 엘리베이터/계단/화장실 아이콘 — 도면 PNG에 그려져 있던 것과 같은 그림(내부지도 뷰 아이콘)을 쓴다.
const MAP_ICON_BY_TYPE: Record<FloorOverlayIconType, React.FC<{ width: number; height: number }>> = {
  elevator: MapElevatorIcon,
  stairs: MapStairsIcon,
  toilet_female: MapToiletFemaleIcon,
  toilet_male: MapToiletMaleIcon,
};
const MAP_ICON_SIZE = 20;
// 도면 아이콘은 실제 1m 남짓이라 방 번호처럼 "들어갈 때부터" 보이게 하면 거의 안 보인다. 평면도를 알아볼 만큼
// 확대했을 때부터 보이게 고정 줌으로 정한다.
const MAP_ICON_MIN_ZOOM = 18;
// 호수 라벨 글자 크기(pt)와, 방 안에 들어가는지 볼 때 쓰는 글자 한 개 폭/위아래 높이 어림값(pt)
const LABEL_FONT_SIZE = 11;
const LABEL_CHAR_WIDTH = 6.5;
const LABEL_LINE_HEIGHT = 13;
// PNG 위 라벨은 내부지도 뷰(RoomLabelsLayer)와 같은 검정, PNG 없이 파란 방 도형 위에 그릴 땐 파랑.
const LABEL_TEXT_STYLE = { fontSize: LABEL_FONT_SIZE, fontWeight: '500', color: '#000000' } as const;
const FALLBACK_LABEL_TEXT_STYLE = { fontSize: LABEL_FONT_SIZE, fontWeight: '600', color: '#003E80' } as const;
// 강조한 방(검색한 호실)은 내부지도 뷰(RoomPolygons·RoomLabelsLayer)와 같게 브랜드 남색으로 불투명하게 칠하고 번호는 흰색.
const HIGHLIGHT_FILL = theme.blue[800];
const HIGHLIGHT_LABEL_TEXT_STYLE = { fontSize: LABEL_FONT_SIZE, fontWeight: '500', color: '#FFFFFF' } as const;
// 네이버 지도 폴리곤은 outlineWidth=0이 반영되지 않는 버그가 있어 테두리를 투명색으로 지운다.
const NO_OUTLINE = 'rgba(0, 0, 0, 0)';
// 건물 덮개(buildingMasks.ts): 네이버 지도 캠퍼스 바닥색으로 칠해 그 건물의 네이버 윤곽만 가린다. 찍은 모서리보다
// 테두리 두께(화면 px)만큼 넓게 칠해 네이버 건물 테두리 선까지 덮는다. 평면도 PNG(GroundOverlay 기본 전역 z
// -300000)보다 아래, 바탕 지도보다는 위에 깔린다.
const BUILDING_MASK_COLOR = '#EEF1F6';
const BUILDING_MASK_SPREAD_PX = 4;
const BUILDING_MASK_GLOBAL_Z = -310000;
// 방 도형 폴리곤을 경로선(폴리라인, 같은 기본 전역 z -200000)보다 아래, 평면도 PNG(GroundOverlay -300000)보다
// 위에 깐다. 이걸 안 주면 zIndex가 같은 전역 층에서 비교돼서 방 도형이 길찾기 경로선을 덮는다.
const FLOOR_SHAPE_GLOBAL_Z = -250000;

// 기준점이 이만큼(위경도 도 단위, 약 0.1m) 안에서 같으면 같은 위치로 본다. 서버 기준점으로 앱에서 계산한 값과
// PNG를 구울 때 스크립트로 계산한 값은 같은 식이어도 부동소수점 끝자리가 다를 수 있다.
const SAME_ANCHOR_EPSILON = 1e-6;
const sameAnchors = (a: FloorGeoAnchors, b: FloorGeoAnchors) =>
  a.every(
    (point, i) =>
      Math.abs(point.latitude - b[i].latitude) < SAME_ANCHOR_EPSILON &&
      Math.abs(point.longitude - b[i].longitude) < SAME_ANCHOR_EPSILON,
  );

/**
 * 이 층에 지금 기준점으로 구운 평면도 PNG가 있으면 돌려준다. 서버 기준점이 바뀌어 PNG를 구울 때와 다르면
 * 낡은 PNG라 안 쓴다(scripts/renderFloorOverlay.js로 다시 구워야 한다).
 */
export function getFreshOverlayImage(
  floorId: string,
  anchors: FloorGeoAnchors | undefined,
): FloorOverlayImage | null {
  if (!anchors) return null;
  const bundled = FLOOR_OVERLAY_IMAGES[floorId];
  return bundled && sameAnchors(bundled.anchors, anchors) ? bundled : null;
}

// 줌 0에서 지구 둘레(m)가 화면 256pt에 들어간다. 줌이 1 오를 때마다 2배 확대.
const EARTH_CIRCUMFERENCE_M = 40075016.686;
const METERS_PER_DEGREE_LAT = 111320;

/**
 * 라벨 중심을 지나는 가로/세로 선이 방 도형 안에 걸치는 길이(m). 방이 기울어 있어도 화면에 똑바로 선 글자가
 * 실제로 차지하는 방향(가로·세로)으로 잰다. 중심이 도형 밖이면 0.
 */
function chordLengths(coords: GeoCoord[], center: GeoCoord) {
  const cosLat = Math.cos((center.latitude * Math.PI) / 180);
  const pts = coords.map(p => [
    (p.longitude - center.longitude) * METERS_PER_DEGREE_LAT * cosLat,
    (p.latitude - center.latitude) * METERS_PER_DEGREE_LAT,
  ]);
  // 중심(0, 0)을 지나는 축 위에서 변들과 만나는 점들을 모아, 0을 감싸는 구간 길이를 구한다.
  const chord = (axis: 0 | 1) => {
    const other = axis === 0 ? 1 : 0;
    const hits: number[] = [];
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length];
      if (a[other] > 0 === b[other] > 0) return;
      hits.push(a[axis] + ((b[axis] - a[axis]) * -a[other]) / (b[other] - a[other]));
    });
    const lower = Math.max(...hits.filter(h => h <= 0), -Infinity);
    const upper = Math.min(...hits.filter(h => h >= 0), Infinity);
    return Number.isFinite(lower) && Number.isFinite(upper) ? upper - lower : 0;
  };
  return { width: chord(0), height: chord(1), cosLat };
}

/**
 * 이 줌보다 축소하면 글자가 방보다 커서 삐져나오므로 숨긴다. 글자는 줌과 상관없이 화면 크기가 같고 방은
 * 축소할수록 작아지니, 방의 가로·세로가 글자 폭·높이 이상이 되는 가장 낮은 줌을 구한다.
 */
function labelMinZoom(coords: GeoCoord[], center: GeoCoord, label: string) {
  const { width, height, cosLat } = chordLengths(coords, center);
  if (width <= 0 || height <= 0) return Infinity;
  const metersPerPtAtZoom0 = (EARTH_CIRCUMFERENCE_M * cosLat) / 256;
  const zoomToFit = (meters: number, pt: number) => Math.log2((metersPerPtAtZoom0 * pt) / meters);
  return Math.max(zoomToFit(width, label.length * LABEL_CHAR_WIDTH), zoomToFit(height, LABEL_LINE_HEIGHT));
}

interface Props {
  floorId: string;
  anchors: FloorGeoAnchors | undefined;
  /** 강조할 방 id들(같은 번호로 나뉜 조각 전부). 내부지도 뷰에서 방을 고른 것과 같은 모양으로 칠한다 */
  highlightRoomIds?: string[];
  /** 건물 덮개를 깔지 않는다(덮개 찍기 모드: 네이버 건물이 보여야 모서리를 찍을 수 있다) */
  hideBuildingMask?: boolean;
}

/**
 * [개발용] 층 평면도를 네이버 지도 위에 그린다. renderFloorOverlay.js로 구운 PNG가 지금 기준점과 맞으면
 * 그 PNG를 GroundOverlay로 얹고, 없거나 낡았으면(PNG를 굽는 중이거나 개발 서버가 없을 때) 방 도형 폴리곤 +
 * 계단/엘리베이터 아이콘으로 대신 그린다.
 * 호수 라벨과 엘리베이터/계단/화장실 아이콘은 마커로 따로 그린다 — PNG는 건물 기울기만큼 돌려 구워서 글자·
 * 아이콘을 넣으면 같이 기울어지므로, 내부지도 뷰처럼 위치만 도면을 따라가고 그림은 항상 똑바로 보이게 한다.
 * 기준점이 없는 층은 아무것도 안 그린다. NaverMapView의 children으로 넣는다.
 */
export function FloorPlanOverlay({
  floorId,
  anchors,
  highlightRoomIds,
  hideBuildingMask = false,
}: Props) {
  const overlayImage = getFreshOverlayImage(floorId, anchors);
  const hasImage = Boolean(overlayImage);

  const floor = useMemo(() => {
    if (!anchors) return null;
    const data = FLOOR_MAPS[floorId]().data;
    const toGeo = createFloorToGeo(getContentBounds(data), anchors);
    const icons = (data.icons ?? []).map(icon => ({ ...icon, position: toGeo(icon.center[0], icon.center[1]) }));
    const rooms = data.rooms.map(room => {
      const [cx, cy] =
        room.labelAnchor ??
        room.points
          .reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0])
          .map(v => v / room.points.length);
      const label = room.label ?? room.id;
      const coords = room.points.map(([x, y]) => toGeo(x, y));
      const center = toGeo(cx, cy);
      return { id: room.id, label, coords, center, minZoom: label ? labelMinZoom(coords, center, label) : Infinity };
    });
    return { rooms, icons, toGeo };
  }, [floorId, anchors]);
  const labels = floor?.rooms;
  const isHighlighted = (id: string) => !!highlightRoomIds?.includes(id);
  const highlighted = floor?.rooms.filter(room => isHighlighted(room.id));
  // PNG가 있으면 방 도형은 PNG에 그려져 있고, 아이콘은 PNG를 구울 때 빼서 위치만 남겨 둔 것을 마커로 그린다.
  const shapes = hasImage ? undefined : floor?.rooms;
  const icons = hasImage ? undefined : floor?.icons;
  const overlayIcons = overlayImage?.icons;
  const mapIcons = useMemo(
    () =>
      floor && overlayIcons
        ? overlayIcons.map((icon, index) => ({
            key: `${icon.type}-${index}`,
            type: icon.type,
            position: floor.toGeo(icon.center[0], icon.center[1]),
          }))
        : undefined,
    [floor, overlayIcons],
  );

  const buildingMask = hideBuildingMask || !anchors ? undefined : getBuildingMask(parseFloorId(floorId).building);

  return (
    <>
      {buildingMask && (
        <NaverMapPolygonOverlay
          key={`floor-mask-${floorId}`}
          coords={buildingMask}
          color={BUILDING_MASK_COLOR}
          outlineColor={BUILDING_MASK_COLOR}
          outlineWidth={BUILDING_MASK_SPREAD_PX}
          globalZIndex={BUILDING_MASK_GLOBAL_Z}
        />
      )}
      {overlayImage && (
        <NaverMapGroundOverlay
          key={`floor-image-${floorId}`}
          image={overlayImage.image}
          region={overlayImage.region}
          zIndex={1}
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
      {highlighted?.map(room => (
        <NaverMapPolygonOverlay
          key={`floor-highlight-${floorId}-${room.id}`}
          coords={room.coords}
          color={HIGHLIGHT_FILL}
          outlineColor={NO_OUTLINE}
          globalZIndex={FLOOR_SHAPE_GLOBAL_Z}
          zIndex={3}
        />
      ))}
      {labels?.map(room =>
        room.label && Number.isFinite(room.minZoom) ? (
          <NaverMapMarkerOverlay
            key={`floor-label-${floorId}-${room.id}${isHighlighted(room.id) ? '-on' : ''}`}
            latitude={room.center.latitude}
            longitude={room.center.longitude}
            width={room.label.length * 8 + 8}
            height={16}
            anchor={{ x: 0.5, y: 0.5 }}
            // 축소해서 글자가 방보다 커지면 숨긴다(방마다 다르다).
            // 강조한 방 번호는 줌과 상관없이 보인다.
            minZoom={isHighlighted(room.id) ? 0 : room.minZoom}
            zIndex={4}
          >
            <View key={room.label} collapsable={false} style={{ alignItems: 'center' }}>
              <Text
                style={
                  isHighlighted(room.id)
                    ? HIGHLIGHT_LABEL_TEXT_STYLE
                    : hasImage
                      ? LABEL_TEXT_STYLE
                      : FALLBACK_LABEL_TEXT_STYLE
                }
              >
                {room.label}
              </Text>
            </View>
          </NaverMapMarkerOverlay>
        ) : null,
      )}
      {mapIcons?.map(icon => {
        const Icon = MAP_ICON_BY_TYPE[icon.type];
        return (
          <NaverMapMarkerOverlay
            key={`floor-map-icon-${floorId}-${icon.key}`}
            latitude={icon.position.latitude}
            longitude={icon.position.longitude}
            width={MAP_ICON_SIZE}
            height={MAP_ICON_SIZE}
            anchor={{ x: 0.5, y: 0.5 }}
            minZoom={MAP_ICON_MIN_ZOOM}
            zIndex={5}
          >
            <View key={icon.type} collapsable={false}>
              <Icon width={MAP_ICON_SIZE} height={MAP_ICON_SIZE} />
            </View>
          </NaverMapMarkerOverlay>
        );
      })}
      {icons?.map(icon => {
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
