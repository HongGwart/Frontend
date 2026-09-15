import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  AnimatedStyle,
  Easing,
  SharedValue,
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
  /**
   * 위로 끌어올리면(일정 거리 이상 또는 빠르게 플릭) 호출된다 — 상세 화면으로 넘어가는 등에 쓴다.
   * 넘기지 않으면 기존처럼 위로는 안 끌리고 아래로 내리는 동작만 지원한다.
   */
  onSwipeUp?: () => void;
  /**
   * 드래그 중인 translateY를 실시간으로 들여다보고 싶은 쪽(예: 카드를 올리는 동안 그
   * 뒤에 다음 화면 미리보기를 겹쳐 그리는 MapScreen)에 넘겨준다. 넘기면 내부에서 새로
   * 만들지 않고 이 값을 그대로 써서, 부모가 매 프레임 같은 값을 관찰할 수 있게 한다.
   */
  translateY?: SharedValue<number>;
  /**
   * true면 매 프레임 다시 그리는 대신 한 번 래스터화한 텍스처를 그대로 이동만 시킨다.
   * 안에 무거운(용량 큰) 이미지가 있어서 드래그 중 버벅이는 카드(onSwipeUp 지원하는
   * 카드 등)에서 켠다 — 평소엔 굳이 켤 필요 없는 최적화라 기본은 꺼둔다.
   */
  rasterize?: boolean;
  /**
   * 슬라이드업이 커밋됐을 때 최소 이 정도(px)는 밀어올린 뒤에 onSwipeUp을 부른다. 기본은
   * 카드 자기 높이만큼(화면 밖으로 나가는 정도)이지만, 부모가 이 카드 뒤에 그리는 다음
   * 화면 미리보기가 완전히 자리잡는 데 더 먼 거리가 필요하면(예: 화면 높이 기준) 이걸로
   * 늘려서 — onSwipeUp이 그 미리보기보다 먼저 끝나(중간에 실제 화면으로 툭 끊겨
   * 바뀌어) 보이지 않게 한다.
   */
  minSwipeUpDistance?: number;
  children: React.ReactNode;
  // 부모가 useAnimatedStyle 결과(예: 페이드아웃용 opacity)를 배열에 같이 넘길 수 있게
  // AnimatedStyle도 허용한다.
  style?: StyleProp<ViewStyle> | AnimatedStyle<ViewStyle> | (StyleProp<ViewStyle> | AnimatedStyle<ViewStyle>)[];
}

// 이 정도 이상 끌어내리거나(px) 이 정도 이상 빠르게(px/s) 스와이프하면 닫힘으로 판단한다.
const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 800;
// 위로 끌어올릴 때는 더 짧은 거리로도(적당히 튕기는 느낌으로) 인정한다.
export const SWIPE_UP_DISTANCE = 80;
const SWIPE_UP_VELOCITY = -800;

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
  function DismissibleBottomSheet(
    { onClose, onSwipeUp, translateY: externalTranslateY, rasterize, minSwipeUpDistance, children, style },
    ref,
  ) {
    // useSharedValue는 항상 호출해야 하니(훅 규칙), 부모가 넘긴 값이 있으면 그걸 쓰고
    // 없으면 이 내부 값을 fallback으로 쓴다.
    const internalTranslateY = useSharedValue(0);
    const translateY = externalTranslateY ?? internalTranslateY;
    const sheetHeight = useSharedValue(0);

    const animateClose = () => {
      // 화면 밖으로 완전히 나갈 때까지는 최소한 sheetHeight만큼(모르면 넉넉히 1000) 더 내려가야 한다.
      const target = Math.max(sheetHeight.value || 1000, translateY.value + 400);
      translateY.value = withTiming(target, { duration: 220, easing: Easing.in(Easing.cubic) }, finished => {
        if (finished) runOnJS(onClose)();
      });
    };

    // animateClose와 대칭 — 화면 위로 완전히 나갈 때까지 밀어올린 뒤 onSwipeUp을 호출한다.
    // onClose처럼 이 시점에 언마운트시키는 건 호출하는 쪽(onSwipeUp) 책임이다.
    const animateSwipeUp = () => {
      const requiredMagnitude = minSwipeUpDistance ?? (sheetHeight.value || 1000);
      const target = Math.min(-requiredMagnitude, translateY.value - 400);
      translateY.value = withTiming(target, { duration: 220, easing: Easing.in(Easing.cubic) }, finished => {
        if (finished && onSwipeUp) runOnJS(onSwipeUp)();
      });
    };

    useImperativeHandle(ref, () => ({ close: animateClose }));

    const pan = Gesture.Pan()
      // 단일 양수(10)를 주면 아래쪽으로만 10px 이상 움직여야 활성화된다 — onSwipeUp을
      // 지원하는 카드는 위로도 끌 수 있어야 하니 양방향([-10, 10])으로 열어준다.
      .activeOffsetY(onSwipeUp ? [-10, 10] : 10)
      .failOffsetX([-15, 15])
      .onUpdate(event => {
        // onSwipeUp이 있을 때만 위로 끌어올리는 걸 허용한다 — 없으면 기존처럼 0에서 막는다.
        translateY.value = onSwipeUp ? event.translationY : Math.max(0, event.translationY);
      })
      .onEnd(event => {
        const shouldDismiss = event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY;
        const shouldSwipeUp =
          onSwipeUp && (event.translationY < -SWIPE_UP_DISTANCE || event.velocityY < SWIPE_UP_VELOCITY);
        if (shouldDismiss) {
          runOnJS(animateClose)();
        } else if (shouldSwipeUp) {
          runOnJS(animateSwipeUp)();
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
          renderToHardwareTextureAndroid={rasterize}
          shouldRasterizeIOS={rasterize}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    );
  },
);
