import React from 'react';
import styled, { useTheme } from 'styled-components/native';
import WalkIcon from '@assets/svgs/icons/walk.svg';
import ElevatorIcon from '@assets/svgs/icons/elevator.svg';
import IndoorIcon from '@assets/svgs/icons/indoor.svg';
import StairsIcon from '@assets/svgs/icons/stairs.svg';
import { RouteStep } from '@appTypes/routeView';
import { ElevatorCongestionIcon } from './ElevatorCongestionIcon';

interface Props {
  step: RouteStep;
  /** 구간 사이 구분선 (마지막 구간은 보통 false) */
  showDivider?: boolean;
}

// 경로 카드(RouteResultCard)와 같은 아이콘을 써서 두 화면의 이동 방식 표시를 맞춘다.
const STEP_ICONS = {
  walk: WalkIcon,
  indoor: IndoorIcon,
  stairs: StairsIcon,
  elevator: ElevatorIcon,
} as const;

/**
 * 경로 상세(지도) 화면의 이동 구간 한 줄. Figma "path_move"(733:3133 등).
 * 이동 방식(도보·실내·계단·엘리베이터) 아이콘 + "라벨 / A → B" + 거리·소요시간으로 구성된다. 혼잡 예상 엘리베이터 구간은 라벨 옆에
 * 경로 카드(RouteResultCard)와 같은 경고 아이콘을 붙인다.
 */
export function RouteStepRow({ step, showDivider = true }: Props) {
  const theme = useTheme();
  const Icon = STEP_ICONS[step.type];
  // 층 이동(엘리베이터·계단)은 위아래로 움직여서 서버 거리가 0m이거나 의미가 없고, 걸은 게 없는 구간(통로
  // 엘리베이터만 탄 경우)도 0m라서 "0m · 1분" 대신 시간만 보여준다.
  const showDistance = (step.type === 'walk' || step.type === 'indoor') && step.distanceMeters > 0;

  return (
    <Container showDivider={showDivider}>
      <Icon width={32} height={32} color={theme.semantic.main} />
      <Content>
        <LabelRow>
          <StepLabelText>{step.label}</StepLabelText>
          {step.congested && <ElevatorCongestionIcon />}
        </LabelRow>
        <RouteText numberOfLines={1}>
          {step.to ? (
            <>
              {step.from} <ArrowText>→</ArrowText> {step.to}
            </>
          ) : (
            step.from
          )}
        </RouteText>
      </Content>
      <SummaryText>
        {showDistance ? `${step.distanceMeters}m · ${step.durationText}` : step.durationText}
      </SummaryText>
    </Container>
  );
}

const LabelRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

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
