import React from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import XCircleIcon from '@assets/svgs/icons/xCircle.svg';

interface Props {
  icon: React.FC<SvgProps>;
  value: string;
  placeholder: string;
  /** 누르면 검색 화면으로 이동한다. 직접 타이핑하는 입력창이 아니라 탭-투-서치 버튼이다. */
  onPress: () => void;
  /** 값이 채워지면(Figma "길 찾기_경로 선택") 오른쪽에 GPS 대신 지우기(x) 버튼이 뜬다. */
  onClear?: () => void;
  /** 값이 비어 있을 때만 보이는 부가 버튼 (출발지 입력창의 GPS 버튼) */
  rightSlot?: React.ReactNode;
  /** true면 모양은 그대로 두고 필드/지우기 버튼 터치만 막는다 (경로 보기 카드를 접었을 때). */
  disabled?: boolean;
}

/**
 * 길찾기 화면의 출발지/도착지 입력창. Figma "NavigationInputStart"/"NavigationInputEnd"(720:10255, 720:10405)
 * 와 값이 채워진 "navigation input_start/end"(720:10872, 720:10873)를 합쳤다.
 * 왼쪽 아이콘만 다르고(출발: navigation 화살표, 도착: marker) 나머지 모양은 같아서 하나로 합쳤다.
 * 여기서 직접 타이핑하지 않고, 누르면 검색 화면(RouteLocationSearchScreen)으로 이동해 거기서
 * 고른 결과가 이 필드의 값으로 돌아온다.
 */
export function RouteInputField({ icon: Icon, value, placeholder, onPress, onClear, rightSlot, disabled = false }: Props) {
  const theme = useTheme();
  const hasValue = value.length > 0;

  return (
    <Container onPress={onPress} disabled={disabled}>
      <Icon width={20} height={20} color={hasValue ? theme.blue[700] : theme.semantic.line.primary} />
      <Label hasValue={hasValue} numberOfLines={1}>
        {hasValue ? value : placeholder}
      </Label>
      {hasValue ? (
        onClear && (
          <ClearButton onPress={onClear} disabled={disabled} hitSlop={8}>
            <XCircleIcon width={18} height={18} color={theme.semantic.text.tertiary} />
          </ClearButton>
        )
      ) : (
        rightSlot
      )}
    </Container>
  );
}

const ClearButton = styled(Pressable)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

const Container = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  height: 48px;
  width: 100%;
  padding: 12px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.semantic.line.secondary};
  border-radius: 8px;
`;

const Label = styled.Text<{ hasValue: boolean }>`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.medium.fontSize}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.medium.letterSpacing}px;
  color: ${({ theme, hasValue }) => (hasValue ? theme.semantic.text.primary : theme.semantic.text.tertiary)};
`;
