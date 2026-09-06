import React from 'react';
import styled from 'styled-components/native';

interface Props {
  /** 현재 운영 중이면 초록 점, 아니면 회색 점 */
  isOpen: boolean;
  /** 예: "운영 중" / "운영 종료" */
  statusText: string;
  /** 예: "08:00 - 22:00" */
  hours: string;
}

/**
 * "● 운영 중 · 08:00 - 22:00" 형태의 운영 상태 한 줄.
 * FacilityInfoCard 내부의 OperatingHoursRow와 같은 스펙이지만 그쪽은 비공개라, 마이페이지 카드용으로 따로 뒀다.
 * (추후 공통이 필요해지면 common으로 승격하고 양쪽에서 쓰면 된다.)
 */
export function OperatingStatusRow({ isOpen, statusText, hours }: Props) {
  return (
    <Row>
      <StatusGroup>
        <Dot isOpen={isOpen} />
        <StatusText>{statusText}</StatusText>
      </StatusGroup>
      <Separator>·</Separator>
      <HoursText>{hours}</HoursText>
    </Row>
  );
}

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const StatusGroup = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const Dot = styled.View<{ isOpen: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 100px;
  background-color: ${({ theme, isOpen }) => (isOpen ? theme.semantic.success : theme.warning)};
`;

const StatusText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const Separator = styled(StatusText)`
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const HoursText = styled(StatusText)``;
