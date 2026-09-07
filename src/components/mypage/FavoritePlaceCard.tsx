import React, { useState } from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import { FavoriteToggle } from '@components/common/FavoriteToggle';
import { LocationName } from './LocationName';
import { OperatingStatusRow } from './OperatingStatusRow';

interface Props {
  /**
   * 편의시설명(예: "카페드림"). 주어지면 "시설 레이아웃"(제목 + 그 아래 위치 한 줄)으로,
   * 없으면 "건물 레이아웃"(동 + 건물명만 한 줄)으로 렌더링된다.
   */
  name?: string;
  buildingCode: string;
  buildingName: string;
  /** 시설 레이아웃에서 위치 끝에 붙는 층/호실 (예: "1층") */
  locationDetail?: string;
  /** 썸네일 사진. 넘기면 120x120 박스를 꽉 채운다. photo와 icon 중 하나만 쓴다. */
  photo?: React.FC<SvgProps>;
  /** 사진이 없을 때 옅은 남색 박스 위에 올리는 카테고리 아이콘 */
  icon?: React.FC<SvgProps>;
  iconWidth?: number;
  iconHeight?: number;
  isOpen: boolean;
  /** 예: "운영 중" / "운영 종료" */
  statusText: string;
  /** 예: "08:00 - 22:00" */
  hours: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onPress?: () => void;
  /** 아이템 사이 구분선 (리스트 마지막은 보통 false) */
  showDivider?: boolean;
}

/**
 * 마이페이지 "즐겨찾기" 리스트의 한 줄 카드. Figma "facility category_list".
 * 왼쪽 120px 썸네일(사진 or 아이콘) + 오른쪽에 이름/즐겨찾기 토글 + 운영 상태.
 */
export function FavoritePlaceCard({
  name,
  buildingCode,
  buildingName,
  locationDetail,
  photo: Photo,
  icon: Icon,
  iconWidth = 72,
  iconHeight = 72,
  isOpen,
  statusText,
  hours,
  isFavorite = true,
  onToggleFavorite,
  onPress,
  showDivider = true,
}: Props) {
  const theme = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const isFacilityLayout = Boolean(name);

  return (
    <Container
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      pressed={isPressed}
      showDivider={showDivider}
    >
      <ImageBox plain={!Photo}>
        {Photo ? (
          <Photo width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        ) : Icon ? (
          // Figma: 120px "Image" 박스 안에 72x72(flex-shrink:0) 아이콘 노드가 들어간다.
          // repo 아이콘 원본 비율이 정사각이 아닐 수 있어, 늘어나지 않도록 비율 유지(meet)로
          // 그 72x72 박스 안에 중앙 배치한다.
          <IconBox>
            <Icon
              width={iconWidth}
              height={iconHeight}
              color={theme.blue[300]}
              preserveAspectRatio="xMidYMid meet"
            />
          </IconBox>
        ) : null}
      </ImageBox>

      <Right>
        <TopRow topAlign={isFacilityLayout}>
          <NameBlock>
            {isFacilityLayout && <NameText numberOfLines={1}>{name}</NameText>}
            {isFacilityLayout ? (
              <LocationName
                buildingCode={buildingCode}
                buildingName={buildingName}
                detail={locationDetail}
                size={14}
              />
            ) : (
              <LocationName buildingCode={buildingCode} buildingName={buildingName} size={18} />
            )}
          </NameBlock>
          <FavoriteToggle isFavorite={isFavorite} onPress={onToggleFavorite} />
        </TopRow>

        <OperatingStatusRow isOpen={isOpen} statusText={statusText} hours={hours} />
      </Right>
    </Container>
  );
}

const Container = styled(Pressable)<{ pressed: boolean; showDivider: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 20px;
  background-color: ${({ theme, pressed }) =>
    pressed ? theme.semantic.background.fill : theme.semantic.background.primary};
  border-bottom-width: ${({ showDivider }) => (showDivider ? '1px' : '0px')};
  border-bottom-color: ${({ theme }) => theme.semantic.line.tertiary};
`;

const ImageBox = styled.View<{ plain: boolean }>`
  width: 120px;
  height: 120px;
  border-radius: 4px;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, plain }) => (plain ? theme.semantic.background.color : 'transparent')};
`;

// Figma 아이콘 노드 스펙: 72x72, flex-shrink: 0, aspect-ratio 1/1.
const IconBox = styled.View`
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
`;

const Right = styled.View`
  flex: 1;
  align-self: stretch;
  justify-content: space-between;
`;

const TopRow = styled.View<{ topAlign: boolean }>`
  flex-direction: row;
  align-items: ${({ topAlign }) => (topAlign ? 'flex-start' : 'center')};
  justify-content: space-between;
  gap: 8px;
  width: 100%;
`;

const NameBlock = styled.View`
  flex: 1;
  gap: 4px;
`;

const NameText = styled.Text`
  font-family: ${({ theme }) => theme.typography.headline.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.headline.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.headline.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.headline.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;
