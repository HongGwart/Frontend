import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import styled from 'styled-components/native';
import { Toast } from '@components/common/Toast';

interface Props {
  text: string;
  variant?: 'warning' | 'success';
  /** 노출 유지 시간(ms). 이후 사라지는 애니메이션이 시작된다. 기본 2000 */
  duration?: number;
  /** 화면 하단에서 띄울 때 아래 여백(px). 기본 32 (홈 인디케이터 높이) */
  bottomOffset?: number;
  /** 사라지는 애니메이션까지 끝났을 때 호출. 보통 여기서 부모가 언마운트한다. */
  onHide: () => void;
}

const ENTER_MS = 250;
const EXIT_MS = 200;
// 시작/끝 지점(화면 밖 아래쪽으로 밀어두는 거리)
const OFFSCREEN = 80;

/**
 * 공통 Toast를 화면 하단에 고정으로 띄우고, "아래 → 위"로 나타났다가 duration 후
 * "위 → 아래"로 사라지는 애니메이션 + 자동 숨김을 담당하는 래퍼.
 * 타이밍/애니메이션은 Toast의 책임이 아니라서(주석 참고) 이쪽에서 관리한다.
 */
export function AnimatedToast({
  text,
  variant = 'success',
  duration = 2000,
  bottomOffset = 32,
  onHide,
}: Props) {
  const progress = useRef(new Animated.Value(0)).current; // 0 = 숨김(아래), 1 = 표시
  // onHide는 항상 최신 것을 쓰되, 종료 애니메이션 타이머는 재시작하지 않도록 ref로 들고 있는다.
  // (렌더 중 ref를 건드리면 순수성 위반이라 effect에서 갱신한다.)
  const onHideRef = useRef(onHide);
  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: ENTER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: EXIT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onHideRef.current();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [progress, duration]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [OFFSCREEN, 0],
  });

  return (
    <Wrapper
      style={{ bottom: bottomOffset, opacity: progress, transform: [{ translateY }] }}
      pointerEvents="none"
    >
      <Toast text={text} variant={variant} />
    </Wrapper>
  );
}

const Wrapper = styled(Animated.View)`
  position: absolute;
  left: 20px;
  right: 20px;
`;
