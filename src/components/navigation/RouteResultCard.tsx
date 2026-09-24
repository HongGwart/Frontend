import React from 'react';
import styled, { useTheme } from 'styled-components/native';
import IndoorIcon from '@assets/svgs/icons/indoor.svg';
import StairsIcon from '@assets/svgs/icons/stairs.svg';
import ElevatorIcon from '@assets/svgs/icons/elevator.svg';
import ToastWarningIcon from '@assets/svgs/icons/toastWarning.svg';
import { RouteResult } from '@constant/dummyRouteResults';

interface Props {
  result: RouteResult;
  /** 칩에서 고른 경로 옵션의 한글 라벨 (예: "최단 경로") */
  optionLabel: string;
  /** 카드 사이 4px 두께 구분선 (마지막 카드는 보통 false) */
  showDivider?: boolean;
}

/**
 * 길찾기 출발/도착지를 모두 설정하면 뜨는 경로 카드 한 줄. Figma "path"(720:11405 등).
 * 소요시간/거리 + 옵션 라벨, 그 아래 실내 비율과 계단/엘리베이터 정보 pill로 구성된다.
 */
export function RouteResultCard({ result, optionLabel, showDivider = true }: Props) {
  const theme = useTheme();

  return (
    <Container showDivider={showDivider}>
      <TopRow>
        <DurationBlock>
          <DurationRow>
            <DurationText>{result.durationMinutes}</DurationText>
            <DurationUnitText>분</DurationUnitText>
          </DurationRow>
          <SummaryText>{result.distanceMeters}m · 걷기</SummaryText>
        </DurationBlock>
        <OptionLabelText>{optionLabel}</OptionLabelText>
      </TopRow>

      <InfoPill>
        <InfoItem>
          <IndoorIcon width={20} height={20} color={theme.semantic.icon.secondary} />
          <InfoText>
            실내 <InfoValueText>{result.indoorPercent}%</InfoValueText>
          </InfoText>
        </InfoItem>

        {result.stairsCount !== undefined && (
          <>
            <Divider />
            <InfoItem>
              <StairsIcon width={20} height={20} color={theme.semantic.icon.secondary} />
              <InfoText>
                계단 <InfoValueText>{result.stairsCount}곳</InfoValueText>
              </InfoText>
            </InfoItem>
          </>
        )}

        {result.elevatorCount !== undefined && (
          <>
            <Divider />
            <InfoItem>
              <ElevatorIcon width={20} height={20} color={theme.semantic.icon.secondary} />
              <InfoText>
                엘리베이터 <InfoValueText>{result.elevatorCount}회</InfoValueText>
              </InfoText>
              {result.elevatorWarning && (
                <ToastWarningIcon width={16} height={16} color={theme.semantic.warning} />
              )}
            </InfoItem>
          </>
        )}
      </InfoPill>
    </Container>
  );
}

const Container = styled.View<{ showDivider: boolean }>`
  width: 100%;
  gap: 8px;
  padding: 16px 20px;
  border-bottom-width: ${({ showDivider }) => (showDivider ? '4px' : '0px')};
  border-bottom-color: ${({ theme }) => theme.semantic.line.tertiary};
`;

const TopRow = styled.View`
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
`;

const DurationBlock = styled.View`
  align-items: flex-start;
`;

const DurationRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const DurationText = styled.Text`
  font-family: ${({ theme }) => theme.typography.title.bold.fontFamily};
  font-size: ${({ theme }) => theme.typography.title.bold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.title.bold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.title.bold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const DurationUnitText = styled.Text`
  font-family: ${({ theme }) => theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.medium.fontSize}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const SummaryText = styled.Text`
  font-family: ${({ theme }) => theme.typography.caption.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.caption.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.caption.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.caption.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const OptionLabelText = styled.Text`
  font-family: ${({ theme }) => theme.typography.caption.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.caption.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.caption.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.caption.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.main};
`;

const InfoPill = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 45px;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;

const InfoItem = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const InfoText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const InfoValueText = styled.Text`
  color: ${({ theme }) => theme.blue[700]};
`;

const Divider = styled.View`
  width: 1px;
  height: 16px;
  background-color: ${({ theme }) => theme.semantic.line.secondary};
`;
