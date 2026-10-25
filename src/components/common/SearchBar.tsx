import React, { useRef, useState } from 'react';
import { Pressable, TextInput as RNTextInput } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import SearchIcon from '@assets/svgs/icons/search.svg';
import VoiceIcon from '@assets/svgs/icons/voice.svg';
import XCircleIcon from '@assets/svgs/icons/xCircle.svg';
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
  /** 음성 인식이 진행 중인지. true면 마이크 아이콘 색이 강조색으로 바뀐다 */
  isListening?: boolean;
  autoFocus?: boolean;
  /**
   * 전달하면 검색창이 입력 불가 상태(editable=false)가 되고, 탭 시 텍스트 입력 대신
   * 이 콜백만 호출된다. 캠퍼스맵 메인홈처럼 "누르면 검색 페이지로 이동"하는 용도.
   */
  onPress?: () => void;
  /**
   * true면 온보딩 검색 목업(Figma 1257:44935)처럼 훨씬 작은 크기로 그린다
   * (높이 34.79px, 세로 패딩 8.7px, 가로 패딩 11.6px, radius 8.7px, 폰트 11.6px).
   * variant와 무관하게 끝에 x_search 아이콘도 항상 붙는다. 기본값 false는 앱
   * 전역에서 쓰는 원래 크기(48px) 그대로.
   */
  compact?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = '강의실 또는 시설을 검색하세요',
  onSubmitEditing,
  variant = 'default',
  onVoicePress,
  isListening = false,
  autoFocus,
  onPress,
  compact = false,
}: Props) {
  const theme = useTheme();
  const isActive = variant === 'active';
  const inputRef = useRef<RNTextInput>(null);
  // active 검색창은 실제로 포커스가 잡혀 있을 때만 파란 테두리를 쓰고, 포커스가
  // 빠지면 메인홈 기본 검색창과 동일한 테두리로 돌아간다.
  const [isFocused, setIsFocused] = useState(Boolean(autoFocus));
  // 바운스가 필요한 경우(home 탭-이동형이거나 active 검색창) 눌림 판정을 바깥 Pressable이
  // 전담하도록 TextInput의 터치를 막는다. active일 때는 대신 ref로 직접 focus를 준다.
  const wrapsWithBounce = Boolean(onPress) || isActive;
  const iconSize = compact ? 15 : 20;

  const content = (
    <Container active={isActive && isFocused} compact={compact}>
      <SearchIcon width={iconSize} height={iconSize} />
      <Input
        ref={inputRef}
        compact={compact}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.semantic.text.tertiary}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        returnKeyType="search"
        autoFocus={autoFocus}
        editable={!onPress}
        pointerEvents={wrapsWithBounce ? 'none' : 'auto'}
      />
      {isActive &&
        (value.length > 0 ? (
          <VoiceButton onPress={() => onChangeText('')} hitSlop={8}>
            <XCircleIcon width={18} height={18} color={theme.semantic.text.tertiary} />
          </VoiceButton>
        ) : (
          <VoiceButton onPress={onVoicePress} hitSlop={8}>
            <VoiceIcon
              width={16}
              height={20}
              color={isListening ? theme.blue[500] : theme.semantic.text.tertiary}
            />
          </VoiceButton>
        ))}
      {/* compact(온보딩 검색 목업)는 항상 x_search 아이콘이 붙어 있는 Figma
          디자인(1257:44935)이라, active 여부/입력값과 무관하게 그린다. */}
      {compact && !isActive && (
        <XCircleIcon width={iconSize} height={iconSize} color={theme.semantic.text.tertiary} />
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

const Container = styled.View<{ active: boolean; compact: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${({ compact }) => (compact ? '5.799px' : '8px')};
  height: ${({ compact }) => (compact ? '34.792px' : '48px')};
  padding: ${({ compact }) => (compact ? '8.698px 11.597px' : '0px 16px')};
  background-color: ${({ theme }) => theme.semantic.background.fill};
  border-width: 1px;
  border-color: ${({ theme, active }) => (active ? theme.blue[300] : theme.semantic.line.primary)};
  border-radius: ${({ compact }) => (compact ? '8.698px' : '12px')};
  /* compact(온보딩 검색 목업)만 Figma box-shadow 적용: 0 4px 20px 0 rgba(0,0,0,0.10) */
  shadow-color: ${({ compact }) => (compact ? '#000' : 'transparent')};
  shadow-offset: 0px 4px;
  shadow-opacity: ${({ compact }) => (compact ? 0.1 : 0)};
  shadow-radius: 20px;
  elevation: ${({ compact }) => (compact ? 8 : 0)};
`;

const Input = styled.TextInput.attrs({
  textAlignVertical: 'center',
})<{ compact: boolean }>`
  flex: 1;
  align-self: stretch;
  padding: 0px;
  margin: 0px;
  font-family: ${({ theme }) => theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ compact, theme }) => (compact ? '11.597px' : `${theme.typography.bodyNormal.medium.fontSize}px`)};
  letter-spacing: ${({ compact, theme }) =>
    compact ? '0px' : `${theme.typography.bodyNormal.medium.letterSpacing}px`};
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const VoiceButton = styled(Pressable)`
  padding: 6px;
  border-radius: 100px;
  align-items: center;
  justify-content: center;
`;
