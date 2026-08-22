import React, { useState } from 'react';
import { Pressable } from 'react-native';
import styled, { css, useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import { FavoriteToggle } from './FavoriteToggle';
import { FacilityImagePair } from './FacilityImagePair';

interface Props {
  /** 왼쪽 원형 아바타에 들어갈 카테고리 아이콘 */
  icon: React.FC<SvgProps>;
  iconWidth?: number;
  iconHeight?: number;
  building: string;
  place: string;
  room: string;
  description: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /** 이미지 2장. 생략하면 이미지 없이 제목/설명만 있는 리스트 아이템이 된다. */
  images?: [React.FC<SvgProps>, React.FC<SvgProps>];
  /** 아이템 사이 구분선을 보여줄지 (리스트 마지막 아이템은 보통 false) */
  showDivider?: boolean;
  onPress?: () => void;
}

/**
 * 이미지가 포함된 시설 리스트 아이템. Figma "facility list_facility"(708:1407, pressed: 708:1914).
 * FacilityInfoCard의 제목/즐겨찾기/이미지 영역과 같은 뼈대를 쓰지만, 이 컴포넌트는 리스트에
 * 한 줄씩 나열되는 형태(구분선 + pressed 배경)라 따로 뺐다.
 */
export function FacilityListItem({
  icon: Icon,
  iconWidth = 14,
  iconHeight = 16,
  building,
  place,
  room,
  description,
  isFavorite = false,
  onToggleFavorite,
  images,
  showDivider = true,
  onPress,
}: Props) {
  const theme = useTheme();
  // Pressable의 style-as-function은 styled-components를 거치면서 못 쓰게 되므로,
  // 누르고 있는 동안의 배경(background_fill) 전환은 직접 상태로 들고 있는다.
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Container
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      pressed={isPressed}
      showDivider={showDivider}
    >
      <TitleSection>
        <IconAvatar>
          <Icon width={iconWidth} height={iconHeight} color={theme.blue[500]} />
        </IconAvatar>
        <TextBlock>
          <TitleRow>
            <NameGroup>
              <BuildingText>{building}</BuildingText>
              <PlaceText>{place}</PlaceText>
            </NameGroup>
            <RoomText numberOfLines={1}>{room}</RoomText>
            <FavoriteToggle isFavorite={isFavorite} onPress={onToggleFavorite} />
          </TitleRow>
          <DescriptionText numberOfLines={1}>{description}</DescriptionText>
        </TextBlock>
      </TitleSection>

      {images && <FacilityImagePair images={images} />}
    </Container>
  );
}

const Container = styled(Pressable)<{ pressed: boolean; showDivider: boolean }>`
  width: 100%;
  padding: 16px 20px 20px;
  gap: 16px;
  background-color: ${({ theme, pressed }) => (pressed ? theme.semantic.background.fill : 'transparent')};
  border-bottom-width: ${({ showDivider }) => (showDivider ? '1px' : '0px')};
  border-bottom-color: ${({ theme }) => theme.semantic.line.tertiary};
`;

const TitleSection = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const IconAvatar = styled.View`
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 100px;
  background-color: ${({ theme }) => theme.semantic.background.color};
`;

const TextBlock = styled.View`
  flex: 1;
  gap: 2px;
`;

const TitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 2px;
  width: 100%;
`;

const NameGroup = styled.View`
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

const DescriptionText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

