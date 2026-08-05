import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { RoomShape } from '@appTypes/room';

/** 방 4개 모서리의 평균 = 사각형 중심점. 배경 SVG에 박혀있던 숫자 라벨을 대신해서
 *  이 좌표에 room.id를 앵커로 그린다 (라벨은 stripLabelPaths.js로 배경에서 제거됨) */
function centroid(points: RoomShape['points']): [number, number] {
  const sum = points.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

interface LabelProps {
  room: RoomShape;
  fontSize: number;
  boxWidth: number;
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  rotation: SharedValue<number>;
}

/**
 * 라벨 하나. IconMarkersLayer와 동일한 공식(screen = translate + Rotate(rotation) *
 * (mapCoord * scale))으로 위치만 지도를 따라가게 하고, 텍스트 자체에는 rotate를 걸지 않아서
 * 지도가 회전해도 글자는 항상 똑바로 보인다.
 */
function RoomLabel({ room, fontSize, boxWidth, scale, translateX, translateY, rotation }: LabelProps) {
  const [cx, cy] = centroid(room.points);

  const animatedStyle = useAnimatedStyle(() => {
    const cos = Math.cos(rotation.value);
    const sin = Math.sin(rotation.value);
    const scaledX = cx * scale.value;
    const scaledY = cy * scale.value;
    const rotatedX = scaledX * cos - scaledY * sin;
    const rotatedY = scaledX * sin + scaledY * cos;
    return {
      transform: [
        { translateX: translateX.value + rotatedX - boxWidth / 2 },
        { translateY: translateY.value + rotatedY - fontSize / 2 },
      ],
    };
  });

  return (
    <Animated.View style={[styles.label, { width: boxWidth }, animatedStyle]}>
      <Text style={[styles.labelText, { fontSize }]} numberOfLines={1}>
        {room.id}
      </Text>
    </Animated.View>
  );
}

interface Props {
  rooms: RoomShape[];
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  rotation: SharedValue<number>;
  /** 고정 폰트 크기. 확대/축소해도 이 값은 안 바뀐다 */
  fontSize?: number;
}

export function RoomLabelsLayer({ rooms, scale, translateX, translateY, rotation, fontSize = 7 }: Props) {
  if (rooms.length === 0) return null;
  return (
    <Animated.View style={styles.overlay} pointerEvents="none">
      {rooms.map((room) => (
        <RoomLabel
          key={room.id}
          room={room}
          fontSize={fontSize}
          boxWidth={48}
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
  label: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
  },
  labelText: {
    color: '#000',
    fontWeight: '500',
  },
});
