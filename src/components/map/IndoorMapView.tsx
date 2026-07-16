import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';

import type { FloorMapData, RoomShape } from '@types';
import { useMapGestures } from '../../hooks/map/useMapGestures';
import { RoomPolygons } from './RoomPolygons';

interface Props {
  mapData: FloorMapData;
  /**
   * 배경(Visual) 레이어. svgToRoomShapes.js는 Hitbox 레이어만 다루므로,
   * 실제로 보이는 벽/복도/아이콘은 기존 VisualBackground 같은 SVG 컴포넌트를
   * 그대로 이 slot에 넣어주면 된다. width/height는 mapData와 반드시 동일해야
   * 좌표계가 맞는다.
   */
  renderBackground: (size: { width: number; height: number }) => React.ReactNode;
  onRoomSelect?: (room: RoomShape | null) => void;
  minScale?: number;
  maxScale?: number;
}

export function IndoorMapView({
  mapData,
  renderBackground,
  onRoomSelect,
  minScale = 1,
  maxScale = 5,
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

  const { composedGesture, animatedStyle } = useMapGestures({
    rooms: mapData.rooms,
    onRoomTap: handleRoomTap,
    minScale,
    maxScale,
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            { width: mapData.width, height: mapData.height },
            animatedStyle,
          ]}
        >
          {renderBackground({ width: mapData.width, height: mapData.height })}
          <RoomPolygons
            width={mapData.width}
            height={mapData.height}
            rooms={mapData.rooms}
            selectedRoomId={selectedRoomId}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
});