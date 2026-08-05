import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import MapElevatorIcon from '@assets/svgs/mapIcon/map_elevator.svg';
import MapStairsIcon from '@assets/svgs/mapIcon/map_stairs.svg';
import { IconMarker, IconMarkerType } from '@appTypes/room';

const ICON_BY_TYPE: Record<IconMarkerType, React.FC<{ width: number; height: number }>> = {
  elevator: MapElevatorIcon,
  stairs: MapStairsIcon,
};

interface MarkerProps {
  icon: IconMarker;
  size: number;
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
}

/**
 * 마커 하나. mapLayer(IndoorMapView의 Animated.View)와 정확히 같은 공식
 * (screen = translate + mapCoord * scale)으로 화면 좌표를 계산하되, width/height는
 * scale과 무관하게 고정해서 "위치는 지도를 따라가지만 크기는 안 커지는" 핀 느낌을 만든다.
 */
function IconMarkerPin({ icon, size, scale, translateX, translateY }: MarkerProps) {
  const [cx, cy] = icon.center;
  const Icon = ICON_BY_TYPE[icon.type];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + cx * scale.value - size / 2 },
      { translateY: translateY.value + cy * scale.value - size / 2 },
    ],
  }));

  return (
    <Animated.View style={[styles.marker, { width: size, height: size }, animatedStyle]}>
      <Icon width={size} height={size} />
    </Animated.View>
  );
}

interface Props {
  icons: IconMarker[];
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  /** 화면에 그려지는 고정 픽셀 크기. 확대/축소해도 이 값은 안 바뀐다 */
  size?: number;
}

export function IconMarkersLayer({ icons, scale, translateX, translateY, size = 12 }: Props) {
  if (icons.length === 0) return null;
  return (
    <Animated.View style={styles.overlay} pointerEvents="none">
      {icons.map((icon) => (
        <IconMarkerPin
          key={icon.id}
          icon={icon}
          size={size}
          scale={scale}
          translateX={translateX}
          translateY={translateY}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  marker: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
