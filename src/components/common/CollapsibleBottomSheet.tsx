import React, { useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

interface Props {
  /** 접혔을 때 화면 아래에 남겨둘 시트 윗부분 높이(px). 그래버 + 하단 세이프에어리어 정도. */
  peekHeight: number;
  /** 펼침/접힘 스냅이 끝날 때마다 호출된다 (true = 접힘). */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** 시트 높이가 잡히거나 바뀔 때 호출된다 — 지도 패딩 계산 등에 쓴다. */
  onHeightChange?: (height: number) => void;
  /**
   * 시트 안 ScrollView의 현재 스크롤 위치. 넘기면 스크롤이 맨 위일 때만 아래로 끌어서
   * 접을 수 있고, 그 외에는 드래그를 스크롤에 양보한다.
   */
  scrollOffset?: SharedValue<number>;
  /** 그래버 아래 본문. 접히는 동안 페이드아웃돼서 peek 영역엔 그래버만 보인다. */
  children: React.ReactNode;
  /** 그래버 등 접혀도 항상 보여야 하는 시트 윗부분. */
  header?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// 이 정도 이상 빠르게(px/s) 플릭하면 거리와 상관없이 그 방향으로 스냅한다.
const SNAP_VELOCITY = 500;
// 손가락이 이 정도(px) 이상 세로로 움직여야 드래그로 본다 — 그 전엔 탭/스크롤 후보.
const ACTIVATION_DISTANCE = 8;
// stiffness/damping을 같은 비율로 올려서 튕기는 느낌
const SPRING = { damping: 30, stiffness: 250 };

/**
 * 아래로 밀면 peekHeight만 남기고 접히고, 다시 위로 밀거나 남은 부분을 탭하면 펼쳐지는 바텀시트.
 * DismissibleBottomSheet와 달리 사라지지 않고 펼침(0) / 접힘(height - peekHeight) 두 지점에 멈춘다.
 *
 * 안에 ScrollView가 있어도 부딪치지 않도록 manualActivation으로 직접 판정한다: 접힌 상태에선
 * 세로 드래그를 모두 시트가 가져가고, 펼친 상태에선 스크롤이 맨 위에서 "아래로" 끌 때만
 * 가져간다(ScrollView는 bounces={false}로 둬야 그 순간 같이 튕기지 않는다).
 */
export function CollapsibleBottomSheet({
  peekHeight,
  onCollapsedChange,
  onHeightChange,
  scrollOffset,
  children,
  header,
  style,
}: Props) {
  const translateY = useSharedValue(0);
  const sheetHeight = useSharedValue(0);
  const collapsed = useSharedValue(false);
  const dragStartY = useSharedValue(0);
  const touchStartY = useSharedValue(0);

  // DismissibleBottomSheet와 같은 이유로 제스처 객체는 메모이즈해서, 드래그 중 리렌더가 나도
  // 진행 중인 제스처가 끊기지 않게 한다.
  const pan = useMemo(() => {
    const snapTo = (toCollapsed: boolean) => {
      'worklet';
      const target = toCollapsed ? Math.max(0, sheetHeight.value - peekHeight) : 0;
      translateY.value = withSpring(target, SPRING);
      if (collapsed.value !== toCollapsed) {
        collapsed.value = toCollapsed;
        if (onCollapsedChange) scheduleOnRN(onCollapsedChange, toCollapsed);
      }
    };

    return Gesture.Pan()
      .manualActivation(true)
      .onTouchesDown((event, manager) => {
        touchStartY.value = event.allTouches[0].absoluteY;
        manager.begin();
      })
      .onTouchesMove((event, manager) => {
        const dy = event.allTouches[0].absoluteY - touchStartY.value;
        if (Math.abs(dy) < ACTIVATION_DISTANCE) return;
        const scrolledToTop = !scrollOffset || scrollOffset.value <= 0;
        if (collapsed.value || (dy > 0 && scrolledToTop)) {
          manager.activate();
        } else {
          manager.fail();
        }
      })
      .onTouchesUp((event, manager) => {
        // 드래그로 활성화되지 않은 채 손을 뗐다 = 탭. 접혀 있을 때 탭하면 펼친다.
        if (collapsed.value) {
          const dy = event.changedTouches[0].absoluteY - touchStartY.value;
          if (Math.abs(dy) < ACTIVATION_DISTANCE) snapTo(false);
        }
        manager.end();
      })
      .onStart(() => {
        dragStartY.value = translateY.value;
      })
      .onUpdate(event => {
        const maxOffset = Math.max(0, sheetHeight.value - peekHeight);
        translateY.value = Math.min(maxOffset, Math.max(0, dragStartY.value + event.translationY));
      })
      .onEnd(event => {
        const maxOffset = Math.max(0, sheetHeight.value - peekHeight);
        if (event.velocityY > SNAP_VELOCITY) snapTo(true);
        else if (event.velocityY < -SNAP_VELOCITY) snapTo(false);
        else snapTo(translateY.value > maxOffset / 2);
      });
  }, [peekHeight, onCollapsedChange, scrollOffset, translateY, sheetHeight, collapsed, dragStartY, touchStartY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // 접히는 거리의 앞쪽 60% 동안 본문을 페이드아웃 — peek 영역에 본문 윗부분이 잘려 보이지 않게.
  const bodyStyle = useAnimatedStyle(() => {
    const maxOffset = Math.max(1, sheetHeight.value - peekHeight);
    return { opacity: interpolate(translateY.value, [0, maxOffset * 0.6], [1, 0], 'clamp') };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={event => {
          const { height } = event.nativeEvent.layout;
          sheetHeight.value = height;
          // 접힌 상태에서 높이가 바뀌면 새 높이 기준 접힘 위치로 다시 맞춘다.
          if (collapsed.value) translateY.value = Math.max(0, height - peekHeight);
          onHeightChange?.(height);
        }}
        style={[style, sheetStyle]}
      >
        {header}
        <Animated.View style={[{ width: '100%' }, bodyStyle]}>{children}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
