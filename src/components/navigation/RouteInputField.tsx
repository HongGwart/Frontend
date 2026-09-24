import React from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';

interface Props {
  icon: React.FC<SvgProps>;
  value: string;
  placeholder: string;
  /** 누르면 검색 화면으로 이동한다. 직접 타이핑하는 입력창이 아니라 탭-투-서치 버튼이다. */
  onPress: () => void;
  /** 출발지 입력창의 GPS 버튼처럼, 텍스트 오른쪽에 붙는 부가 버튼 */
  rightSlot?: React.ReactNode;
}

/**
 * 길찾기 화면의 출발지/도착지 입력창. Figma "NavigationInputStart"/"NavigationInputEnd"(720:10255, 720:10405).
 * 왼쪽 아이콘만 다르고(출발: navigation 화살표, 도착: marker) 나머지 모양은 같아서 하나로 합쳤다.
 * 여기서 직접 타이핑하지 않고, 누르면 검색 화면(RouteLocationSearchScreen)으로 이동해 거기서
 * 고른 결과가 이 필드의 값으로 돌아온다.
 */
export function RouteInputField({ icon: Icon, value, placeholder, onPress, rightSlot }: Props) {
  const theme = useTheme();
  const hasValue = value.length > 0;

  return (
    <Container onPress={onPress}>
      <Icon width={20} height={20} color={theme.semantic.line.primary} />
      <Label hasValue={hasValue} numberOfLines={1}>
        {hasValue ? value : placeholder}
      </Label>
      {rightSlot}
    </Container>
  );
}

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
