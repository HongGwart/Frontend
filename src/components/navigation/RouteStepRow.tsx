import React from 'react';
import styled, { useTheme } from 'styled-components/native';
import WalkIcon from '@assets/svgs/icons/walk.svg';
import ElevatorIcon from '@assets/svgs/icons/elevator.svg';
import { RouteStep } from '@constant/dummyRouteResults';

interface Props {
  step: RouteStep;
  /** 구간 사이 구분선 (마지막 구간은 보통 false) */
  showDivider?: boolean;
}

/**
 * 경로 상세(지도) 화면의 이동 구간 한 줄. Figma "path_move"(733:3133 등).
 * 도보/엘리베이터 아이콘 + "라벨 / A → B" + 거리·소요시간으로 구성된다.
 */
export function RouteStepRow({ step, showDivider = true }: Props) {
  const theme = useTheme();
  const Icon = step.type === 'elevator' ? ElevatorIcon : WalkIcon;

  return (
    <Container showDivider={showDivider}>
      <Icon width={32} height={32} color={theme.semantic.main} />
      <Content>
        <StepLabelText>{step.label}</StepLabelText>
        <RouteText numberOfLines={1}>
          {step.from} <ArrowText>→</ArrowText> {step.to}
        </RouteText>
      </Content>
      <SummaryText>
        {step.distanceMeters}m · {step.durationMinutes}분
      </SummaryText>
    </Container>
  );
}

const Container = styled.View<{ showDivider: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding-vertical: 12px;
  border-bottom-width: ${({ showDivider }) => (showDivider ? '1px' : '0px')};
  border-bottom-color: ${({ theme }) => theme.semantic.line.tertiary};
`;

const Content = styled.View`
  flex: 1;
`;

const StepLabelText = styled.Text`
  font-family: ${({ theme }) => theme.typography.caption.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.caption.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.caption.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.caption.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const RouteText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const ArrowText = styled.Text`
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const SummaryText = styled.Text`
  font-family: ${({ theme }) => theme.typography.caption.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.caption.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.caption.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.caption.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
