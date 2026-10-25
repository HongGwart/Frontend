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
  rotation: SharedValue<number>;
}

/**
 * 마커 하나. mapLayer(IndoorMapView의 Animated.View)와 정확히 같은 공식
 * (screen = translate + Rotate(rotation) * (mapCoord * scale))으로 화면 좌표를 계산하되,
 * width/height는 scale과 무관하게 고정하고 자기 자신에는 rotate를 걸지 않는다. 그 결과
 * "위치는 지도를 따라 돌지만 그림 자체는 항상 똑바로 서 있는" 네이버지도식 핀이 된다.
 */
function IconMarkerPin({ icon, size, scale, translateX, translateY, rotation }: MarkerProps) {
  const [cx, cy] = icon.center;
  const Icon = ICON_BY_TYPE[icon.type];

  const animatedStyle = useAnimatedStyle(() => {
    const cos = Math.cos(rotation.value);
    const sin = Math.sin(rotation.value);
    const scaledX = cx * scale.value;
    const scaledY = cy * scale.value;
    const rotatedX = scaledX * cos - scaledY * sin;
    const rotatedY = scaledX * sin + scaledY * cos;
    return {
      transform: [
        { translateX: translateX.value + rotatedX - size / 2 },
        { translateY: translateY.value + rotatedY - size / 2 },
      ],
    };
  });

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
  rotation: SharedValue<number>;
  /** 화면에 그려지는 고정 픽셀 크기. 확대/축소해도 이 값은 안 바뀐다 */
  size?: number;
}

export function IconMarkersLayer({ icons, scale, translateX, translateY, rotation, size = 12 }: Props) {
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
          rotation={rotation}
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
