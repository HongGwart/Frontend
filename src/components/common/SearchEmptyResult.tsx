import React from 'react';
import styled, { useTheme } from 'styled-components/native';
import SearchIcon from '@assets/svgs/icons/search.svg';
import { getErrorMessage } from '@api/errors';
import { RetryButton } from './RetryButton';

interface Props {
  /** 검색 요청이 실패했으면 그 에러 — "검색 결과가 없어요" 대신 실패 원인과 "다시 시도"를 보여준다 */
  error?: unknown;
  onRetry?: () => void;
}

/**
 * 검색어에 해당하는 결과가 하나도 없을 때(또는 검색 요청이 실패했을 때) 보여주는 빈 상태 화면. 검색·길찾기 장소 검색·
 * 기본 출발지 설정이 같이 쓴다. 부모 스크롤의 contentContainerStyle에 flexGrow: 1을 주면 남은 공간의 정중앙에 온다.
 */
export function SearchEmptyResult({ error, onRetry }: Props) {
  const theme = useTheme();
  const failed = error !== undefined;
  return (
    <Container>
      <IconCircle>
        <SearchIcon width={28} height={28} color={theme.semantic.text.tertiary} />
      </IconCircle>
      <TitleText>{failed ? '검색 결과를 불러오지 못했어요' : '검색 결과가 없어요'}</TitleText>
      <SubtitleText>{failed ? getErrorMessage(error) : '다른 검색어로 다시 시도해 보세요'}</SubtitleText>
      {failed && onRetry && <RetryButton onPress={onRetry} />}
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
