import React, { useRef } from 'react';
import { Pressable, TextInput as RNTextInput } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import SearchIcon from '@assets/svgs/icons/search.svg';
import VoiceIcon from '@assets/svgs/icons/voice.svg';
import { BouncyPressable } from './BouncyPressable';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
  /**
   * 'default' - 캠퍼스맵 메인홈에 얹히는 기본 검색창 (테두리: line_primary)
   * 'active' - 검색 페이지에서 포커스된 상태로 보여지는 검색창 (테두리: blue 300) + 음성검색 버튼
   */
  variant?: 'default' | 'active';
  onVoicePress?: () => void;
  autoFocus?: boolean;
  /**
   * 전달하면 검색창이 입력 불가 상태(editable=false)가 되고, 탭 시 텍스트 입력 대신
   * 이 콜백만 호출된다. 캠퍼스맵 메인홈처럼 "누르면 검색 페이지로 이동"하는 용도.
   */
  onPress?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = '강의실 또는 시설을 검색하세요',
  onSubmitEditing,
  variant = 'default',
  onVoicePress,
  autoFocus,
  onPress,
}: Props) {
  const theme = useTheme();
  const isActive = variant === 'active';
  const inputRef = useRef<RNTextInput>(null);
  // 바운스가 필요한 경우(home 탭-이동형이거나 active 검색창) 눌림 판정을 바깥 Pressable이
  // 전담하도록 TextInput의 터치를 막는다. active일 때는 대신 ref로 직접 focus를 준다.
  const wrapsWithBounce = Boolean(onPress) || isActive;

  const content = (
    <Container active={isActive}>
      <SearchIcon width={20} height={20} />
      <Input
        // styled-components native의 TextInput 타입 선언이 ref를 허용하지 않지만
        // 런타임에는 그대로 forwardRef 되므로 안전하게 캐스팅한다.
        // @ts-expect-error styled-components ref typing
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.semantic.text.tertiary}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="search"
        autoFocus={autoFocus}
        editable={!onPress}
        pointerEvents={wrapsWithBounce ? 'none' : 'auto'}
      />
      {isActive && (
        <VoiceButton onPress={onVoicePress} hitSlop={8}>
          <VoiceIcon width={16} height={20} />
        </VoiceButton>
      )}
    </Container>
  );

  if (onPress) {
    return <BouncyPressable onPress={onPress}>{content}</BouncyPressable>;
  }

  // 검색 페이지의 활성 검색창은 실제 입력창이라, 눌림 애니메이션은 바깥 Pressable이
  // 담당하고 탭하면 ref로 직접 포커스를 준다(TextInput이 직접 터치를 받으면 바운스가
  // 씹히는 경우가 있어 pointerEvents를 막아뒀다).
  if (isActive) {
    return (
      <BouncyPressable onPress={() => inputRef.current?.focus()}>{content}</BouncyPressable>
    );
  }

  return content;
}

const Container = styled.View<{ active: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0px 16px;
  background-color: ${({ theme }) => theme.semantic.background.fill};
  border-width: 1px;
  border-color: ${({ theme, active }) => (active ? theme.blue[300] : theme.semantic.line.primary)};
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

const VoiceButton = styled(Pressable)`
  padding: 6px;
  border-radius: 100px;
  align-items: center;
  justify-content: center;
`;
