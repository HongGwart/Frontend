import React from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import SearchIcon from '@assets/svgs/icons/search.svg';
import XCircleIcon from '@assets/svgs/icons/xCircle.svg';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  /** x 버튼으로 비웠을 때 (onChangeText('')와 별개로 추가 처리가 필요하면) */
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}

/**
 * "기본 출발지 설정" 화면 상단 검색창(Figma "search bar" 706:1069 / 706:1156).
 * 공통 SearchBar와 달리 음성검색 버튼이 없고, 포커스 여부와 무관하게 테두리가
 * line_primary로 고정이라 마이페이지용으로 따로 뒀다. 값이 있으면 우측에 지우기(x) 버튼.
 */
export function DepartureSearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = '강의실 또는 시설을 검색하세요',
  autoFocus,
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
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={8}
        >
          <XCircleIcon width={20} height={20} color={theme.semantic.text.tertiary} />
        </Pressable>
      )}
    </Container>
  );
}

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 16px;
  background-color: ${({ theme }) => theme.semantic.background.fill};
  border-width: 1px;
  border-color: ${({ theme }) => theme.semantic.line.primary};
  border-radius: 12px;
`;

const Input = styled.TextInput.attrs({
  textAlignVertical: 'center',
})`
  flex: 1;
  align-self: stretch;
  padding: 0;
  margin: 0;
  font-family: ${({ theme }) => theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.medium.fontSize}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;
