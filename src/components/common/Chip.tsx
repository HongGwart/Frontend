import React from 'react';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import { BouncyPressable } from './BouncyPressable';

interface Props {
  label: string;
  /** true면 강조(선택) 상태 - 남색 배경 + 흰 텍스트/아이콘 */
  active?: boolean;
  onPress?: () => void;
  /** 카테고리 아이콘. 즐겨찾기(별)처럼 자체 고정 색을 쓰는 아이콘은 color prop을 무시해도 된다. */
  icon?: React.FC<SvgProps>;
  iconWidth?: number;
  iconHeight?: number;
}

/**
 * 검색 페이지 등에서 쓰는 카테고리 필터 칩. active 여부에 따라 배경/테두리/텍스트·아이콘
 * 색이 토글된다. icon을 넘기지 않으면 텍스트만 있는 칩(즐겨찾기 외 "no icon" variant)이 된다.
 */
export function Chip({ label, active = false, onPress, icon: Icon, iconWidth = 16, iconHeight = 16 }: Props) {
  const theme = useTheme();
  const contentColor = active ? theme.semantic.text.white : theme.semantic.text.tertiary;

  return (
    <BouncyPressable onPress={onPress ?? (() => {})}>
      <Container active={active} hasIcon={Boolean(Icon)}>
        {Icon && <Icon width={iconWidth} height={iconHeight} color={contentColor} />}
        <Label active={active}>{label}</Label>
      </Container>
    </BouncyPressable>
  );
}

const Container = styled.View<{ active: boolean; hasIcon: boolean }>`
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
`;

const Label = styled.Text<{ active: boolean }>`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.semiBold.letterSpacing}px;
  color: ${({ theme, active }) => (active ? theme.semantic.text.white : theme.semantic.text.tertiary)};
`;
