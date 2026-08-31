import React from 'react';
import styled from 'styled-components/native';

interface Props {
  title: string;
}

// 아직 실제 화면이 없는 탭(길찾기/주변상권/MY)에 임시로 띄우는 "준비 중" 플레이스홀더.
// 상단 헤더가 이미 title을 보여주고 있어서(MainTabNavigator 참고), 여기서는 그 title을
// 넣은 안내 문구 한 줄만 보여준다. 각 탭 화면이 만들어지면 이 컴포넌트 대신 그 화면으로
// 바꿔 끼우면 된다.
export default function ComingSoonScreen({ title }: Props) {
  return (
    <Container>
      <SubtitleText>{title}</SubtitleText>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

const SubtitleText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
