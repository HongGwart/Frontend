import React from 'react';
import styled, { useTheme } from 'styled-components/native';
import SearchIcon from '@assets/svgs/icons/search.svg';

/**
 * 검색어에 해당하는 결과가 하나도 없을 때 보여주는 빈 상태 화면. 검색·길찾기 장소 검색·기본 출발지 설정이 같이 쓴다.
 * 부모 스크롤의 contentContainerStyle에 flexGrow: 1을 주면 남은 공간의 정중앙에 온다.
 */
export function SearchEmptyResult() {
  const theme = useTheme();
  return (
    <Container>
      <IconCircle>
        <SearchIcon width={28} height={28} color={theme.semantic.text.tertiary} />
      </IconCircle>
      <TitleText>검색 결과가 없어요</TitleText>
      <SubtitleText>다른 검색어로 다시 시도해 보세요</SubtitleText>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px 40px 96px;
`;

const IconCircle = styled.View`
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 100px;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;

const TitleText = styled.Text`
  font-family: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const SubtitleText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
