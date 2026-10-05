import React from 'react';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import { BouncyPressable } from './BouncyPressable';
import { FavoriteToggle } from './FavoriteToggle';

interface Props {
  /** 이 카드가 가리키는 시설 id. onToggleFavorite에 그대로 넘겨준다(콜백 자체가 특정
   * 항목에 매번 새로 바인딩되지 않고 안정적인 참조를 유지하게 하기 위함 — React.memo가
   * 실제로 효과를 보려면 부모가 map 콜백 안에서 매번 새 화살표 함수를 만들어 넘기면 안 된다). */
  id: string;
  /** 대표 사진 한 장(DummyCategoryMarker.images의 첫 장 등). 없으면 icon으로 대체한다. */
  photo?: React.FC<SvgProps>;
  /** photo가 없을 때 옅은 배경 위에 보여줄 카테고리 아이콘. */
  icon: React.FC<SvgProps>;
  title: string;
  isOpen: boolean;
  statusText: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onPress?: () => void;
}

/**
 * 건물 상세보기(BuildingDetailScreen) "편의시설" 2열 그리드에서 쓰는 카드.
 * Figma "facility category_list/facility_badook list"(720:3772) — 사진(또는 아이콘) +
 * 제목/즐겨찾기 + 운영 상태로 구성된다.
 */
export const BuildingFacilityCard = React.memo(function BuildingFacilityCard({
  id,
  photo: Photo,
  icon: Icon,
  title,
  isOpen,
  statusText,
  isFavorite = false,
  onToggleFavorite,
  onPress,
}: Props) {
  const theme = useTheme();
  return (
    <Container onPress={() => onPress?.()}>
      <Card>
        {Photo ? (
          <PhotoSlot>
            {/* 사진 원본 비율이 칸과 달라도 칸을 꽉 채우고 넘치는 부분만 가운데 기준으로 자른다(빈 여백 없음). */}
            <Photo width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
          </PhotoSlot>
        ) : (
          <IconSlot>
            <Icon width={72} height={72} color={theme.blue[300]} />
          </IconSlot>
        )}
        <TitleRow>
          <TitleText numberOfLines={1}>{title}</TitleText>
          <FavoriteToggle isFavorite={isFavorite} onPress={() => onToggleFavorite?.(id)} />
        </TitleRow>
        <StatusRow>
          <StatusDot isOpen={isOpen} />
          <StatusText>{statusText}</StatusText>
        </StatusRow>
      </Card>
    </Container>
  );
});

const Container = styled(BouncyPressable)`
  flex: 1;
`;

const Card = styled.View`
  width: 100%;
  gap: 7px;
`;

// 사진/기본 아이콘 칸은 둘 다 2열 칸 폭에 꽉 차는 정사각형이다 — 사진 크기와 상관없이 제목·운영 상태가 항상
// 같은 높이에 오게. Figma 기준 화면(375)에선 (375 − 좌우 20×2 − 사이 16) / 2 = 159.5 × 159.5.
// max-width로 159.5에 묶으면, 칸이 더 넓은 기기(예: 402pt)에서 높이는 원래 칸 폭으로 계산되고 폭만 159.5로 줄어
// 세로로 긴 직사각형이 된다(aspect-ratio + max-width 조합). 그래서 폭 제한 없이 칸 폭 그대로 정사각형을 유지한다.
const PhotoSlot = styled.View`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
`;

const IconSlot = styled.View`
  width: 100%;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.semantic.background.color};
`;

const TitleRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
`;

const TitleText = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const StatusRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const StatusDot = styled.View<{ isOpen: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 100px;
  background-color: ${({ theme, isOpen }) => (isOpen ? theme.semantic.success : theme.semantic.text.tertiary)};
`;

const StatusText = styled.Text`
  font-family: ${({ theme }) => theme.typography.caption.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.caption.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.caption.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.caption.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
