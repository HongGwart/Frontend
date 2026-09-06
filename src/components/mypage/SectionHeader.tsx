import React from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';

interface Props {
  title: string;
  /** 우측에 붙는 보조 텍스트 (예: "더보기", "길찾기 시 기본으로 사용해요") */
  action?: string;
  /**
   * 'link'  - 눌러서 이동하는 링크 느낌 (label_normal/medium, text_secondary). 기본값.
   * 'hint'  - 그냥 설명 문구 (caption/medium, text_tertiary)
   */
  actionVariant?: 'link' | 'hint';
  onActionPress?: () => void;
  /**
   * true면 흰 배경 + pt16/pb8/px20 (Figma "즐겨찾기" 헤더).
   * false(기본)면 배경/좌우 패딩 없이 세로 패딩만 가진다. 좌우 여백은 부모가 잡아준다("기본 출발지" 헤더).
   */
  filled?: boolean;
}

/**
 * 마이페이지의 섹션 구분 헤더. 왼쪽 제목(body_normal/semibold) + 오른쪽 보조 텍스트로 구성된다.
 */
export function SectionHeader({ title, action, actionVariant = 'link', onActionPress, filled = false }: Props) {
  return (
    <Container filled={filled}>
      <Title>{title}</Title>
      {action ? (
        actionVariant === 'link' ? (
          <Pressable onPress={onActionPress} hitSlop={8}>
            <ActionText>{action}</ActionText>
          </Pressable>
        ) : (
          <HintText>{action}</HintText>
        )
      ) : null}
    </Container>
  );
}

const Container = styled.View<{ filled: boolean }>`
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  ${({ theme, filled }) =>
    filled
      ? `background-color: ${theme.semantic.background.primary};
         padding: 16px 20px 8px;`
      : ''}
`;

const Title = styled.Text`
  font-family: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const ActionText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
  text-align: right;
`;

const HintText = styled.Text`
  font-family: ${({ theme }) => theme.typography.caption.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.caption.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.caption.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.caption.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
