import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { RoomShape } from '@appTypes/room';
import { labelWidthEm } from '@utils/roomLabel';

// 층 기준 방 번호 글자 크기(화면 pt). 확대하면 커지고 축소하면 작아지되 이 범위를 넘지 않는다 — 9pt보다 작으면 휴대폰에서
// 숫자를 읽기 어렵고, 14pt보다 크면 확대한 도면에서 번호만 도드라진다.
const BASE_MIN_FONT_SIZE = 9;
const MAX_FONT_SIZE = 14;
// 기준 크기로 방에 안 들어가는 번호만 이 단계로 줄인다. 크기를 몇 단계로만 나눠야 옆 방끼리 들쭉날쭉해 보이지 않는다.
// 가장 작은 단계(6pt)로도 안 들어가는 아주 좁은 방(처음 화면 기준 전 층의 약 8%)은 6pt로 방 밖까지 조금 넘쳐서 보인다.
const SMALL_FONT_STEPS = [8, 7, 6];
const MIN_FONT_SIZE = SMALL_FONT_STEPS[SMALL_FONT_STEPS.length - 1];
// 글자가 방 안에 들어가는지 볼 때 쓰는 여백: 글자 방향으로는 방 길이의 80%, 그 수직 방향으로는 60%까지만 쓴다.
const FIT_LENGTH_RATIO = 0.8;
const FIT_THICKNESS_RATIO = 0.6;
// 줄 높이(글자 크기 대비). 글자 폭은 한글·숫자에 따라 다르게 labelWidthEm으로 계산한다.
const LINE_HEIGHT_EM = 1.2;
// 세로로 세우면 가로보다 이만큼 이상 크게 들어가는 방만 세로 글자로 쓴다(애매한 방은 가로로 둔다).
const VERTICAL_ADVANTAGE = 1.1;
// 글자는 최대 크기로 한 번 그려 두고 transform scale로만 줄인다(확대·축소 중 다시 렌더하지 않게). 그 상자의 좌우 여유.
const BOX_PADDING = 4;

// 층 기준 글자 크기를 정하는 방 크기 분위. 중앙값이면 그보다 작은 방 절반이 기준 크기로 안 들어가고,
// 하위 10%면 9pt로 들어가는 방은 다 기준 크기를 쓰면서 방이 큰 층은 글자도 그만큼 커진다.
const FLOOR_SIZE_QUANTILE = 0.1;
const quantile = (values: number[], q: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
};

/** 방 4개 모서리의 평균 = 사각형 중심점. 배경 SVG에 박혀있던 숫자 라벨을 대신해서
 *  이 좌표에 room.id를 앵커로 그린다 (라벨은 stripLabelPaths.js로 배경에서 제거됨) */
function centroid(points: RoomShape['points']): [number, number] {
  const sum = points.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

/** 글자를 가로로 / 세로로(90°) 썼을 때 방 안에 들어가는 가장 큰 글자 크기(도면 좌표 단위). 방 바운딩 박스 기준이다. */
function fitFontSizes(points: RoomShape['points'], text: string) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  const widthEm = labelWidthEm(text);
  const along = (length: number, thickness: number) =>
    Math.min((length * FIT_LENGTH_RATIO) / widthEm, (thickness * FIT_THICKNESS_RATIO) / LINE_HEIGHT_EM);
  return { horizontal: along(width, height), vertical: along(height, width) };
}

interface LabelProps {
  room: RoomShape;
  text: string;
  /** 이 방에 가로 / 세로 글자로 들어가는 가장 큰 글자 크기(도면 좌표 단위) */
  horizontalFit: number;
  verticalFit: number;
  /** 층 전체 방 번호의 기준 글자 크기(도면 좌표 단위). 화면 크기 = 이 값 × 배율을 9~14pt로 자른 값 */
  floorSize: number;
  isSelected: boolean;
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  rotation: SharedValue<number>;
}

/**
 * 라벨 하나. IconMarkersLayer와 동일한 공식(screen = translate + Rotate(rotation) *
 * (mapCoord * scale))으로 위치만 지도를 따라가게 하고, 텍스트 자체에는 지도 회전을 걸지 않아서
 * 지도가 회전해도 글자는 항상 똑바로 보인다(세로 글자는 방 방향에 맞춰 90°만 세운다).
 *
 * 번호는 숨기지 않는다. 층 기준 크기(9~14pt, 확대를 따라감)로 방에 들어가면 그 크기, 안 들어가면 8·7·6pt 중 들어가는
 * 가장 큰 크기로 줄인다. 가로로 안 들어가는 길쭉한 방은 세로로 세웠을 때 들어가면 세로 글자로 쓴다(방향은 배율에
 * 따라 정해서, 확대하다 가로가 들어가는 순간 가로로 바뀐다). 6pt로도 넘치면 6pt 가로 글자로 방 밖까지 조금 넘쳐
 * 보인다 — 숨기지 않는다. 크기·방향은 transform으로 UI 스레드에서만 바꿔서 확대·축소 중 다시 렌더하지 않는다.
 *
 * 방을 탭하면 selectedRoomIds가 바뀌어 레이어 전체가 다시 렌더되는데, 한 층에 라벨이 70개
 * 넘게 있을 수 있어서 memo로 감싸 isSelected가 실제로 바뀐 라벨만 다시 그린다.
 */
const RoomLabel = React.memo(function RoomLabel({
  room,
  text,
  horizontalFit,
  verticalFit,
  floorSize,
  isSelected,
  scale,
  translateX,
  translateY,
  rotation,
}: LabelProps) {
  const [cx, cy] = room.labelAnchor ?? centroid(room.points);
  // 한글이 섞인 이름("제1열람실")도 잘리지 않게 글자마다 폭을 따로 잡는다.
  const boxWidth = labelWidthEm(text) * MAX_FONT_SIZE + BOX_PADDING * 2;
  const boxHeight = MAX_FONT_SIZE * LINE_HEIGHT_EM;

  const animatedStyle = useAnimatedStyle(() => {
    const cos = Math.cos(rotation.value);
    const sin = Math.sin(rotation.value);
    const scaledX = cx * scale.value;
    const scaledY = cy * scale.value;
    const rotatedX = scaledX * cos - scaledY * sin;
    const rotatedY = scaledX * sin + scaledY * cos;
    const baseSize = Math.min(MAX_FONT_SIZE, Math.max(BASE_MIN_FONT_SIZE, floorSize * scale.value));
    const horizontalPx = horizontalFit * scale.value;
    const verticalPx = verticalFit * scale.value;
    // 가로로 기준 크기가 안 들어가고, 세로로 세우면 확실히 더 크게(그리고 최소 크기 이상으로) 들어갈 때만 세로.
    const vertical =
      horizontalPx < baseSize && verticalPx > horizontalPx * VERTICAL_ADVANTAGE && verticalPx >= MIN_FONT_SIZE;
    const roomFit = vertical ? verticalPx : horizontalPx;
    let fontSize = baseSize;
    if (roomFit < baseSize) {
      fontSize = MIN_FONT_SIZE;
      for (const step of SMALL_FONT_STEPS) {
        if (roomFit >= step) {
          fontSize = step;
          break;
        }
      }
    }
    return {
      transform: [
        { translateX: translateX.value + rotatedX - boxWidth / 2 },
        { translateY: translateY.value + rotatedY - boxHeight / 2 },
        // 상자 가운데를 기준으로 줄이고 세운다(RN transform 기본 기준점) — 위치는 위 translate가 이미 가운데에 맞췄다.
        { scale: fontSize / MAX_FONT_SIZE },
        { rotate: vertical ? '-90deg' : '0deg' },
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
      return [{ room, text, ...fitFontSizes(room.points, text) }];
    });
  }, [rooms]);

  // 층 기준 글자 크기 = 가로 글자로 방들에 들어가는 크기의 하위 10%. 그 층의 작은 방에 맞춰서, 강의실 크기에 비해 글자가
  // 커 보이지 않게 한다.
  const floorSize = useMemo(
    () =>
      quantile(
        labels.map(label => label.horizontal),
        FLOOR_SIZE_QUANTILE,
      ),
    [labels],
  );

  if (labels.length === 0) return null;

  return (
    <Animated.View style={styles.overlay} pointerEvents="none">
      {labels.map(({ room, text, horizontal, vertical }) => (
        <RoomLabel
          key={room.id}
          room={room}
          text={text}
          horizontalFit={horizontal}
          verticalFit={vertical}
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
