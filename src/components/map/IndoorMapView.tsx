import React, { Children, Fragment, cloneElement, isValidElement, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { RoomPolygons } from './RoomPolygons';
import { IconMarkersLayer } from './IconMarkersLayer';
import { RoomLabelsLayer } from './RoomLabelsLayer';
import { ResetViewButton } from './ResetViewButton';
import { FloorMapData, RoomShape } from '@appTypes/room';
import { useMapGestures } from '@hooks/map/useMapGestures';


/**
 * renderBackground/renderForeground가 Fragment로 여러 개의 형제 엘리먼트(예: <VisualDoors/> +
 * <VisualIcons/>)를 반환하면, RN View의 기본 세로 flex 레이아웃 때문에 두 번째 자식이
 * 첫 번째 자식의 높이만큼 아래로 밀려서 렌더링된다. 각 최상위 자식에 absolute 포지션을
 * 직접 주입해서 항상 서로 완전히 겹치게 만든다.
 */
type StyleableElement = React.ReactElement<{
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}>;

/**
 * `<>{a}{b}</>`로 넘어온 값은 React 트리 상에서 Fragment 엘리먼트 "하나"이지, a/b 두 개가
 * 아니다. Children.map이 그 Fragment 자체를 순회 대상으로 넘겨주기 때문에 cloneElement로
 * style/pointerEvents를 주입해도 Fragment는 key/children 외의 prop을 전부 무시해서
 * absolute 포지션이 조용히 사라지고, 그 안의 자식들은 다시 기본 flex 세로 배치로 쌓인다.
 * Fragment를 만나면 그 children을 재귀적으로 펼쳐서 실제 렌더링 가능한 엘리먼트만 모은다.
 */
function flattenChildren(children: React.ReactNode): React.ReactElement[] {
  const result: React.ReactElement[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Fragment) {
      const fragmentProps = child.props as { children?: React.ReactNode };
      result.push(...flattenChildren(fragmentProps.children));
    } else {
      result.push(child);
    }
  });
  return result;
}

/**
 * mapLayer(배경 SVG + RoomPolygons)를 실제로 그릴 때 이 dp를 넘지 않도록 캡한다. Android는
 * View를 화면에 합성하기 전에 "레이아웃 dp × 화면 밀도"만큼 캔버스를 먼저 할당하는데, C/K동처럼
 * 도면이 큰 층(2200dp 이상)은 고밀도(xxhdpi 등) 기기에서 그 캔버스가 Android의 하드 리밋인
 * 100MB(RecordingCanvas.MAX_BITMAP_SIZE)를 넘어 크래시가 난다. 방/문/벽은 전부 벡터(SVG path)라
 * dp를 줄이고 나중에 pinch-zoom transform으로 다시 확대해도 화질 손실이 없어서, 렌더링 dp
 * 자체를 이 값 이하로 캡하고 viewBox로 원본 좌표계를 유지하는 쪽을 택했다.
 */
const MAX_RENDER_DP = 1000;

function AbsoluteLayer({ children }: { children: React.ReactNode }) {
  return (
    <>
      {flattenChildren(children).map((child, index) => {
        // .svg 모듈 타입 선언이 프로젝트마다 달라서(웹용 CSSProperties인 경우도 있음) 실제
        // react-native-svg 컴포넌트가 받는 style 형태(StyleProp<ViewStyle>, 배열 포함)로 명시 캐스팅한다.
        const styleable = child as StyleableElement;
        return cloneElement(styleable, {
          key: styleable.key ?? index,
          style: [styles.layer, styleable.props.style],
          pointerEvents: 'none',
        });
      })}
    </>
  );
}

interface Props {
  mapData: FloorMapData;
  /**
   * 배경(Visual) 레이어. 벽/방 박스처럼 하이라이트보다 "아래"에 있어야 하는 것들.
   * width/height는 mapData와 반드시 동일해야 좌표계가 맞는다. 방 번호 라벨은 여기 넣지 않는다 —
   * 지도가 회전해도 글자는 안 돌아야 해서 RoomLabelsLayer가 mapData.rooms로 따로 그린다.
   */
  renderBackground: (size: { width: number; height: number }) => React.ReactNode;
  /**
   * 문/계단·엘리베이터 아이콘처럼 하이라이트보다 "위"에 그려야 하는 레이어.
   * 방 하이라이트는 사각형이라 문이 있는 모서리까지 덮어버리는데, 문을 이 slot에
   * 넣어 하이라이트 위에 다시 그려주면 폴리곤을 문 모양으로 오려낼 필요 없이
   * 문 부분만 원래 색으로 보인다. 기존 VisualDoors/VisualIcons 컴포넌트를 그대로 넣으면 됨.
   */
  renderForeground?: (size: { width: number; height: number }) => React.ReactNode;
  onRoomSelect?: (room: RoomShape | null) => void;
  minScale?: number;
  maxScale?: number;
  /** 계단/엘리베이터 마커의 고정 화면 픽셀 크기 (확대/축소해도 안 바뀜). 생략 시 IconMarkersLayer 기본값 */
  iconSize?: number;
  /** 방 번호 라벨의 고정 폰트 크기 (확대/축소해도 안 바뀜). 생략 시 RoomLabelsLayer 기본값 */
  labelFontSize?: number;
}

export function IndoorMapView({
  mapData,
  renderBackground,
  renderForeground,
  onRoomSelect,
  minScale = 1,
  maxScale = 1.5,
  iconSize,
  labelFontSize = 5,
}: Props) {
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  // label을 ""로 비워둔 방(화장실처럼 배경에 이미 아이콘이 있거나, 아직 번호를 못 붙인 방)은
  // 강의실이 아니므로 탭해도 하이라이팅되면 안 된다. findRoomAtPoint에 애초에 이 방들을
  // 안 넘겨서 히트테스트 자체가 통과하지 않게 막는다 (RoomLabelsLayer가 라벨을 숨기는 것과
  // 같은 label !== '' 기준을 그대로 재사용).
  const selectableRooms = useMemo(
    () => mapData.rooms.filter((room) => room.label !== ''),
    [mapData.rooms]
  );

  // SVG 캔버스(mapData.width/height)는 도면 크기와 무관하게 항상 같은 크기라, 그대로
  // fitToContainer 기준으로 쓰면 도면이 캔버스보다 훨씬 작은 층은 여백이 크게 남는다.
  // 실제로 그려진 방/아이콘들의 바운딩 박스(=네이비 테두리 도면 영역)를 직접 구해서 넘긴다.
  const contentBounds = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const room of mapData.rooms) {
      for (const [x, y] of room.points) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    for (const icon of mapData.icons ?? []) {
      const half = icon.size / 2;
      const [cx, cy] = icon.center;
      if (cx - half < minX) minX = cx - half;
      if (cx + half > maxX) maxX = cx + half;
      if (cy - half < minY) minY = cy - half;
      if (cy + half > maxY) maxY = cy + half;
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
      return { minX: 0, minY: 0, width: mapData.width, height: mapData.height };
    }
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }, [mapData.rooms, mapData.icons, mapData.width, mapData.height]);

  const handleMapTap = useCallback(
    (room: RoomShape | null) => {
      setSelectedRoomIds((prev) => {
        // 빈 공간을 탭하면 room이 null로 들어와서 무조건 선택 해제.
        // 이미 선택된 방을 다시 탭하면 토글 해제, 다른 방을 탭하면 그 방으로 교체.
        // 같은 라벨(room.label ?? room.id)을 공유하는 방이 여러 개 있으면(하나의 강의실이
        // 도면상 두 조각으로 나뉜 경우 등) 전부 같이 선택해서 한 번에 하이라이트한다.
        const wasSelected = room && prev.includes(room.id);
        if (!room || wasSelected) {
          if (prev.length > 0) onRoomSelect?.(null);
          return [];
        }
        const targetLabel = room.label ?? room.id;
        const group = selectableRooms
          .filter((r) => (r.label ?? r.id) === targetLabel)
          .map((r) => r.id);
        onRoomSelect?.(room);
        return group;
      });
    },
    [onRoomSelect, selectableRooms]
  );

  // 긴 변이 MAX_RENDER_DP를 넘는 층만 축소해서 그린다 (대부분의 층은 1을 넘지 않으므로 그대로).
  const renderScale = useMemo(
    () => Math.min(1, MAX_RENDER_DP / Math.max(mapData.width, mapData.height)),
    [mapData.width, mapData.height]
  );

  const {
    composedGesture,
    animatedStyle,
    fitToContainer,
    resetTransform,
    scale,
    translateX,
    translateY,
    rotation,
  } = useMapGestures({
    rooms: selectableRooms,
    onMapTap: handleMapTap,
    mapWidth: mapData.width,
    mapHeight: mapData.height,
    contentBounds,
    minScale,
    maxScale,
    renderScale,
  });

  // mapLayer(Animated.View)와 그 안의 배경 SVG에 실제로 넘길 dp 크기. renderScale이 1이면
  // 기존과 동일하게 원본 크기 그대로다.
  const size = {
    width: mapData.width * renderScale,
    height: mapData.height * renderScale,
  };

  const handleContainerLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      fitToContainer(width, height);
    },
    [fitToContainer]
  );

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[size, styles.mapLayer, animatedStyle]}>
          <AbsoluteLayer>{renderBackground(size)}</AbsoluteLayer>
          <RoomPolygons
            width={size.width}
            height={size.height}
            viewBoxWidth={mapData.width}
            viewBoxHeight={mapData.height}
            rooms={mapData.rooms}
            selectedRoomIds={selectedRoomIds}
          />
          {renderForeground && <AbsoluteLayer>{renderForeground(size)}</AbsoluteLayer>}
        </Animated.View>
      </GestureDetector>
      {/*
        mapLayer 밖(=scale/rotate transform이 안 걸리는 곳)에 별도 오버레이로 둔다. 아이콘·라벨은
        "지도 위에 그려진 그림"이 아니라 "지도 좌표에 꽂힌 핀"이어야 지도를 돌리거나 확대해도
        위치만 따라가고 그림/글자 자체는 그대로다. 위치 계산은 각 레이어 내부에서 mapLayer와
        동일한 translate + Rotate(rotation) * (mapCoord * scale) 공식을 그대로 재사용한다.
      */}
      <IconMarkersLayer
        icons={mapData.icons ?? []}
        scale={scale}
        translateX={translateX}
        translateY={translateY}
        rotation={rotation}
        size={iconSize}
      />
      <RoomLabelsLayer
        rooms={mapData.rooms}
        scale={scale}
        translateX={translateX}
        translateY={translateY}
        rotation={rotation}
        fontSize={labelFontSize}
        selectedRoomIds={selectedRoomIds}
      />
      <ResetViewButton rotation={rotation} onPress={resetTransform} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  mapLayer: {
    // scale의 기준점을 RN 기본값(중심)이 아니라 좌상단으로 고정.
    // fitToContainer/useMapGestures의 translateX/Y 계산이 좌상단 기준 scale을 가정하므로 필수.
    transformOrigin: '0 0',
  },
});