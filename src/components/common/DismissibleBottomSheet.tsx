import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  SlideInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export interface DismissibleBottomSheetRef {
  /** 제스처 없이도(예: 배경 탭) 같은 슬라이드다운 애니메이션으로 닫고 싶을 때 호출한다 */
  close: () => void;
}

interface Props {
  /** 애니메이션이 끝난 뒤(화면 밖으로 완전히 나간 뒤) 호출된다 - 여기서 실제로 언마운트시키면 된다 */
  onClose: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// 이 정도 이상 끌어내리거나(px) 이 정도 이상 빠르게(px/s) 스와이프하면 닫힘으로 판단한다.
const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 800;

/**
 * 아래에서 올라오는 카드/바텀시트를 손가락으로 아래로 밀어서 닫을 수 있게 해주는 래퍼.
 * 처음 뜰 때는 SlideInDown으로 부드럽게 올라온다.
 *
 * 닫힐 때는 항상 이 컴포넌트가 직접 들고 있는 translateY 애니메이션 하나로만 처리한다
 * (reanimated의 entering/exiting 레이아웃 애니메이션을 같이 쓰면, 제스처로 이미 내려간
 * 위치와 무관하게 exiting이 원래 레이아웃 위치 기준으로 또 애니메이션을 새로 시작해버려서
 * 끝부분에서 스냅/끊김이 생긴다). 그래서 제스처로 닫히든, ref.close()로 닫히든 항상 같은
 * withTiming 애니메이션이 다 끝난 뒤에만 onClose를 호출해 언마운트시킨다.
 */
export const DismissibleBottomSheet = forwardRef<DismissibleBottomSheetRef, Props>(
  function DismissibleBottomSheet({ onClose, children, style }, ref) {
    const translateY = useSharedValue(0);
    const sheetHeight = useSharedValue(0);

    const animateClose = () => {
      // 화면 밖으로 완전히 나갈 때까지는 최소한 sheetHeight만큼(모르면 넉넉히 1000) 더 내려가야 한다.
      const target = Math.max(sheetHeight.value || 1000, translateY.value + 400);
      translateY.value = withTiming(target, { duration: 220, easing: Easing.in(Easing.cubic) }, finished => {
        if (finished) runOnJS(onClose)();
      });
    };

    useImperativeHandle(ref, () => ({ close: animateClose }));

    const pan = Gesture.Pan()
      .activeOffsetY(10)
      .failOffsetX([-15, 15])
      .onUpdate(event => {
        // 위로는 못 끌어올리게 0에서 막는다.
        translateY.value = Math.max(0, event.translationY);
      })
      .onEnd(event => {
        const shouldDismiss = event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY;
        if (shouldDismiss) {
          runOnJS(animateClose)();
        } else {
          translateY.value = withSpring(0, { damping: 22, stiffness: 320 });
        }
      });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    return (
      <GestureDetector gesture={pan}>
        <Animated.View
          entering={SlideInDown.duration(280).easing(Easing.out(Easing.cubic))}
          onLayout={event => {
            sheetHeight.value = event.nativeEvent.layout.height;
          }}
          style={[style, animatedStyle]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    );
  },
);
