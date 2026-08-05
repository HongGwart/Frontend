import React, { Children, Fragment, cloneElement, isValidElement, useCallback, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { RoomPolygons } from './RoomPolygons';
import { IconMarkersLayer } from './IconMarkersLayer';
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
   * 배경(Visual) 레이어. 벽/방 박스/번호 라벨처럼 하이라이트보다 "아래"에
   * 있어야 하는 것들. width/height는 mapData와 반드시 동일해야 좌표계가 맞는다.
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
}

export function IndoorMapView({
  mapData,
  renderBackground,
  renderForeground,
  onRoomSelect,
  minScale = 1,
  maxScale = 5,
  iconSize,
}: Props) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const handleRoomTap = useCallback(
    (room: RoomShape) => {
      setSelectedRoomId((prev) => {
        const next = prev === room.id ? null : room.id;
        onRoomSelect?.(next ? room : null);
        return next;
      });
    },
    [onRoomSelect]
  );

  const { composedGesture, animatedStyle, fitToContainer, scale, translateX, translateY } = useMapGestures({
    rooms: mapData.rooms,
    onRoomTap: handleRoomTap,
    mapWidth: mapData.width,
    mapHeight: mapData.height,
    minScale,
    maxScale,
  });

  const size = { width: mapData.width, height: mapData.height };

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
            width={mapData.width}
            height={mapData.height}
            rooms={mapData.rooms}
            selectedRoomId={selectedRoomId}
          />
          {renderForeground && <AbsoluteLayer>{renderForeground(size)}</AbsoluteLayer>}
        </Animated.View>
      </GestureDetector>
      {/*
        mapLayer 밖(=scale transform이 안 걸리는 곳)에 별도 오버레이로 둔다. 아이콘은
        "지도 위에 그려진 그림"이 아니라 "지도 좌표에 꽂힌 핀"이어야 확대해도 크기가 고정된
        네이버지도식 마커가 된다. 위치 계산은 마커 내부에서 mapLayer와 동일한
        translate + mapCoord * scale 공식을 그대로 재사용한다.
      */}
      <IconMarkersLayer
        icons={mapData.icons ?? []}
        scale={scale}
        translateX={translateX}
        translateY={translateY}
        size={iconSize}
      />
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