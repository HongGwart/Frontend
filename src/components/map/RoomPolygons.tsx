import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { RoomShape } from '@types/room';

interface Props {
  width: number;
  height: number;
  rooms: RoomShape[];
  selectedRoomId: string | null;
  highlightFill?: string;
}

/**
 * 순수 프레젠테이션용 레이어. 탭 판정은 useMapGestures의 Tap 제스처에서
 * 이미 처리하므로 여기서는 onPress를 달지 않는다 (달아도 GestureDetector와 충돌해서 씹힐 수 있음).
 */
export function RoomPolygons({
  width,
  height,
  rooms,
  selectedRoomId,
  highlightFill = 'rgba(29, 32, 86, 0.35)',
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
        // 방은 사각형 hitbox라 문이 있는 모서리까지 테두리가 그대로 지나간다. 문은
        // renderForeground(VisualDoors)가 이 위에 다시 그려서 채우기(fill)는 가려지지만,
        // 테두리(stroke)는 얇은 선이라 문 그림 경계 밖으로 살짝 비어져 나와 보인다.
        // 그래서 하이라이트는 채우기만 쓰고 테두리는 아예 안 그린다.
        return <Path key={room.id} d={room.path} fill={highlightFill} />;
      })}
    </Svg>
  );
}