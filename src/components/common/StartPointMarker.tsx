import React from 'react';
import styled from 'styled-components/native';
import StartPointDotIcon from '@assets/svgs/icons/startPointDot.svg';
import StartPointDotDisabledIcon from '@assets/svgs/icons/startPointDotDisabled.svg';

interface Props {
  /** 마커 위에 뜨는 라벨 텍스트 (예: "G동") */
  label: string;
  /** false면 회색 비활성 톤으로 그린다. Figma property1="disabled"(784:4016) */
  active?: boolean;
}

// 점(마커) 자체는 24px 박스로 배치하지만, 흰 테두리 + 드롭섀도가 바깥으로 번지는
// SVG 원본 크기는 44px라 그만큼 넉넉히 그려야 눌려 보이지 않는다.
const DOT_ASSET_SIZE = 44;
const DOT_BOX_SIZE = 24;

/**
 * 길찾기 경로 보기 화면의 출발지 마커. Figma "MarkerStartPoint"(762:4505, 비활성 784:4016).
 * 도착지(핀 모양 Marker)와 달리 현재 위치처럼 라벨 필 + 원형 점으로 표시한다.
 */
export function StartPointMarker({ label, active = true }: Props) {
  const DotIcon = active ? StartPointDotIcon : StartPointDotDisabledIcon;

  return (
    <Container>
      <LabelPill active={active}>
        <LabelText numberOfLines={1}>{label}</LabelText>
      </LabelPill>
      <DotBox>
        <DotIcon width={DOT_ASSET_SIZE} height={DOT_ASSET_SIZE} />
      </DotBox>
    </Container>
  );
}

const Container = styled.View`
  align-items: center;
  align-self: center;
  gap: 8px;
`;

const LabelPill = styled.View<{ active: boolean }>`
  background-color: ${({ active }) => (active ? 'rgba(52, 59, 157, 0.66)' : 'rgba(129, 137, 148, 0.66)')};
  padding: 4px 10px;
  border-radius: 17px;
  align-items: center;
  justify-content: center;
  align-self: center;
`;

const LabelText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.white};
`;

// SVG 안에 이미 Figma와 같은 drop shadow(x0 y0 blur10 spread0 #343B9D 20%)가 필터로
// 박혀 있지만, 이 마커는 NaverMapMarkerOverlay가 스냅샷(래스터화)해서 지도 위에 얹기 때문에
// SVG filter가 그 과정에서 씹히는 경우가 있다. RN View 그림자로 한 번 더 걸어서 보장한다.
const DotBox = styled.View`
  width: ${DOT_BOX_SIZE}px;
  height: ${DOT_BOX_SIZE}px;
  align-items: center;
  justify-content: center;
  shadow-color: #343b9d;
  shadow-offset: 0px 0px;
  shadow-opacity: 0.2;
  shadow-radius: 10px;
  elevation: 8;
`;
