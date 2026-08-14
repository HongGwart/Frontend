import React, { useState } from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';

interface Props {
  label: string;
  /**
   * 'primary' - 남색 배경 CTA 버튼 (기본)
   * 'secondary' - 연회색 배경 버튼
   */
  variant?: 'primary' | 'secondary';
  /** primary에서 라벨 옆에 붙는 아이콘 (예: 건물 내부 보기의 건물 아이콘) */
  icon?: React.FC<SvgProps>;
  iconWidth?: number;
  iconHeight?: number;
  disabled?: boolean;
  onPress?: () => void;
}

/**
 * 화면 하단에 크게 붙는 CTA 버튼. Figma "button_CTA"(711:5839) 컴포넌트.
 * variant/disabled 조합과, 누르고 있는 동안의 배경색 변화까지 포함한다.
 */
export function Button({ label, variant = 'primary', icon: Icon, iconWidth = 20, iconHeight = 20, disabled, onPress }: Props) {
  const theme = useTheme();
  // Pressable의 style-as-function은 styled-components를 거치면서 못 쓰게 되므로,
  // 누르고 있는 동안의 배경 전환은 직접 상태로 들고 있는다.
  const [isPressed, setIsPressed] = useState(false);

  const textColor = disabled
    ? theme.semantic.text.tertiary
    : variant === 'secondary'
      ? theme.semantic.text.primary
      : theme.semantic.text.white;

  return (
    <Container
      variant={variant}
      disabled={Boolean(disabled)}
      pressed={isPressed}
      onPress={disabled ? undefined : onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <Label style={{ color: textColor }}>{label}</Label>
      {Icon && <Icon width={iconWidth} height={iconHeight} color={textColor} />}
    </Container>
  );
}

const Container = styled(Pressable)<{
  variant: 'primary' | 'secondary';
  disabled: boolean;
  pressed: boolean;
}>`
  width: 100%;
  height: 56px;
  padding-horizontal: 10px;
  border-radius: 12px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: ${({ theme, variant, disabled, pressed }) => {
    if (disabled) return theme.semantic.background.fill;
    if (variant === 'secondary') return pressed ? theme.semantic.line.tertiary : theme.semantic.background.fill;
    return pressed ? theme.blue[900] : theme.blue[800];
  }};
`;

const Label = styled.Text`
  font-family: ${({ theme }) => theme.typography.headline.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.headline.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.headline.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.headline.semiBold.letterSpacing}px;
`;
