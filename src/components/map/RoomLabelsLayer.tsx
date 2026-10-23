import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { RoomShape } from '@appTypes/room';

// 방 번호 글자 크기(화면 pt). 확대하면 커지고 축소하면 작아지되 이 범위를 넘지 않는다 — 9pt보다 작으면 휴대폰에서
// 숫자를 읽기 어렵고, 14pt보다 크면 확대한 도면에서 번호만 도드라진다.
const MIN_FONT_SIZE = 9;
const MAX_FONT_SIZE = 14;
// 글자가 방 안에 들어가는지 볼 때 쓰는 여백: 가로는 방 폭의 80%, 세로는 방 높이의 60%까지만 쓴다.
const FIT_WIDTH_RATIO = 0.8;
const FIT_HEIGHT_RATIO = 0.6;
// 숫자 한 글자 폭(글자 크기 대비, fontWeight 500 시스템 글꼴 숫자·하이픈 어림값)과 줄 높이.
const CHAR_WIDTH_EM = 0.62;
const LINE_HEIGHT_EM = 1.2;
// 글자는 최대 크기로 한 번 그려 두고 transform scale로만 줄인다(확대·축소 중 다시 렌더하지 않게). 그 상자의 좌우 여유.
const BOX_PADDING = 4;

/** 방 4개 모서리의 평균 = 사각형 중심점. 배경 SVG에 박혀있던 숫자 라벨을 대신해서
 *  이 좌표에 room.id를 앵커로 그린다 (라벨은 stripLabelPaths.js로 배경에서 제거됨) */
function centroid(points: RoomShape['points']): [number, number] {
  const sum = points.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

/** 이 방 안에 글자가 들어가는 가장 큰 글자 크기(도면 좌표 단위). 방 바운딩 박스 기준이다. */
function fitFontSize(points: RoomShape['points'], text: string): number {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  return Math.min((width * FIT_WIDTH_RATIO) / (text.length * CHAR_WIDTH_EM), (height * FIT_HEIGHT_RATIO) / LINE_HEIGHT_EM);
}

// 층 기준 글자 크기를 정하는 방 크기 분위. 중앙값이면 그보다 작은 방 절반이 처음 화면에서 숨고(전 층 63%만 보임),
// 하위 10%면 9pt로 들어가는 방은 다 보이면서(75%) 방이 큰 층은 글자도 그만큼 커진다.
const FLOOR_SIZE_QUANTILE = 0.1;
const quantile = (values: number[], q: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
};

interface LabelProps {
  room: RoomShape;
  text: string;
  /** 이 방에 들어가는 가장 큰 글자 크기(도면 좌표 단위) */
  fitSize: number;
  /** 층 전체 방 번호의 기준 글자 크기(도면 좌표 단위). 화면 크기 = 이 값 × 배율을 최소·최대로 자른 값 */
  floorSize: number;
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
 *
 * 글자 크기는 층 전체가 같고(방마다 다르면 큰 방 번호만 커져 들쭉날쭉하다), 배율을 따라 MIN~MAX pt 사이에서 바뀐다.
 * 그 크기로 방에 안 들어가면 숨겼다가 확대해서 들어가는 순간 보인다. 선택한 방도 같은 규칙이다(방 자체는 칠해져서 보인다).
 * 크기·숨김은 transform scale과 opacity로 UI 스레드에서만 바꿔서 확대·축소 중 다시 렌더하지 않는다.
 *
 * 방을 탭하면 selectedRoomIds가 바뀌어 레이어 전체가 다시 렌더되는데, 한 층에 라벨이 70개
 * 넘게 있을 수 있어서 memo로 감싸 isSelected가 실제로 바뀐 라벨만 다시 그린다.
 */
const RoomLabel = React.memo(function RoomLabel({
  room,
  text,
  fitSize,
  floorSize,
  isSelected,
  scale,
  translateX,
  translateY,
  rotation,
}: LabelProps) {
  const [cx, cy] = room.labelAnchor ?? centroid(room.points);
  const boxWidth = text.length * MAX_FONT_SIZE * CHAR_WIDTH_EM + BOX_PADDING * 2;
  const boxHeight = MAX_FONT_SIZE * LINE_HEIGHT_EM;

  const animatedStyle = useAnimatedStyle(() => {
    const cos = Math.cos(rotation.value);
    const sin = Math.sin(rotation.value);
    const scaledX = cx * scale.value;
    const scaledY = cy * scale.value;
    const rotatedX = scaledX * cos - scaledY * sin;
    const rotatedY = scaledX * sin + scaledY * cos;
    const fontSize = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, floorSize * scale.value));
    const fits = fitSize * scale.value >= fontSize;
    return {
      opacity: fits ? 1 : 0,
      transform: [
        { translateX: translateX.value + rotatedX - boxWidth / 2 },
        { translateY: translateY.value + rotatedY - boxHeight / 2 },
        // 상자 가운데를 기준으로 줄인다(RN transform 기본 기준점) — 위치는 위 translate가 이미 가운데에 맞췄다.
        { scale: fontSize / MAX_FONT_SIZE },
      ],
    };
  });

  return (
    <Animated.View style={[styles.label, { width: boxWidth, height: boxHeight }, animatedStyle]}>
      <Text style={[styles.labelText, isSelected && styles.labelTextSelected]} numberOfLines={1}>
        {text}
      </Text>
    </Animated.View>
  );
});

interface Props {
  rooms: RoomShape[];
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  rotation: SharedValue<number>;
  /** 하이라이팅된 방들의 id. 같은 라벨을 공유하는 방이 여러 개면 전부 넘겨서 다 같이
   *  흰색으로 바뀌게 한다 (진한 배경 위라 검정 글자는 안 보임) */
  selectedRoomIds?: string[];
}

export function RoomLabelsLayer({ rooms, scale, translateX, translateY, rotation, selectedRoomIds = [] }: Props) {
  // 하나의 강의실이 도면상 여러 조각으로 나뉜 경우(같은 label을 공유) 텍스트는
  // 한 번만 그린다 — 안 그러면 조각 개수만큼 같은 번호가 겹쳐 보인다.
  // 선택(클릭) 자체는 label이 같은 모든 조각에 걸리므로(IndoorMapView의 그룹핑 로직)
  // 텍스트를 하나로 줄여도 "함께 클릭되는" 동작에는 영향이 없다.
  const labels = useMemo(() => {
    const seenLabels = new Set<string>();
    return rooms.flatMap(room => {
      const text = room.label ?? room.id;
      if (room.label === '' || seenLabels.has(text)) return [];
      seenLabels.add(text);
      return [{ room, text, fitSize: fitFontSize(room.points, text) }];
    });
  }, [rooms]);
  // 층 기준 글자 크기 = 방들에 들어가는 글자 크기의 하위 10%. 그 층의 작은 방에 맞춰서, 강의실 크기에 비해 글자가
  // 커 보이지 않게 한다(그래도 9pt 아래로는 안 줄인다 — 그때 안 들어가는 방은 숨긴다).
  const floorSize = useMemo(() => quantile(labels.map(label => label.fitSize), FLOOR_SIZE_QUANTILE), [labels]);

  if (labels.length === 0) return null;

  return (
    <Animated.View style={styles.overlay} pointerEvents="none">
      {labels.map(({ room, text, fitSize }) => (
        <RoomLabel
          key={room.id}
          room={room}
          text={text}
          fitSize={fitSize}
          floorSize={floorSize}
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
    justifyContent: 'center',
  },
  labelText: {
    color: '#000',
    fontWeight: '500',
    fontSize: MAX_FONT_SIZE,
    lineHeight: MAX_FONT_SIZE * LINE_HEIGHT_EM,
  },
  labelTextSelected: {
    color: '#FFF',
  },
});
