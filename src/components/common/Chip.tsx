import React, { useEffect } from 'react';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { BouncyPressable } from './BouncyPressable';

interface Props {
  label: string;
  /** true면 강조(선택) 상태 - 남색 배경 + 흰 텍스트/아이콘 */
  active?: boolean;
  onPress?: () => void;
  /** true면 탭이 아예 안 먹힌다(바운스/햅틱 포함) - 온보딩처럼 자동 재생되는 데모용 칩에 쓴다. */
  disabled?: boolean;
  /**
   * true면 active가 false→true로 바뀔 때마다, 마치 사용자가 직접 눌러서 선택한 것처럼
   * BouncyPressable과 같은 눌림 바운스를 자동으로 재생한다. disabled 칩을 자동 순환시킬
   * 때(예: 온보딩 데모) onPress 없이도 탭한 느낌을 주기 위한 용도.
   */
  bounceOnActivate?: boolean;
  /** 카테고리 아이콘. 즐겨찾기(별)처럼 자체 고정 색을 쓰는 아이콘은 color prop을 무시해도 된다. */
  icon?: React.FC<SvgProps>;
  iconWidth?: number;
  iconHeight?: number;
  /**
   * true(기본)면 지도 위에 떠 있는 칩처럼 그림자를 깐다(검색 페이지 필터 칩).
   * 화면 안에 정적으로 나열되는 칩(예: 주변상권 카테고리 칩)에서는 칩 사이 gap에
   * 그림자가 번져 보이는 회색 띠로 보이니 false로 꺼서 쓴다.
   */
  elevated?: boolean;
}

/**
 * 검색 페이지 등에서 쓰는 카테고리 필터 칩. active 여부에 따라 배경/테두리/텍스트·아이콘
 * 색이 토글된다. icon을 넘기지 않으면 텍스트만 있는 칩(즐겨찾기 외 "no icon" variant)이 된다.
 */
export function Chip({
  label,
  active = false,
  onPress,
  disabled = false,
  bounceOnActivate = false,
  icon: Icon,
  iconWidth = 16,
  iconHeight = 16,
  elevated = true,
}: Props) {
  const theme = useTheme();
  const contentColor = active ? theme.semantic.text.white : theme.semantic.text.tertiary;

  // 토스 인터랙션 느낌: 선택 안 된 칩들은 "곧 선택될 것처럼" 계속 은은하게 숨 쉬듯
  // 커졌다 작아졌다를 반복(idle breathing)하고, 자기 차례가 되어 active로 켜지는
  // 순간엔 그 숨쉬기를 멈추고 통통 튀며(spring) 위로 살짝 떠오르듯 팝업된다.
  // 배경/테두리/그림자는 순간 전환이 아니라 부드럽게 번지듯 크로스페이드된다.
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);
  const activateProgress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (!bounceOnActivate) return;

    activateProgress.value = withTiming(active ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });

    if (active) {
      scale.value = withSequence(
        withSpring(1.08, { damping: 8, stiffness: 260, mass: 0.4 }),
        withSpring(1, { damping: 12, stiffness: 220 }),
      );
      lift.value = withSequence(
        withSpring(-3, { damping: 8, stiffness: 260 }),
        withSpring(0, { damping: 12, stiffness: 220 }),
      );
    } else {
      lift.value = withSpring(0, { damping: 12, stiffness: 220 });
      scale.value = withRepeat(
        withSequence(
          withTiming(1.045, { duration: 620, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.985, { duration: 620, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
    }
  }, [active, bounceOnActivate, activateProgress, scale, lift]);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: lift.value }],
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      activateProgress.value,
      [0, 1],
      [theme.semantic.background.primary, theme.blue[800]],
    ),
    borderColor: interpolateColor(activateProgress.value, [0, 1], [theme.semantic.line.primary, theme.blue[800]]),
    // 켜질수록 그림자가 살짝 더 진하고 넓게 퍼져서 "떠오른" 느낌을 더해준다.
    shadowOpacity: 0.1 + activateProgress.value * 0.1,
    shadowRadius: 20 + activateProgress.value * 6,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      activateProgress.value,
      [0, 1],
      [theme.semantic.text.tertiary, theme.semantic.text.white],
    ),
  }));

  return (
    <BouncyPressable onPress={onPress ?? (() => {})} disabled={disabled}>
      <Animated.View style={bounceOnActivate ? bounceStyle : undefined}>
        <Container
          active={active}
          hasIcon={Boolean(Icon)}
          elevated={elevated}
          style={bounceOnActivate ? animatedContainerStyle : undefined}
        >
          {Icon && <Icon width={iconWidth} height={iconHeight} color={contentColor} />}
          <Label active={active} style={bounceOnActivate ? animatedLabelStyle : undefined}>
            {label}
          </Label>
        </Container>
      </Animated.View>
    </BouncyPressable>
  );
}

const Container = styled(Animated.View)<{ active: boolean; hasIcon: boolean; elevated: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding-top: 6px;
  padding-bottom: 6px;
  padding-left: ${({ hasIcon }) => (hasIcon ? '10px' : '12px')};
  padding-right: 12px;
  border-radius: 100px;
  background-color: ${({ theme, active }) =>
    active ? theme.blue[800] : theme.semantic.background.primary};
  border-width: 1px;
  border-color: ${({ theme, active }) => (active ? 'transparent' : theme.semantic.line.primary)};
  /* Figma box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.10) - 지도 위에 뜨는 칩에서만 쓴다 */
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: ${({ elevated }) => (elevated ? 0.1 : 0)};
  shadow-radius: ${({ elevated }) => (elevated ? 20 : 0)}px;
  elevation: ${({ elevated }) => (elevated ? 8 : 0)};
`;

const Label = styled(Animated.Text)<{ active: boolean }>`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.semiBold.letterSpacing}px;
  color: ${({ theme, active }) => (active ? theme.semantic.text.white : theme.semantic.text.tertiary)};
`;
