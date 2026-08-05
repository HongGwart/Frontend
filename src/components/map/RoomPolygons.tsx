import React, { useEffect, useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { RoomShape } from '@appTypes/room';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const FADE_DURATION = 180;

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
  const opacity = useSharedValue(0);
  // 선택 해제돼도 fade-out이 끝날 때까지는 마지막으로 선택됐던 방의 모양을 계속 그려야
  // 해서, selectedRoomId와 별도로 "지금 화면에 그리는 path"를 들고 있는다. 즉시 지워버리면
  // 페이드 아웃할 대상 자체가 사라져서 뚝 끊겨 보인다.
  const [displayedPath, setDisplayedPath] = useState<string | null>(null);

  useEffect(() => {
    const room = rooms.find((r) => r.id === selectedRoomId) ?? null;
    if (room) {
      setDisplayedPath(room.path);
      opacity.value = withTiming(1, { duration: FADE_DURATION });
    } else {
      opacity.value = withTiming(0, { duration: FADE_DURATION });
    }
  }, [selectedRoomId, rooms, opacity]);

  const animatedProps = useAnimatedProps(() => ({
    fillOpacity: opacity.value,
  }));

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {displayedPath && (
        // 방은 사각형 hitbox라 문이 있는 모서리까지 테두리가 그대로 지나간다. 문은
        // renderForeground(VisualDoors)가 이 위에 다시 그려서 채우기(fill)는 가려지지만,
        // 테두리(stroke)는 얇은 선이라 문 그림 경계 밖으로 살짝 비어져 나와 보인다.
        // 그래서 하이라이트는 채우기만 쓰고 테두리는 아예 안 그린다.
        <AnimatedPath d={displayedPath} fill={highlightFill} animatedProps={animatedProps} />
      )}
    </Svg>
  );
}
