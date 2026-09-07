import React from 'react';
import { View } from 'react-native';
import styled, { useTheme } from 'styled-components/native';

export type LocationNameSize = 14 | 18 | 20;

interface Props {
  /** 건물 동 코드 (예: "H동") */
  buildingCode: string;
  /** 건물/장소명 (예: "중앙도서관") */
  buildingName: string;
  /** 호실·층 등 세부 정보 (예: "314호", "1층"). 건물 자체가 대상이면 생략한다. */
  detail?: string;
  /** Figma의 "location name_14 / _!8 / _20"에 대응하는 크기. 기본 14 */
  size?: LocationNameSize;
}

// Figma "location name" 컴포넌트 3종(14/18/20)의 코드-이름 / 이름-세부 사이 간격.
const GAP_CONFIG: Record<LocationNameSize, { innerGap: number; outerGap: number }> = {
  14: { innerGap: 2, outerGap: 4 },
  18: { innerGap: 2, outerGap: 2 },
  20: { innerGap: 4, outerGap: 5 },
};

// 14는 label_normal/medium, 18은 headline/semibold, 20은 heading/semibold.
function useTextStyle(size: LocationNameSize) {
  const theme = useTheme();
  const t =
    size === 14
      ? theme.typography.labelNormal.medium
      : size === 18
        ? theme.typography.headline.semiBold
        : theme.typography.heading.semiBold;
  return {
    fontFamily: t.fontFamily,
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
  } as const;
}

/**
 * "H동 중앙도서관 314호"처럼 건물 코드(강조) + 건물명(흐림) + 세부(강조)를 한 줄로 보여주는 텍스트 묶음.
 * FacilityListItem/SearchListItem/FacilityInfoCard에 인라인으로 흩어져 있던 패턴을 마이페이지용으로 따로 뺐다.
 */
export function LocationName({ buildingCode, buildingName, detail, size = 14 }: Props) {
  const { innerGap, outerGap } = GAP_CONFIG[size];
  const textStyle = useTextStyle(size);

  return (
    <Row style={{ gap: outerGap }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: innerGap, flexShrink: 1 }}>
        <CodeText style={textStyle} numberOfLines={1}>
          {buildingCode}
        </CodeText>
        <NameText style={textStyle} numberOfLines={1}>
          {buildingName}
        </NameText>
      </View>
      {detail ? (
        <CodeText style={textStyle} numberOfLines={1}>
          {detail}
        </CodeText>
      ) : null}
    </Row>
  );
}

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  /* 긴 건물명이 들어와도 옆의 "수정"/즐겨찾기 버튼을 밀어내지 않고 이쪽이 줄어든다 */
  flex-shrink: 1;
`;

const CodeText = styled.Text`
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const NameText = styled.Text`
  flex-shrink: 1;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
