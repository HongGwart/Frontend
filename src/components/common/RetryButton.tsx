import React from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';

interface Props {
  onPress: () => void;
  /** 기본 "다시 시도" */
  label?: string;
}

/**
 * 서버 요청이 실패한 자리(길찾기 목록·길 안내·검색 결과)에 문구 아래로 붙이는 작은 "다시 시도" 버튼.
 * 화면을 나갔다 들어오지 않아도 그 자리에서 다시 요청할 수 있게 한다.
 */
export function RetryButton({ onPress, label = '다시 시도' }: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <Pill pressed={pressed}>
          <Label>{label}</Label>
        </Pill>
      )}
    </Pressable>
  );
}

const Pill = styled.View<{ pressed: boolean }>`
  padding: 8px 16px;
  border-radius: 100px;
  background-color: ${({ theme, pressed }) => (pressed ? theme.semantic.line.tertiary : theme.semantic.background.fill)};
`;

const Label = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;
