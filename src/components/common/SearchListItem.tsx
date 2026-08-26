import React, { useState } from 'react';
import { Pressable } from 'react-native';
import styled, { css, useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import BookIcon from '@assets/svgs/icons/book.svg';
import StarIcon from '@assets/svgs/icons/starBadge.svg';
import CloseThinIcon from '@assets/svgs/icons/closeThin.svg';
import CheckCircleIcon from '@assets/svgs/icons/checkCircle.svg';

interface Props {
  /** 건물 동 (예: "H동") */
  building: string;
  /** 시설/장소명 (예: "중앙도서관") */
  place: string;
  /** 호실 등 나머지 정보. 건물/장소 자체가 결과인 경우(호실이 없는 경우)엔 생략한다. */
  room?: string;
  /** 왼쪽 원형 아바타에 들어갈 카테고리 아이콘. 기본은 열람실(책) 아이콘 */
  icon?: React.FC<SvgProps>;
  iconWidth?: number;
  iconHeight?: number;
  /**
   * 아바타 배경색. 'brand'면 남색 배경 + 흰 아이콘(건물 자체 카테고리), 'default'면
   * 회색 배경 + 남색 아이콘. 즐겨찾기 여부와는 무관하다.
   */
  avatarVariant?: 'brand' | 'default';
  /** 즐겨찾기로 등록된 건물/시설인지. true면 아바타 우상단에 별 배지가 붙는다(배경색과는 무관). */
  isFavorite?: boolean;
  /**
   * true면 "최근 검색어" 형태로 렌더링되어 오른쪽에 날짜 + 삭제(x) 버튼이 붙는다.
   * false면 "검색 결과" 형태로, 오른쪽엔 아무것도 없거나(selected=false) 체크 아이콘(selected=true)만 보인다.
   */
  history?: boolean;
  /** history일 때만 쓰이는 날짜 텍스트 (예: "04.10") */
  date?: string;
  /** 검색 결과에서 현재 선택(방문)된 위치인지. 배경이 옅은 남색으로 바뀌고 체크 아이콘이 뜬다. */
  selected?: boolean;
  /** 아이템 사이 구분선을 보여줄지 (리스트 마지막 아이템은 보통 false) */
  showDivider?: boolean;
  onPress?: () => void;
  /** history 아이템의 x 버튼을 눌렀을 때 (삭제) */
  onDeletePress?: () => void;
}

/**
 * 검색 페이지의 "최근 검색어" / "검색 결과" 리스트에서 공용으로 쓰는 한 줄 아이템.
 * history 여부와 selected 여부 조합으로 우측 영역(날짜+삭제 버튼 vs 체크 아이콘)이 달라지고,
 * isFavorite 여부로 왼쪽 아바타(색/별 배지)가 달라진다.
 */
export function SearchListItem({
  building,
  place,
  room,
  icon: Icon = BookIcon,
  iconWidth = 14,
  iconHeight = 16,
  avatarVariant = 'default',
  isFavorite = false,
  history = false,
  date,
  selected = false,
  showDivider = false,
  onPress,
  onDeletePress,
}: Props) {
  const theme = useTheme();
  // Pressable의 style-as-function은 styled-components를 거치면서 못 쓰게 되므로,
  // 누르고 있는 동안의 배경(background_fill) 전환은 직접 상태로 들고 있는다.
  const [isPressed, setIsPressed] = useState(false);
  const isBrandAvatar = avatarVariant === 'brand';
  const iconColor = isBrandAvatar ? theme.semantic.text.white : theme.blue[500];

  return (
    <Container
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      selected={selected}
      pressed={isPressed}
      showDivider={showDivider}
    >
      <IconAvatar isBrand={isBrandAvatar}>
        <Icon width={iconWidth} height={iconHeight} color={iconColor} />
        {isFavorite && (
          <FavoriteBadge>
            <StarIcon width={14} height={14} />
          </FavoriteBadge>
        )}
      </IconAvatar>
      <TextBlock>
        <NameRow>
          <BuildingText>{building}</BuildingText>
          <PlaceText>{place}</PlaceText>
        </NameRow>
        {room && <RoomText numberOfLines={1}>{room}</RoomText>}
      </TextBlock>
      {history && !selected && (
        <HistoryActions>
          <DateText>{date}</DateText>
          <Pressable onPress={onDeletePress} hitSlop={8}>
            <CloseThinIcon width={12} height={12} color={theme.semantic.text.tertiary} />
          </Pressable>
        </HistoryActions>
      )}
      {selected && <CheckCircleIcon width={28} height={28} color={theme.blue[800]} />}
    </Container>
  );
}

const Container = styled(Pressable)<{ selected: boolean; pressed: boolean; showDivider: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background-color: ${({ theme, selected, pressed }) =>
    selected
      ? theme.semantic.background.color
      : pressed
        ? theme.semantic.background.fill
        : 'transparent'};
  border-bottom-width: ${({ showDivider }) => (showDivider ? '1px' : '0px')};
  border-bottom-color: ${({ theme }) => theme.semantic.line.tertiary};
`;

const IconAvatar = styled.View<{ isBrand: boolean }>`
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 100px;
  background-color: ${({ theme, isBrand }) =>
    isBrand ? theme.blue[500] : theme.semantic.background.color};
`;

const FavoriteBadge = styled.View`
  position: absolute;
  top: -3px;
  right: -3px;
`;

const TextBlock = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const NameRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
`;

const textStyle = css`
  font-family: ${({ theme }) => theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.medium.letterSpacing}px;
`;

const BuildingText = styled.Text`
  ${textStyle}
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const PlaceText = styled.Text`
  ${textStyle}
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const RoomText = styled.Text`
  ${textStyle}
  flex: 1;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const HistoryActions = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const DateText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
