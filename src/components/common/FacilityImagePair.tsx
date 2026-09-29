import React from 'react';
import styled from 'styled-components/native';
import { SvgProps } from 'react-native-svg';

interface Props {
  images: [React.FC<SvgProps>, React.FC<SvgProps>];
  /** 기본 100px(FacilityInfoCard 등). 건물 상세보기(BuildingDetailScreen)는 160px을 쓴다. */
  height?: number;
  /**
   * true면 온보딩 검색 목업(Figma 1252:43043)처럼 ~0.685배 축소 크기로 그린다
   * (간격 2.739px, 모서리 반경 2.739px). height도 68.477px로 같이 넘겨줘야 한다.
   */
  compact?: boolean;
}

/**
 * 시설 카드류(FacilityInfoCard, FacilityListItem, BuildingDetailScreen)에서 공통으로 쓰는
 * 이미지 2장 나열 블록. 사이 4px 간격, 바깥쪽 모서리만 4px 둥글게.
 */
export function FacilityImagePair({ images, height = 100, compact = false }: Props) {
  return (
    <ImageRow height={height} compact={compact}>
      {images.map((ImageIcon, index) => (
        <ImageSlot key={index} first={index === 0} compact={compact}>
          <ImageIcon width="100%" height="100%" />
        </ImageSlot>
      ))}
    </ImageRow>
  );
}

const ImageRow = styled.View<{ height: number; compact: boolean }>`
  flex-direction: row;
  gap: ${({ compact }) => (compact ? '2.739px' : '4px')};
  height: ${({ height }) => height}px;
  width: 100%;
`;

const ImageSlot = styled.View<{ first?: boolean; compact: boolean }>`
  flex: 1;
  height: 100%;
  overflow: hidden;
  border-top-left-radius: ${({ first, compact }) => (first ? (compact ? '2.739px' : '4px') : '0px')};
  border-bottom-left-radius: ${({ first, compact }) => (first ? (compact ? '2.739px' : '4px') : '0px')};
  border-top-right-radius: ${({ first, compact }) => (first ? '0px' : compact ? '2.739px' : '4px')};
  border-bottom-right-radius: ${({ first, compact }) => (first ? '0px' : compact ? '2.739px' : '4px')};
`;
