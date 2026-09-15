import React from 'react';
import styled from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import IndoorRatioIcon from '@assets/svgs/onboarding/indoorIcon.svg';
import InfoIcon from '@assets/svgs/onboarding/info.svg';

interface Props {
  durationMinutes: number;
  distanceMeters: number;
  mode?: string;
  /** 이 경로를 추천하는 이유 라벨 (예: "최단 경로", "계단 회피") */
  tagLabel?: string;
  /** 실내 구간 비율(%) */
  indoorPercent: number;
  /** 실내 비율 뱃지 옆에 붙는 두 번째 뱃지(계단/엘리베이터 등) */
  facilityIcon: React.FC<SvgProps>;
  facilityLabel: string;
  facilityValue: string;
  /** true면 두 번째 뱃지 옆에 경고성 안내(빨간 info 아이콘)가 붙는다 */
  showFacilityInfo?: boolean;
  /** 리스트 마지막 카드가 아니면 아래 구분선을 보여준다 */
  showDivider?: boolean;
}

/**
 * 길찾기 결과 목록에서 경로 하나를 요약해서 보여주는 카드(Figma "path" 720:...).
 * 온보딩 소개 화면의 목업에서 먼저 쓰지만, 실제 길찾기 결과 화면이 생기면 그대로
 * 재사용할 수 있게 값만 props로 받는 형태로 만들었다.
 */
export function RoutePathCard({
  durationMinutes,
  distanceMeters,
  mode = '걷기',
  tagLabel = '최단 경로',
  indoorPercent,
  facilityIcon: FacilityIcon,
  facilityLabel,
  facilityValue,
  showFacilityInfo = false,
  showDivider = true,
}: Props) {
  return (
    <Container showDivider={showDivider}>
      <HeaderRow>
        <DurationBlock>
          <DurationRow>
            <DurationText>{durationMinutes}</DurationText>
            <DurationUnit>분</DurationUnit>
          </DurationRow>
          <DistanceText>
            {distanceMeters}m · {mode}
          </DistanceText>
        </DurationBlock>
        <TagText>{tagLabel}</TagText>
      </HeaderRow>

      <BadgeRow>
        <BadgeItem>
          <IndoorRatioIcon width={9} height={10} />
          <BadgeLabel>실내</BadgeLabel>
          <BadgeValue>{indoorPercent}%</BadgeValue>
        </BadgeItem>
        <BadgeDivider />
        <BadgeItem>
          <FacilityIcon width={14} height={14} />
          <BadgeLabel>{facilityLabel}</BadgeLabel>
          <BadgeValue>{facilityValue}</BadgeValue>
        </BadgeItem>
        {showFacilityInfo && <InfoIcon width={11} height={11} />}
      </BadgeRow>
    </Container>
  );
}

const Container = styled.View<{ showDivider: boolean }>`
  width: 100%;
  padding: 12px 16px;
  gap: 8px;
  border-bottom-width: ${({ showDivider }) => (showDivider ? '2px' : '0px')};
  border-bottom-color: ${({ theme }) => theme.semantic.line.tertiary};
`;

const HeaderRow = styled.View`
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
`;

const DurationBlock = styled.View`
  gap: 2px;
`;

const DurationRow = styled.View`
  flex-direction: row;
  align-items: baseline;
`;

const DurationText = styled.Text`
  font-family: ${({ theme }) => theme.typography.heading.semiBold.fontFamily};
  font-size: 16px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const DurationUnit = styled.Text`
  margin-left: 2px;
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: 12px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const DistanceText = styled.Text`
  font-family: ${({ theme }) => theme.typography.caption.medium.fontFamily};
  font-size: 10px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const TagText = styled.Text`
  font-family: ${({ theme }) => theme.typography.caption.semiBold.fontFamily};
  font-size: 10px;
  color: ${({ theme }) => theme.semantic.main};
`;

const BadgeRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background-color: ${({ theme }) => theme.semantic.background.fill};
  border-radius: 8px;
  padding: 6px 8px;
`;

const BadgeItem = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const BadgeDivider = styled.View`
  width: 1px;
  height: 12px;
  background-color: ${({ theme }) => theme.semantic.line.secondary};
`;

const BadgeLabel = styled.Text`
  font-family: ${({ theme }) => theme.typography.caption.medium.fontFamily};
  font-size: 10px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const BadgeValue = styled.Text`
  font-family: ${({ theme }) => theme.typography.caption.medium.fontFamily};
  font-size: 10px;
  color: ${({ theme }) => theme.blue[700]};
`;
