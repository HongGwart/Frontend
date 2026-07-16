import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { RoomShape } from '@types/room';

interface Props {
  width: number;
  height: number;
  rooms: RoomShape[];
  selectedRoomId: string | null;
  highlightFill?: string;
  highlightStroke?: string;
}

/**
 * 순수 프레젠테이션용 레이어. 탭 판정은 useMapGestures의 Tap 제스처에서
 * 이미 처리하므로 여기서는 onPress를 달지 않는다 (달아도 GestureDetector와
 * 충돌해서 씹힐 수 있음).
 */
export function RoomPolygons({
  width,
  height,
  rooms,
  selectedRoomId,
  highlightFill = 'rgba(29, 32, 86, 0.35)',
  highlightStroke = '#1D2056',
}: Props) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {rooms.map((room) => {
        const isSelected = room.id === selectedRoomId;
        if (!isSelected) return null; // 선택 안 된 방은 그릴 필요 없음
        return (
          <Path
            key={room.id}
            d={room.path}
            fill={highlightFill}
            stroke={highlightStroke}
            strokeWidth={2}
          />
        );
      })}
    </Svg>
  );
}