import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

interface Props extends Omit<PressableProps, 'onPress'> {
  onPress: () => void;
  children: React.ReactNode;
}

/**
 * 누르고 있는 동안 살짝 작아진 상태를 유지하고, 손을 떼면 튕기듯 원래 크기로 돌아오는
 * 바운스 애니메이션 Pressable. 버튼, 카드, 탭 가능한 검색창 등 눌리는 느낌을 주고 싶은
 * 곳이면 어디서든 재사용한다.
 */
export function BouncyPressable({ onPress, children, ...pressableProps }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 80, easing: Easing.out(Easing.quad) });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.back(2)) });
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      {...pressableProps}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}
