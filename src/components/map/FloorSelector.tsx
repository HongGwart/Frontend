import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { FloorInfo } from '@constant/floorMaps';

interface Props {
  /** 높은 층이 위로 오게 정렬된 층 목록 (getBuildingFloors 결과) */
  floors: FloorInfo[];
  selectedFloorId: string;
  onSelect: (floorId: string) => void;
  /** 층이 많은 건물(T동 10층 등)은 이 높이를 넘으면 안에서 세로 스크롤된다. */
  maxHeight?: number;
}

/**
 * 건물 내부 지도의 층 선택기. Figma "floors"(774:5332) — 폭 40px 세로 필, 층 사이 1px
 * 구분선, 선택된 층만 남색(background.brand) 배경에 흰 굵은 글씨. 위아래 끝만 둥글다.
 */
export function FloorSelector({ floors, selectedFloorId, onSelect, maxHeight }: Props) {
  return (
    <Shadow>
      <Pill>
        <ScrollView style={{ maxHeight }} bounces={false} showsVerticalScrollIndicator={false}>
          {floors.map((floor, index) => {
            const selected = floor.floorId === selectedFloorId;
            return (
              <FloorButton
                key={floor.floorId}
                onPress={() => onSelect(floor.floorId)}
                selected={selected}
                isFirst={index === 0}
                isLast={index === floors.length - 1}
              >
                <FloorText selected={selected} numberOfLines={1}>
                  {floor.label}
                </FloorText>
              </FloorButton>
            );
          })}
        </ScrollView>
      </Pill>
    </Shadow>
  );
}

// Figma drop-shadow: 0px 0px 5px rgba(0,0,0,0.05) — Pill의 overflow:hidden에 잘리지 않게 바깥에 건다.
const Shadow = styled.View`
  width: 40px;
  border-radius: 100px;
  shadow-color: #000;
  shadow-offset: 0px 0px;
  shadow-opacity: 0.05;
  shadow-radius: 5px;
  elevation: 3;
`;

// 층 사이 1px 구분선은 Figma처럼 버튼 사이 간격(gap 1px)으로 비치는 배경색으로 만든다.
const Pill = styled.View`
  width: 40px;
  border-radius: 100px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.semantic.line.tertiary};
`;

const FloorButton = styled(Pressable)<{ selected: boolean; isFirst: boolean; isLast: boolean }>`
  align-items: center;
  justify-content: center;
  padding-top: ${({ isFirst }) => (isFirst ? 10 : 6)}px;
  padding-bottom: ${({ isLast }) => (isLast ? 10 : 6)}px;
  margin-bottom: ${({ isLast }) => (isLast ? 0 : 1)}px;
  background-color: ${({ theme, selected }) =>
    selected ? theme.semantic.background.brand : theme.semantic.background.primary};
`;

const FloorText = styled.Text<{ selected: boolean }>`
  font-family: ${({ theme, selected }) =>
    selected ? theme.typography.bodyNormal.semiBold.fontFamily : theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.medium.letterSpacing}px;
  color: ${({ theme, selected }) => (selected ? theme.semantic.text.white : theme.semantic.text.tertiary)};
`;
