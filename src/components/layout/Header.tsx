import React from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';
import ChevronLeftIcon from '@assets/svgs/icons/chevronLeft.svg';

interface HeaderProps {
  title: string;
  /**
   * title 옆에 옅은 색으로 덧붙는 보조 텍스트(예: "H동" + "중앙도서관"). 건물 상세보기처럼
   * 코드+명칭을 같이 보여줘야 하는 화면에서만 쓰고, 생략하면 기존처럼 title 하나만 쓴다.
   */
  subtitle?: string;
  onBackPress?: () => void;
  /**
   * true면 배경을 투명하게 그린다(예: 길찾기 "경로 보기"처럼 지도가 헤더 뒤로 그대로
   * 비쳐야 하는 화면). 기본값 false는 기존처럼 불투명한 배경 그대로.
   */
  transparent?: boolean;
}

export default function Header({ title, subtitle, onBackPress, transparent = false }: HeaderProps) {
  return (
    <Container transparent={transparent}>
      <BackButton onPress={onBackPress} hitSlop={8}>
        <ChevronLeftIcon width={24} height={24} />
      </BackButton>
      {subtitle ? (
        <TitleRow>
          <Title numberOfLines={1} style={{ flex: 0 }}>
            {title}
          </Title>
          <Subtitle numberOfLines={1}>{subtitle}</Subtitle>
        </TitleRow>
      ) : (
        <Title numberOfLines={1}>{title}</Title>
      )}
    </Container>
  );
}

const Container = styled.View<{ transparent: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding-horizontal: 20px;
  background-color: ${({ theme, transparent }) => (transparent ? 'transparent' : theme.semantic.background.primary)};
`;

const BackButton = styled(Pressable)`
  position: absolute;
  left: 20px;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

const Title = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.headline.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.headline.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.headline.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) =>
    theme.typography.headline.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
  text-align: center;
`;

const TitleRow = styled.View`
  flex: 1;
  flex-direction: row;
  gap: 4px;
  align-items: center;
  justify-content: center;
`;

const Subtitle = styled(Title)`
  flex: 0;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
