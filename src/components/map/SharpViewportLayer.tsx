import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { RoomShape } from '@appTypes/room';
import { useSettledViewport, type MapTransform } from '@hooks/map/useSharpViewport';
import { RoomPolygons } from './RoomPolygons';

/**
 * IndoorMapView의 renderBackground/renderForeground가 받는 값. viewBox가 있으면 원본 SVG 중 그 영역만
 * 이 크기로 그려야 한다(이 덮개 레이어). SVG 컴포넌트에 {...size}로 그대로 펼쳐 넘긴다 — 기본 레이어에서는
 * viewBox 키 자체가 없어서 SVG 원래 viewBox가 유지된다.
 */
export interface LayerSize {
  width: number;
  height: number;
  viewBox?: string;
}

interface Props {
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  rotation: SharedValue<number>;
  shownTransform: SharedValue<MapTransform | null>;
  containerWidth: number;
  containerHeight: number;
  /** useSharpViewportVisibility의 overlayStyle (지금 transform이 이 레이어를 그린 시점과 같을 때만 보임) */
  visibilityStyle: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  /** IndoorMapView의 mapLayer와 같은 레이어들. viewBox로 보이는 영역만 그린다. */
  renderLayer: (size: LayerSize, children: React.ReactNode) => React.ReactNode;
  rooms: RoomShape[];
  selectedRoomIds: string[];
}

/**
 * 확대가 멈추면 지금 화면에 보이는 영역만 화면 해상도로 다시 그려 mapLayer 위에 덮는 레이어
 * (자세한 동작은 useSharpViewport 참고). mapLayer와 같은 배경 → 하이라이트 → 문 순서로 그리고,
 * 터치는 밑의 mapLayer(GestureDetector)로 넘긴다.
 */
export function SharpViewportLayer({
  scale,
  translateX,
  translateY,
  rotation,
  shownTransform,
  containerWidth,
  containerHeight,
  visibilityStyle,
  renderLayer,
  rooms,
  selectedRoomIds,
}: Props) {
  const viewport = useSettledViewport({
    scale,
    translateX,
    translateY,
    rotation,
    shownTransform,
    containerWidth,
    containerHeight,
  });
  if (!viewport) return null;

  const { viewBox } = viewport;
  const size: LayerSize = {
    width: viewport.width,
    height: viewport.height,
    viewBox: `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
  };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.layer,
        {
          left: viewport.left,
          top: viewport.top,
          width: viewport.width,
          height: viewport.height,
          transform: [{ rotate: `${viewport.rotation}rad` }],
        },
        visibilityStyle,
      ]}
    >
      {renderLayer(
        size,
        <RoomPolygons
          width={viewport.width}
          height={viewport.height}
          viewBoxX={viewBox.x}
          viewBoxY={viewBox.y}
          viewBoxWidth={viewBox.width}
          viewBoxHeight={viewBox.height}
          rooms={rooms}
          selectedRoomIds={selectedRoomIds}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
  },
});
