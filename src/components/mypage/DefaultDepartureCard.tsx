import React from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';
import { LocationName } from './LocationName';

interface Props {
  buildingCode: string;
  buildingName: string;
  /** 호실 등 세부 정보 (예: "314호") */
  roomNumber?: string;
  /** 위치 아래 한 줄 설명 (예: "공과대학 전공 강의실 및 실습실") */
  description: string;
  onEditPress?: () => void;
}

/**
 * 마이페이지 "기본 출발지" 카드. 흰 배경 라운드 박스에 위치(20px) + "수정" 링크 + 설명 한 줄.
 */
export function DefaultDepartureCard({ buildingCode, buildingName, roomNumber, description, onEditPress }: Props) {
  return (
    <Card>
      <TitleRow>
        <LocationName buildingCode={buildingCode} buildingName={buildingName} detail={roomNumber} size={20} />
        <Pressable onPress={onEditPress} hitSlop={8}>
          <EditText>수정</EditText>
        </Pressable>
      </TitleRow>
      <Description numberOfLines={1}>{description}</Description>
    </Card>
  );
}

const Card = styled.View`
  width: 100%;
  background-color: ${({ theme }) => theme.semantic.background.primary};
  border-radius: 12px;
  padding: 16px 20px;
  gap: 4px;
`;

const TitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const EditText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.main};
  text-align: right;
`;

const Description = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;
