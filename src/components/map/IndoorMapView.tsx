import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { RoomPolygons } from './RoomPolygons';
import { useMapGestures } from '@hooks/map/useMapGestures';
import { FloorMapData, RoomShape } from '@appTypes/room';

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
}

export function IndoorMapView({
  mapData,
  renderBackground,
  renderForeground,
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

  const size = { width: mapData.width, height: mapData.height };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[size, animatedStyle]}>
          {renderBackground(size)}
          <RoomPolygons
            width={mapData.width}
            height={mapData.height}
            rooms={mapData.rooms}
            selectedRoomId={selectedRoomId}
          />
          {renderForeground?.(size)}
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