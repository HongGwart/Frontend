import React from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';
import ChevronLeftIcon from '@assets/svgs/icons/chevronLeft.svg';

interface HeaderProps {
  title: string;
  onBackPress?: () => void;
}

export default function Header({ title, onBackPress }: HeaderProps) {
  return (
    <Container>
      <BackButton onPress={onBackPress} hitSlop={8}>
        <ChevronLeftIcon width={24} height={24} />
      </BackButton>
      <Title numberOfLines={1}>{title}</Title>
    </Container>
  );
}

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding-horizontal: 20px;
  background-color: ${({ theme }) => theme.semantic.background.primary};
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
