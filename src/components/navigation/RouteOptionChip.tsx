import React from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';

interface Props {
  label: string;
  icon: React.FC<SvgProps>;
  active?: boolean;
  onPress?: () => void;
}

/**
 * 길찾기 상단의 경로 옵션 칩(최단 경로/비 회피/계단 회피). Figma "chip_option"(720:10565 등).
 * 검색 필터용 Chip과 달리 그림자가 없고 테두리 색도 달라서 별도 컴포넌트로 뒀다.
 */
export function RouteOptionChip({ label, icon: Icon, active = false, onPress }: Props) {
  const theme = useTheme();
  const iconColor = active ? theme.semantic.text.white : theme.semantic.icon.secondary;

  return (
    <Container active={active} onPress={onPress}>
      <Icon width={20} height={20} color={iconColor} />
      <Label active={active}>{label}</Label>
    </Container>
  );
}

const Container = styled(Pressable)<{ active: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 6px 12px 6px 8px;
  border-radius: 100px;
  border-width: 1px;
  border-color: ${({ theme, active }) => (active ? 'transparent' : theme.semantic.line.secondary)};
  background-color: ${({ theme, active }) => (active ? theme.blue[800] : theme.semantic.background.primary)};
`;

const Label = styled.Text<{ active: boolean }>`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.semiBold.letterSpacing}px;
  color: ${({ theme, active }) => (active ? theme.semantic.text.white : theme.semantic.text.secondary)};
`;
