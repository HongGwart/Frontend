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
  isSelected: boolean;
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
function RoomLabel({ room, fontSize, boxWidth, isSelected, scale, translateX, translateY, rotation }: LabelProps) {
  const [cx, cy] = centroid(room.points);
  const text = room.label ?? room.id;

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
      <Text
        style={[styles.labelText, { fontSize }, isSelected && styles.labelTextSelected]}
        numberOfLines={1}
      >
        {text}
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
  /** 하이라이팅된 방들의 id. 같은 라벨을 공유하는 방이 여러 개면 전부 넘겨서 다 같이
   *  흰색으로 바뀌게 한다 (진한 배경 위라 검정 글자는 안 보임) */
  selectedRoomIds?: string[];
}

export function RoomLabelsLayer({
  rooms,
  scale,
  translateX,
  translateY,
  rotation,
  fontSize = 7,
  selectedRoomIds = [],
}: Props) {
  if (rooms.length === 0) return null;

  // 하나의 강의실이 도면상 여러 조각으로 나뉜 경우(같은 label을 공유) 텍스트는
  // 한 번만 그린다 — 안 그러면 조각 개수만큼 같은 번호가 겹쳐 보인다.
  // 선택(클릭) 자체는 label이 같은 모든 조각에 걸리므로(IndoorMapView의 그룹핑 로직)
  // 텍스트를 하나로 줄여도 "함께 클릭되는" 동작에는 영향이 없다.
  const seenLabels = new Set<string>();
  const labeledRooms = rooms.filter((room) => {
    if (room.label === '') return false;
    const key = room.label ?? room.id;
    if (seenLabels.has(key)) return false;
    seenLabels.add(key);
    return true;
  });

  return (
    <Animated.View style={styles.overlay} pointerEvents="none">
      {labeledRooms
        .map((room) => (
          <RoomLabel
            key={room.id}
            room={room}
            fontSize={fontSize}
            boxWidth={48}
            isSelected={selectedRoomIds.includes(room.id)}
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
  labelTextSelected: {
    color: '#FFF',
  },
});
