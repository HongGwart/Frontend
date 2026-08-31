import React from 'react';
import styled from 'styled-components/native';

// TODO: 실제 마이페이지 화면이 나오면 이 자리에 구현한다. 상단 헤더는 이미
// MainTabNavigator가 타이틀("마이페이지")을 보여주고 있어서, 여기서는 본문만 그린다.
export default function MypageScreen() {
  return (
    <Container>
      <PlaceholderText>마이페이지</PlaceholderText>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

const PlaceholderText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
