import React from 'react';
import { Image, ScrollView, StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import { PhotoSource } from '@appTypes/photo';

interface Props {
  images: [PhotoSource, PhotoSource];
  /** 기본 100px(FacilityInfoCard 등). 건물 상세보기(BuildingDetailScreen)는 160px(가로 249px, 가로 스크롤)을 쓴다. */
  height?: number;
  /**
   * true면 온보딩 검색 목업(Figma 1252:43043)처럼 ~0.685배 축소 크기로 그린다
   * (간격 2.739px, 모서리 반경 2.739px). height도 68.477px로 같이 넘겨줘야 한다.
   */
  compact?: boolean;
  /**
   * 사진 한 장의 가로 폭(px). 주면 칸을 반씩 나누지 않고 이 폭으로 고정해 가로로 나열하고, 화면 폭을 넘으면
   * 오른쪽으로 가로 스크롤된다(건물 상세보기). 사진은 칸을 꽉 채우도록 가운데 기준으로 잘라 그린다.
   */
  itemWidth?: number;
  /** itemWidth를 줄 때, 부모의 좌우 여백(px). 스크롤 영역을 그만큼 화면 끝까지 넓혀 사진이 여백에서 잘리지 않게 한다. */
  bleed?: number;
}

/**
 * 시설 카드류(FacilityInfoCard, FacilityListItem, BuildingDetailScreen)에서 공통으로 쓰는
 * 이미지 2장 나열 블록. 사이 4px 간격, 바깥쪽 모서리만 4px 둥글게.
 */
export function FacilityImagePair({ images, height = 100, compact = false, itemWidth, bleed = 0 }: Props) {
  if (itemWidth !== undefined) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -bleed }}
        contentContainerStyle={{ paddingHorizontal: bleed, gap: 4 }}
      >
        {images.map((source, index) => (
          <FixedImageSlot key={index} first={index === 0} compact={false} style={{ width: itemWidth, height }}>
            <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </FixedImageSlot>
        ))}
      </ScrollView>
    );
  }

  return (
    <ImageRow height={height} compact={compact}>
      {images.map((source, index) => (
        <ImageSlot key={index} first={index === 0} compact={compact}>
          {/* 칸 비율과 사진 비율이 달라도 빈 여백 없이 칸을 꽉 채우고 넘치는 부분만 가운데 기준으로 자른다. */}
          <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" />
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

// 가로 스크롤용 — 폭은 itemWidth로 고정(flex로 나누지 않음), 모서리 규칙은 ImageSlot과 같다.
const FixedImageSlot = styled(ImageSlot)`
  flex: none;
`;
