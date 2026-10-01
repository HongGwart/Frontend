import React, { useState } from 'react';
import { Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import styled, { useTheme } from 'styled-components/native';

interface Props {
  title: string;
  /** 오른쪽 보조 값 (예: 앱 버전 "1.0.0"). 있으면 화살표 대신 이 값을 보여준다. */
  value?: string;
  /** 넘기면 누를 수 있는 행이 되고 오른쪽에 화살표(›)가 붙는다 */
  onPress?: () => void;
  /** 행 사이 구분선 (리스트 마지막은 보통 false) */
  showDivider?: boolean;
}

/**
 * 마이페이지 "서비스 정보" 같은 메뉴 목록의 한 줄. 즐겨찾기 카드(FavoritePlaceCard)와 같은 흰 배경·좌우 20px
 * 여백·누를 때 회색·하단 구분선을 써서, SectionHeader(filled) 아래에 이어 붙이면 즐겨찾기 섹션과 같은 모양이 된다.
 */
export function MenuRow({ title, value, onPress, showDivider = true }: Props) {
  const theme = useTheme();
  const [pressed, setPressed] = useState(false);

  return (
    <Container
      onPress={onPress}
      disabled={!onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      pressed={pressed}
      showDivider={showDivider}
      accessibilityRole={onPress ? 'link' : undefined}
    >
      <Title>{title}</Title>
      {value !== undefined ? (
        <Value>{value}</Value>
      ) : onPress ? (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 5l7 7-7 7"
            stroke={theme.semantic.text.tertiary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}
    </Container>
  );
}

const Container = styled(Pressable)<{ pressed: boolean; showDivider: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 20px;
  background-color: ${({ theme, pressed }) =>
    pressed ? theme.semantic.background.fill : theme.semantic.background.primary};
  border-bottom-width: ${({ showDivider }) => (showDivider ? '1px' : '0px')};
  border-bottom-color: ${({ theme }) => theme.semantic.line.tertiary};
`;

const Title = styled.Text`
  font-family: ${({ theme }) => theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const Value = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
