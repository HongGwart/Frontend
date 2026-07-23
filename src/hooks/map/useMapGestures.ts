import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { RoomShape } from '@types/room';
import { findRoomAtPoint } from '@utils/geometry';


interface UseMapGesturesOptions {
  rooms: RoomShape[];
  onRoomTap: (room: RoomShape) => void;
  minScale?: number;
  maxScale?: number;
}

/**
 * GestureDetector에 붙일 composedGesture와, 지도를 감싸는 Animated.View에 붙일
 * animatedStyle을 반환한다.
 *
 * 방 탭 판정은 SVG <Path onPress>가 아니라 Tap 제스처의 로컬 좌표 + point-in-polygon으로
 * 직접 처리한다. GestureDetector가 이미 responder를 점유하는 상태에서 자식 SVG의
 * onPress가 씹히는 문제를 피하기 위함. Tap 제스처의 e.x/e.y는 GestureDetector가 붙은
 * 뷰(=배경 SVG와 동일한, transform 적용 "전" 좌표계) 기준이라 원본 SVG 좌표와 그대로 맞는다.
 */
export function useMapGestures({
  rooms,
  onRoomTap,
  minScale = 1,
  maxScale = 5,
}: UseMapGesturesOptions) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const clamp = (value: number, min: number, max: number) => {
    'worklet';
    return Math.min(Math.max(value, min), max);
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, minScale, maxScale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    // 손가락이 이 정도 움직여야 팬으로 인정 -> 그 전까지는 탭 제스처에 기회를 준다
    .minDistance(6)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      const room = findRoomAtPoint(e.x, e.y, rooms);
      if (room) {
        runOnJS(onRoomTap)(room);
      }
    });

  // 핀치/팬은 동시에 굴러가야 하고, 탭은 그것들과 경합(Race)해서 움직임이 없을 때만 이긴다
  const composedGesture = Gesture.Race(
    Gesture.Simultaneous(pinchGesture, panGesture),
    tapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const resetTransform = useCallback(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  return { composedGesture, animatedStyle, resetTransform };
}