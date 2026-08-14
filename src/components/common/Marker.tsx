import React from 'react';
import styled, { useTheme } from 'styled-components/native';
import MarkerPinIcon from '@assets/svgs/icons/markerPin.svg';
import MarkerDotIcon from '@assets/svgs/icons/markerDot.svg';
import MarkerFavoriteShapeIcon from '@assets/svgs/icons/markerFavoriteShape.svg';
import StarIcon from '@assets/svgs/icons/star.svg';

// NaverMapMarker.tsx가 오버레이(고정 크기 이미지로 래스터화되는) 크기를 계산할 때 여기 실제
// 렌더링 값과 반드시 같은 숫자를 써야 한다. 어긋나면 계산된 박스가 실제 콘텐츠보다 작아져서
// 핀까지 통째로 쪼그라들어 보인다 - 그래서 매직넘버로 따로 두지 않고 export해서 공유한다.
export const MARKER_PIN_BOX_SIZE = 36;
export const MARKER_LABEL_GAP = 0;
// LabelPill(padding 4px 위/아래) + LabelText(labelNormal.semiBold lineHeight 14*1.5=21px)
export const MARKER_LABEL_PILL_HEIGHT = 4 * 2 + 21;

interface Props {
  /** 마커 위에 뜨는 라벨 텍스트 (예: "G동"). number가 true면 라벨은 표시되지 않는다. */
  label?: string;
  /** 즐겨찾기로 등록된 위치인지. true면 별 모양 마커로 바뀐다. */
  favorite?: boolean;
  /** 마커에 표시할 숫자 배지 (군집된 개수 등). 생략하면 배지가 없다. */
  count?: number;
}

/**
 * 지도 위에 찍는 위치 마커. favorite 여부로 모양(핀/별)이, count 유무로 우측 상단
 * 숫자 배지가 갈린다. count가 있을 땐 상단 라벨이 생략된다(Figma 원본과 동일).
 */
export function Marker({ label, favorite = false, count }: Props) {
  const theme = useTheme();
  const hasCount = count !== undefined;

  return (
    <Container>
      {!hasCount && label && (
        <LabelPill>
          <LabelText numberOfLines={1}>{label}</LabelText>
        </LabelPill>
      )}
      <PinWrapper>
        {favorite ? (
          <>
            <MarkerFavoriteShapeIcon width={25} height={29} color={theme.blue[500]} />
            <FavoriteStarBadge>
              <StarIcon width={14} height={14} />
            </FavoriteStarBadge>
          </>
        ) : (
          <>
            <MarkerPinIcon width={26} height={30} color={theme.blue[500]} />
            <PinDotBadge>
              <MarkerDotIcon width={12} height={12} color={theme.blue[500]} />
            </PinDotBadge>
          </>
        )}
        {hasCount && (
          <CountBadge>
            <CountText numberOfLines={1}>{count}</CountText>
          </CountBadge>
        )}
      </PinWrapper>
    </Container>
  );
}

const Container = styled.View`
  align-items: center;
  align-self: center;
  gap: ${MARKER_LABEL_GAP}px;
`;

const LabelPill = styled.View`
  background-color: rgba(52, 59, 157, 0.66);
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

const PinWrapper = styled.View`
  width: ${MARKER_PIN_BOX_SIZE}px;
  height: ${MARKER_PIN_BOX_SIZE}px;
  align-items: center;
  justify-content: center;
`;

/* markerPin.svg는 원 모양 구멍이 "Subtract"로 뚫려있어서 뒤가 비쳐 보인다. 그 구멍의 실제
   중심은 핀이 36x36 박스에 가운데 정렬됐을 때 (18px, 15.75px)이고, 앞에 덮는 흰 점을 그
   중심에 맞춰서 뒤쪽 구멍이 삐져나오지 않게 한다. */
const PinDotBadge = styled.View`
  position: absolute;
  top: 10px;
  left: 12px;
`;

/* 위 PinDotBadge와 같은 방식으로 36x36 기준 중심에 맞춘 값 */
const FavoriteStarBadge = styled.View`
  position: absolute;
  top: 9px;
  left: 11px;
`;

/* width/height/border-radius를 같은 값(COUNT_BADGE_SIZE)으로 딱 맞춰야 정원이 된다.
   border-radius가 지름의 절반보다 작으면 살짝 각진 사각형처럼 보일 수 있어서 넉넉히 준다. */
const COUNT_BADGE_SIZE = 16;

const CountBadge = styled.View`
  position: absolute;
  top: -2px;
  right: -2px;
  width: ${COUNT_BADGE_SIZE}px;
  height: ${COUNT_BADGE_SIZE}px;
  border-radius: ${COUNT_BADGE_SIZE / 2}px;
  border-width: 1.5px;
  border-color: ${({ theme }) => theme.semantic.background.primary};
  background-color: ${({ theme }) => theme.blue[700]};
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const CountText = styled.Text`
  font-family: ${({ theme }) => theme.typography.caption.semiBold.fontFamily};
  font-size: 10px;
  line-height: 10px;
  color: ${({ theme }) => theme.semantic.text.white};
  text-align: center;
  text-align-vertical: center;
  /* Android는 폰트 자체에 위/아래 여백(font padding)이 비대칭으로 붙어서, lineHeight를
     font-size랑 맞춰도 숫자가 살짝 위/왼쪽으로 밀려 보인다. 꺼야 진짜 중앙에 온다. */
  include-font-padding: false;
  margin-top: 1px;
  margin-left: 0.5px;
`;
