import React from 'react';
import styled from 'styled-components/native';
import { SvgProps } from 'react-native-svg';

interface Props {
  images: [React.FC<SvgProps>, React.FC<SvgProps>];
  /** 기본 100px(FacilityInfoCard 등). 건물 상세보기(BuildingDetailScreen)는 160px을 쓴다. */
  height?: number;
}

/**
 * 시설 카드류(FacilityInfoCard, FacilityListItem, BuildingDetailScreen)에서 공통으로 쓰는
 * 이미지 2장 나열 블록. 사이 4px 간격, 바깥쪽 모서리만 4px 둥글게.
 */
export function FacilityImagePair({ images, height = 100 }: Props) {
  return (
    <ImageRow height={height}>
      {images.map((ImageIcon, index) => (
        <ImageSlot key={index} first={index === 0}>
          <ImageIcon width="100%" height="100%" />
        </ImageSlot>
      ))}
    </ImageRow>
  );
}

const ImageRow = styled.View<{ height: number }>`
  flex-direction: row;
  gap: 4px;
  height: ${({ height }) => height}px;
  width: 100%;
`;

const ImageSlot = styled.View<{ first?: boolean }>`
  flex: 1;
  height: 100%;
  overflow: hidden;
  border-top-left-radius: ${({ first }) => (first ? '4px' : '0px')};
  border-bottom-left-radius: ${({ first }) => (first ? '4px' : '0px')};
  border-top-right-radius: ${({ first }) => (first ? '0px' : '4px')};
  border-bottom-right-radius: ${({ first }) => (first ? '0px' : '4px')};
`;
