import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { RoomShape } from '@appTypes/room';
import { largestBoxFontSize, roomLabelCenter } from '@utils/geometry';
import { labelWidthEm } from '@utils/roomLabel';

// 방 번호 글자 크기(화면 pt). 처음 화면(과 그보다 축소한 화면)에서는 7pt이고, 확대한 만큼 커지다가 14pt에서 멈춘다 —
// 처음 화면은 도면을 한눈에 보는 용도라 작게 두고, 14pt보다 크면 확대한 도면에서 번호만 도드라진다.
const BASE_MIN_FONT_SIZE = 7;
const MAX_FONT_SIZE = 14;
// 번호는 방에 들어가는 크기까지 줄인다. 처음 화면에서 좁은 방이 줄지어 있어도 옆 방 번호와 겹치지 않게 하려고 작게 잡았다
// (6pt면 85쌍, 4pt면 12쌍이 겹친다). 읽을 수 있는 건 확대한 뒤라 이 크기 밑으로는 줄이지 않고 방 밖까지 조금 넘치게 둔다.
const MIN_FONT_SIZE = 4;
// 글자가 벽에 딱 붙지 않게, 방 안에 들어가는지 볼 때 글자 폭을 이만큼 넓게 잡는다.
const FIT_WIDTH_MARGIN = 1.1;
// 줄 높이(글자 크기 대비). 글자 폭은 한글·숫자에 따라 다르게 labelWidthEm으로 계산한다.
const LINE_HEIGHT_EM = 1.2;
// 번호 밑에 작게 쓰는 시설 이름의 글자 크기(번호 대비).
const NAME_FONT_RATIO = 0.85;
// 글자는 최대 크기로 한 번 그려 두고 transform scale로만 줄인다(확대·축소 중 다시 렌더하지 않게). 그 상자의 좌우 여유.
const BOX_PADDING = 4;

const labelCenter = (room: RoomShape) => room.labelAnchor ?? roomLabelCenter(room.points);

/** 번호가 방 안에 들어가는 가장 큰 글자 크기(도면 좌표 단위). */
function fitFontSize(room: RoomShape, text: string) {
  const [cx, cy] = labelCenter(room);
  return largestBoxFontSize(cx, cy, labelWidthEm(text) * FIT_WIDTH_MARGIN, LINE_HEIGHT_EM, room.points);
}

/** 번호 밑에 시설 이름을 함께 썼을 때 방 안에 들어가는 번호 글자 크기(도면 좌표 단위). */
function fitStackedFontSize(room: RoomShape, text: string, name: string) {
  const [cx, cy] = labelCenter(room);
  const widthEm = Math.max(labelWidthEm(text), labelWidthEm(name) * NAME_FONT_RATIO) * FIT_WIDTH_MARGIN;
  return largestBoxFontSize(cx, cy, widthEm, LINE_HEIGHT_EM * (1 + NAME_FONT_RATIO), room.points);
}

interface LabelProps {
  room: RoomShape;
  text: string;
  /** 이 방에 번호가 들어가는 가장 큰 글자 크기(도면 좌표 단위) */
  numberFit: number;
  /** 시설이 있는 방에서, 번호 밑에 이름을 함께 쓸 때 들어가는 번호 글자 크기(도면 좌표 단위) */
  stackedFit?: number;
  /** 번호 밑에 그리는 시설 이름 라벨인지 */
  isName?: boolean;
  isSelected: boolean;
  scale: SharedValue<number>;
  /** 처음 화면의 배율. 지금 배율이 이보다 얼마나 큰지로 기준 글자 크기를 정한다 */
  defaultScale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  rotation: SharedValue<number>;
}

/**
 * 라벨 하나. IconMarkersLayer와 동일한 공식(screen = translate + Rotate(rotation) *
 * (mapCoord * scale))으로 위치만 지도를 따라가게 하고, 텍스트 자체에는 지도 회전을 걸지 않아서
 * 지도가 회전해도 글자는 항상 똑바로 보인다.
 *
 * 번호는 기준 크기(7~14pt, 확대를 따라감)로 방에 들어가면 그 크기, 안 들어가면 4pt까지 들어가는 크기로 줄인다.
 * 4pt로도 안 들어가면 4pt로 방 밖까지 조금 넘쳐서 보인다. 번호를 숨기거나 세로로 세우지는 않는다 — 확대·축소 중에
 * 글자가 사라지거나 방향이 바뀌면 어지럽다. 크기는 transform으로 UI 스레드에서만 바꿔서 확대·축소 중 다시 렌더하지 않는다.
 *
 * 시설이 있는 방은 번호 밑에 시설 이름을 작게 쓴다. 번호 크기를 줄이지 않고 함께 들어가는 배율에서만 보인다.
 *
 * 방을 탭하면 selectedRoomIds가 바뀌어 레이어 전체가 다시 렌더되는데, 한 층에 라벨이 70개
 * 넘게 있을 수 있어서 memo로 감싸 isSelected가 실제로 바뀐 라벨만 다시 그린다.
 */
const RoomLabel = React.memo(function RoomLabel({
  room,
  text,
  numberFit,
  defaultScale,
  stackedFit,
  isName = false,
  isSelected,
  scale,
  translateX,
  translateY,
  rotation,
}: LabelProps) {
  // 배경 SVG에 박혀있던 숫자 라벨을 대신해서 이 좌표에 그린다(라벨은 stripLabelPaths.js로 배경에서 제거됨).
  const [cx, cy] = useMemo(() => labelCenter(room), [room]);
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
    const zoom = defaultScale.value > 0 ? scale.value / defaultScale.value : 1;
    const baseSize = Math.min(MAX_FONT_SIZE, Math.max(BASE_MIN_FONT_SIZE, BASE_MIN_FONT_SIZE * zoom));
    const roomFit = numberFit * scale.value;
    // 단계로 끊으면 작은 방은 확대해도 같은 크기에 머물다 갑자기 커진다. 도면과 함께 이어서 커지게 그대로 쓴다.
    const fontSize = Math.max(MIN_FONT_SIZE, Math.min(baseSize, roomFit));
    const nameShown =
      stackedFit !== undefined && stackedFit * scale.value >= Math.max(fontSize, BASE_MIN_FONT_SIZE);
    // 번호와 이름을 한 덩어리로 방 가운데에 둔다.
    const offsetY = !nameShown
      ? 0
      : isName
        ? (LINE_HEIGHT_EM * fontSize) / 2
        : (-LINE_HEIGHT_EM * fontSize * NAME_FONT_RATIO) / 2;
    return {
      opacity: !isName || nameShown ? 1 : 0,
      transform: [
        { translateX: translateX.value + rotatedX - boxWidth / 2 },
        { translateY: translateY.value + rotatedY - boxHeight / 2 + offsetY },
        // 상자 가운데를 기준으로 줄인다(RN transform 기본 기준점) — 위치는 위 translate가 이미 가운데에 맞췄다.
        { scale: ((isName ? NAME_FONT_RATIO : 1) * fontSize) / MAX_FONT_SIZE },
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
  defaultScale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  rotation: SharedValue<number>;
  /** 하이라이팅된 방들의 id. 같은 라벨을 공유하는 방이 여러 개면 전부 넘겨서 다 같이
   *  흰색으로 바뀌게 한다 (진한 배경 위라 검정 글자는 안 보임) */
  selectedRoomIds?: string[];
  /** 방 라벨(room.label ?? room.id) → 번호 밑에 보여줄 시설 이름 */
  roomNames?: ReadonlyMap<string, string>;
}

export function RoomLabelsLayer({ rooms, scale, defaultScale, translateX, translateY, rotation, selectedRoomIds = [], roomNames }: Props) {
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
      return [{ room, text, numberFit: fitFontSize(room, text) }];
    });
  }, [rooms]);

  const nameLabels = useMemo(() => {
    const names = new Map<string, { name: string; stackedFit: number }>();
    labels.forEach(({ room, text }) => {
      const name = roomNames?.get(text);
      if (name) names.set(text, { name, stackedFit: fitStackedFontSize(room, text, name) });
    });
    return names;
  }, [labels, roomNames]);

  if (labels.length === 0) return null;

  return (
    <Animated.View style={styles.overlay} pointerEvents="none">
      {labels.map(({ room, text, numberFit }) => {
        const nameLabel = nameLabels.get(text);
        const shared = {
          room,
          numberFit,
          defaultScale,
          stackedFit: nameLabel?.stackedFit,
          isSelected: selectedRoomIds.includes(room.id),
          scale,
          translateX,
          translateY,
          rotation,
        };
        return (
          <React.Fragment key={room.id}>
            <RoomLabel {...shared} text={text} />
            {nameLabel && <RoomLabel {...shared} isName text={nameLabel.name} />}
          </React.Fragment>
        );
      })}
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
