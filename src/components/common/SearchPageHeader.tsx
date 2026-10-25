import React from 'react';
import { Pressable, View } from 'react-native';
import styled from 'styled-components/native';
import ChevronLeftIcon from '@assets/svgs/icons/chevronLeft.svg';
import { SearchBar } from './SearchBar';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
  onVoicePress?: () => void;
  isListening?: boolean;
  onBackPress?: () => void;
}

/**
 * 캠퍼스맵 메인홈의 검색창(SearchBar)을 누르면 이동하는 검색 페이지 상단 UI.
 * 뒤로가기 버튼 + 포커스된 검색창(음성검색 버튼 포함)으로 구성된다.
 */
export function SearchPageHeader({
  value,
  onChangeText,
  placeholder,
  onSubmitEditing,
  onVoicePress,
  isListening,
  onBackPress,
}: Props) {
  return (
    <Container>
      <BackButton onPress={onBackPress} hitSlop={8}>
        <ChevronLeftIcon width={24} height={24} />
      </BackButton>
      <View style={{ flex: 1 }}>
        <SearchBar
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          onSubmitEditing={onSubmitEditing}
          onVoicePress={onVoicePress}
          isListening={isListening}
          variant="active"
          autoFocus
        />
      </View>
    </Container>
  );
}

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding-horizontal: 20px;
`;

const BackButton = styled(Pressable)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;
