import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  /** 현재 지도 회전각(라디안). 버튼 안 나침반 바늘을 반대로 돌려서 "북쪽이 어디였는지" 보여준다 */
  rotation: SharedValue<number>;
  onPress: () => void;
}

/**
 * 확대/이동/회전을 fitToContainer가 계산한 초기 배치로 되돌리는 버튼.
 * 지도 오른쪽 아래에 떠있는 나침반 형태 — 바늘은 지도 회전값만큼 반대로 돌아가 있어서
 * 항상 실제 "북쪽(=원래 위쪽)"을 가리킨다. 탭하면 resetTransform 호출.
 */
export function ResetViewButton({ rotation, onPress }: Props) {
  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-rotation.value}rad` }],
  }));

  return (
    <Pressable style={styles.button} onPress={onPress} hitSlop={8}>
      <Animated.View style={needleStyle}>
        <Svg width={20} height={20} viewBox="0 0 20 20">
          <Circle cx={10} cy={10} r={8.5} fill="none" stroke="#1D2056" strokeWidth={1.2} />
          {/* 북쪽을 가리키는 진한 삼각형 */}
          <Path d="M10 3.5 L12.5 10 L10 8.6 L7.5 10 Z" fill="#1D2056" />
          {/* 남쪽 절반은 옅은 색으로 대비 */}
          <Path d="M10 16.5 L7.5 10 L10 11.4 L12.5 10 Z" fill="#B9BFCC" />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
