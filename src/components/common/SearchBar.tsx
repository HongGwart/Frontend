import React from 'react';
import styled, { useTheme } from 'styled-components/native';
import SearchIcon from '@assets/svgs/icons/search.svg';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = '강의실 또는 시설을 검색하세요',
  onSubmitEditing,
}: Props) {
  const theme = useTheme();

  return (
    <Container>
      <SearchIcon width={20} height={20} />
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.semantic.text.tertiary}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="search"
      />
    </Container>
  );
}

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: ${({ theme }) => theme.semantic.background.fill};
  border-width: 1px;
  border-color: ${({ theme }) => theme.semantic.line.primary};
  border-radius: 12px;
`;

const Input = styled.TextInput`
  flex: 1;
  padding: 0px;
  font-family: ${({ theme }) => theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;
