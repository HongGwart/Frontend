import React from 'react';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import { BouncyPressable } from './BouncyPressable';
import { FavoriteToggle } from './FavoriteToggle';

interface Props {
  /** 대표 사진 한 장(DummyCategoryMarker.images의 첫 장 등). 없으면 icon으로 대체한다. */
  photo?: React.FC<SvgProps>;
  /** photo가 없을 때 옅은 배경 위에 보여줄 카테고리 아이콘. */
  icon: React.FC<SvgProps>;
  title: string;
  isOpen: boolean;
  statusText: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onPress?: () => void;
}

/**
 * 건물 상세보기(BuildingDetailScreen) "편의시설" 2열 그리드에서 쓰는 카드.
 * Figma "facility category_list/facility_badook list"(720:3772) — 사진(또는 아이콘) +
 * 제목/즐겨찾기 + 운영 상태로 구성된다.
 */
export function BuildingFacilityCard({
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
            <Photo width="100%" height="100%" />
          </PhotoSlot>
        ) : (
          <IconSlot>
            <Icon width={72} height={72} color={theme.blue[300]} />
          </IconSlot>
        )}
        <TitleRow>
          <TitleText numberOfLines={1}>{title}</TitleText>
          <FavoriteToggle isFavorite={isFavorite} onPress={onToggleFavorite} />
        </TitleRow>
        <StatusRow>
          <StatusDot isOpen={isOpen} />
          <StatusText>{statusText}</StatusText>
        </StatusRow>
      </Card>
    </Container>
  );
}

const Container = styled(BouncyPressable)`
  flex: 1;
`;

const Card = styled.View`
  width: 100%;
  gap: 7px;
`;

const PhotoSlot = styled.View`
  width: 100%;
  height: 160px;
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
