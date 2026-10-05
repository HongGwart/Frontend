import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { FLOOR_MAPS } from '@constant/floorMaps';
import ElevatorIcon from '@assets/svgs/icons/elevator.svg';
import StairsIcon from '@assets/svgs/icons/stairs.svg';

// 외곽 벽 stroke가 contentBounds 밖으로 살짝 삐져나오는 만큼 여유 (도면 px, renderFloorOverlay.js와 같은 값)
const MARGIN = 8;
const ICON_SIZE = 16;

/** 편집을 시작할 때 도면을 화면에 놓을 위치: contentBounds 중심의 화면 좌표, 도면 1px당 화면 px, 회전(라디안) */
export interface FloorPlanPlacement {
  centerX: number;
  centerY: number;
  pxPerUnit: number;
  rotation: number;
}

export interface FloorPlanEditorHandle {
  /** contentBounds 네 모서리(좌상단→우상단→우하단→좌하단)의 지금 화면 좌표 */
  getCornerScreenPoints: () => { x: number; y: number }[];
  rotateBy: (radians: number) => void;
  scaleBy: (factor: number) => void;
}

interface Props {
  floorId: string;
  initial: FloorPlanPlacement;
}

/**
 * [개발용] 건물 내부 지도와 같은 SVG(배경+문)와 계단/엘리베이터 아이콘·호수를 지도 위에 반투명하게 띄우고,
 * 한 손가락으로 끌어 옮기고 두 손가락으로 돌리고 크기를 조절한다. 이동·회전·균일 확대만 하므로 도면 모양은
 * 절대 찌그러지지 않는다. 편집하는 동안 이 레이어가 화면 전체의 터치를 받아서 지도는 멈춰 있다.
 * NaverMapView와 같은 부모 안에 absoluteFill로 얹어야 화면 좌표가 지도 좌표와 맞는다.
 */
export const FloorPlanEditor = forwardRef<FloorPlanEditorHandle, Props>(({ floorId, initial }, ref) => {
  const { data, Background, Doors } = useMemo(() => FLOOR_MAPS[floorId](), [floorId]);
  const cb = data.contentBounds ?? { minX: 0, minY: 0, width: data.width, height: data.height };
  const k = initial.pxPerUnit;
  // 여유를 둔 도면 영역 = 화면에 그릴 박스. 중심은 contentBounds 중심과 같다.
  const box = { minX: cb.minX - MARGIN, minY: cb.minY - MARGIN, width: cb.width + MARGIN * 2, height: cb.height + MARGIN * 2 };
  const boxW = box.width * k;
  const boxH = box.height * k;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(initial.rotation);
  const start = useSharedValue({ x: 0, y: 0, scale: 1, rotation: 0 });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onStart(() => {
      start.value = { ...start.value, x: translateX.value, y: translateY.value };
    })
    .onUpdate(e => {
      translateX.value = start.value.x + e.translationX;
      translateY.value = start.value.y + e.translationY;
    });
  const pinch = Gesture.Pinch()
    .onStart(() => {
      start.value = { ...start.value, scale: scale.value };
    })
    .onUpdate(e => {
      scale.value = start.value.scale * e.scale;
    });
  const rotate = Gesture.Rotation()
    .onStart(() => {
      start.value = { ...start.value, rotation: rotation.value };
    })
    .onUpdate(e => {
      rotation.value = start.value.rotation + e.rotation;
    });
  const gesture = Gesture.Simultaneous(pan, pinch, rotate);

  useImperativeHandle(ref, () => ({
    getCornerScreenPoints: () => {
      const s = scale.value;
      const cos = Math.cos(rotation.value);
      const sin = Math.sin(rotation.value);
      const cx = initial.centerX + translateX.value;
      const cy = initial.centerY + translateY.value;
      return [
        [-cb.width / 2, -cb.height / 2],
        [cb.width / 2, -cb.height / 2],
        [cb.width / 2, cb.height / 2],
        [-cb.width / 2, cb.height / 2],
      ].map(([dx, dy]) => {
        const ox = dx * k * s;
        const oy = dy * k * s;
        return { x: cx + ox * cos - oy * sin, y: cy + ox * sin + oy * cos };
      });
    },
    rotateBy: radians => {
      rotation.value += radians;
    },
    scaleBy: factor => {
      scale.value *= factor;
    },
  }));

  const planStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}rad` },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.plan,
            { left: initial.centerX - boxW / 2, top: initial.centerY - boxH / 2, width: boxW, height: boxH },
            planStyle,
          ]}
        >
          <View style={{ position: 'absolute', left: -box.minX * k, top: -box.minY * k }}>
            <Background width={data.width * k} height={data.height * k} />
            <View style={StyleSheet.absoluteFill}>
              <Doors width={data.width * k} height={data.height * k} />
            </View>
          </View>
          {(data.icons ?? []).map(icon => {
            const Icon = icon.type === 'elevator' ? ElevatorIcon : StairsIcon;
            return (
              <View
                key={icon.id}
                style={[
                  styles.icon,
                  { left: (icon.center[0] - box.minX) * k - ICON_SIZE / 2, top: (icon.center[1] - box.minY) * k - ICON_SIZE / 2 },
                ]}
              >
                <Icon width={ICON_SIZE - 2} height={ICON_SIZE - 2} color="#1D2056" />
              </View>
            );
          })}
          {data.rooms.map(room => {
            const label = room.label ?? room.id;
            if (!label) return null;
            const [x, y] =
              room.labelAnchor ??
              room.points
                .reduce(([sx, sy], [px, py]) => [sx + px, sy + py], [0, 0])
                .map(v => v / room.points.length);
            return (
              <Text
                key={room.id}
                style={[styles.label, { left: (x - box.minX) * k - 30, top: (y - box.minY) * k - 6 }]}
              >
                {label}
              </Text>
            );
          })}
        </Animated.View>
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  plan: {
    position: 'absolute',
    overflow: 'hidden',
    opacity: 0.75,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  icon: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  label: {
    position: 'absolute',
    width: 60,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '600',
    color: '#1D2056',
  },
});
