import React from 'react';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import StarIcon from '@assets/svgs/icons/starBadge.svg';

// NaverMapCategoryMarker.tsx가 오버레이(고정 크기 이미지로 래스터화되는) 크기를 계산할 때
// 여기 실제 렌더링 값과 반드시 같은 숫자를 써야 한다 (Marker.tsx의 MARKER_PIN_BOX_SIZE와 동일한 이유).
export const CATEGORY_MARKER_BOX_SIZE = 32;

interface Props {
  /** 카테고리 아이콘 (예: 카페/식당/PC실 등). CATEGORY_MARKER_ICONS에서 가져다 쓴다. */
  icon: React.FC<SvgProps>;
  iconWidth: number;
  iconHeight: number;
  /** 아이콘별로 미세하게 위/아래 위치를 보정해야 할 때 쓰는 값(px). 음수면 위로 올라간다. */
  iconOffsetY?: number;
  /** 즐겨찾기로 등록된 시설인지. true면 우측 상단에 별 배지가 붙는다. */
  favorite?: boolean;
  /** 마커에 표시할 숫자 배지 (군집된 개수 등). favorite와 동시에 켜지면 배지가 우선한다. */
  count?: number;
  /** true면 지금 탭해서 시설 카드가 열려있는 마커 — 원을 채운 진한 파란색으로 뒤집어서 강조한다. */
  active?: boolean;
  /**
   * 마커 전체를 이 배율로 키운다(기본 1). Marker.tsx의 scale과 같은 이유로 바닥(좌표 지점)
   * 기준으로만 커지게 transform-origin을 bottom으로 고정한다.
   */
  scale?: number;
}

/**
 * 지도 위에 찍는 카테고리(시설) 마커. 흰 원 + 파란 테두리 + 가운데 카테고리 아이콘이 기본형이고,
 * favorite/count로 우측 상단 배지가 달린다. Figma "facility"(707:908) 컴포넌트.
 */
export function CategoryMarker({
  icon: Icon,
  iconWidth,
  iconHeight,
  iconOffsetY = 0,
  favorite = false,
  count,
  active = false,
  scale = 1,
}: Props) {
  const theme = useTheme();
  const hasCount = count !== undefined;

  return (
    <Container
      collapsable={false}
      style={scale !== 1 ? { transform: [{ scale }], transformOrigin: 'center bottom' } : undefined}
    >
      {/* 지도 마커는 iOS에서 이 뷰를 이미지로 찍어(renderInContext) 붙이는데, 그때 배경·테두리를 가진 뷰의
          자식이 그 배경 "아래"에 찍혀서 원 안의 아이콘이 흰 배경에 덮여 사라졌다. 그래서 원(배경·테두리)을
          아이콘의 부모가 아니라 먼저 그려지는 형제 뷰로 따로 두고, 아이콘은 그 위 형제로 올린다. */}
      <CircleBackground active={active} collapsable={false} />
      <IconSlot offsetY={iconOffsetY} collapsable={false}>
        <Icon width={iconWidth} height={iconHeight} color={active ? theme.semantic.text.white : theme.blue[500]} />
      </IconSlot>
      {hasCount ? (
        <CountBadge collapsable={false}>
          {/* 원과 같은 이유로 배지 배경도 숫자의 형제로 따로 둔다. */}
          <CountBadgeBackground collapsable={false} />
          <CountText numberOfLines={1}>{count}</CountText>
        </CountBadge>
      ) : (
        favorite && (
          <FavoriteBadge>
            <StarIcon width={14} height={14} />
          </FavoriteBadge>
        )
      )}
    </Container>
  );
}

const Container = styled.View`
  width: ${CATEGORY_MARKER_BOX_SIZE}px;
  height: ${CATEGORY_MARKER_BOX_SIZE}px;
  align-items: center;
  justify-content: center;
`;

const CircleBackground = styled.View<{ active: boolean }>`
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  border-radius: 100px;
  border-width: 1.5px;
  border-color: ${({ theme, active }) => (active ? theme.blue[700] : theme.blue[500])};
  background-color: ${({ theme, active }) => (active ? theme.blue[500] : theme.semantic.background.primary)};
`;

const IconSlot = styled.View<{ offsetY: number }>`
  margin-top: ${({ offsetY }) => offsetY}px;
`;

const COUNT_BADGE_SIZE = 16;

const CountBadge = styled.View`
  position: absolute;
  top: -2px;
  right: -2px;
  width: ${COUNT_BADGE_SIZE}px;
  height: ${COUNT_BADGE_SIZE}px;
  align-items: center;
  justify-content: center;
`;

const CountBadgeBackground = styled.View`
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  border-radius: ${COUNT_BADGE_SIZE / 2}px;
  border-width: 1.5px;
  border-color: ${({ theme }) => theme.semantic.background.primary};
  background-color: ${({ theme }) => theme.blue[700]};
`;

const CountText = styled.Text`
  font-family: ${({ theme }) => theme.typography.caption.semiBold.fontFamily};
  font-size: 10px;
  line-height: 10px;
  color: ${({ theme }) => theme.semantic.text.white};
  text-align: center;
  text-align-vertical: center;
  include-font-padding: false;
  margin-top: 1px;
  margin-left: 0.5px;
`;

const FavoriteBadge = styled.View`
  position: absolute;
  top: -3px;
  right: -3px;
`;
