import React, { useEffect, useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { RoomShape } from '@appTypes/room';
import { theme } from '@theme/color';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const FADE_DURATION = 180;

/** 완전 불투명 하이라이트. 이 위에 얹히는 방 번호 라벨은 RoomLabelsLayer가 흰색으로 바꿔서 보여준다 */
const HIGHLIGHT_OPACITY = 1;
const DEFAULT_HIGHLIGHT_FILL = theme.blue[800];

interface Props {
  width: number;
  height: number;
  rooms: RoomShape[];
  /**
   * 하이라이트할 방 id들. 같은 라벨(예: "407")을 공유하는 방이 여러 개 있으면(하나의
   * 강의실이 도면상 두 조각으로 나뉜 경우 등) 탭 한 번에 전부 같이 하이라이트되도록
   * 배열로 받는다. 단일 선택이면 원소 하나짜리 배열을 넘기면 된다.
   */
  selectedRoomIds: string[];
  highlightFill?: string;
  /** 다 페이드인됐을 때 최종 불투명도. fill 자체엔 알파를 안 섞고 이 값으로만 조절한다 */
  highlightOpacity?: number;
}

/**
 * 순수 프레젠테이션용 레이어. 탭 판정은 useMapGestures의 Tap 제스처에서
 * 이미 처리하므로 여기서는 onPress를 달지 않는다 (달아도 GestureDetector와 충돌해서 씹힐 수 있음).
 */
export function RoomPolygons({
  width,
  height,
  rooms,
  selectedRoomIds,
  highlightFill = DEFAULT_HIGHLIGHT_FILL,
  highlightOpacity = HIGHLIGHT_OPACITY,
}: Props) {
  const opacity = useSharedValue(0);
  // 선택 해제돼도 fade-out이 끝날 때까지는 마지막으로 선택됐던 방들의 모양을 계속 그려야
  // 해서, selectedRoomIds와 별도로 "지금 화면에 그리는 path들"을 들고 있는다. 즉시 지워버리면
  // 페이드 아웃할 대상 자체가 사라져서 뚝 끊겨 보인다.
  const [displayedPaths, setDisplayedPaths] = useState<string[]>([]);

  useEffect(() => {
    const paths = rooms.filter((r) => selectedRoomIds.includes(r.id)).map((r) => r.path);
    if (paths.length > 0) {
      setDisplayedPaths(paths);
      opacity.value = withTiming(highlightOpacity, { duration: FADE_DURATION });
    } else {
      opacity.value = withTiming(0, { duration: FADE_DURATION });
    }
  }, [selectedRoomIds, rooms, opacity, highlightOpacity]);

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
      {displayedPaths.map((path) => (
        // 방은 사각형 hitbox라 문이 있는 모서리까지 테두리가 그대로 지나간다. 문은
        // renderForeground(VisualDoors)가 이 위에 다시 그려서 채우기(fill)는 가려지지만,
        // 테두리(stroke)는 얇은 선이라 문 그림 경계 밖으로 살짝 비어져 나와 보인다.
        // 그래서 하이라이트는 채우기만 쓰고 테두리는 아예 안 그린다.
        <AnimatedPath key={path} d={path} fill={highlightFill} animatedProps={animatedProps} />
      ))}
    </Svg>
  );
}
