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
  /**
   * true면 아바타가 남색으로 꽉 채워지고 아이콘이 흰색이 된다(건물 자체를 가리키는 항목).
   * false(기본)면 옅은 남색 배경 + 남색 아이콘(특정 호실/시설을 가리키는 항목).
   */
  emphasized?: boolean;
  building: string;
  place: string;
  /** 특정 호실 등 세부 정보. 건물 자체가 결과인 경우(emphasized일 때가 많다)엔 생략한다. */
  room?: string;
  description: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /** 이미지 2장. 생략하면 이미지 없이 제목/설명만 있는 리스트 아이템이 된다. */
  images?: [React.FC<SvgProps>, React.FC<SvgProps>];
  /** 아이템 사이 구분선을 보여줄지 (리스트 마지막 아이템은 보통 false) */
  showDivider?: boolean;
  onPress?: () => void;
  /**
   * true면 온보딩 검색 목업(Figma 1252:43042/43043)처럼 ~0.685배 축소 크기로 그린다
   * (패딩 10.956px/13.695px, 아바타 24.652px, 폰트 10.96px/9.59px 등). 기본값 false는
   * 앱 전역에서 쓰는 원래 크기 그대로.
   */
  compact?: boolean;
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
  emphasized = false,
  building,
  place,
  room,
  description,
  isFavorite = false,
  onToggleFavorite,
  images,
  showDivider = true,
  onPress,
  compact = false,
}: Props) {
  const theme = useTheme();
  // Pressable의 style-as-function은 styled-components를 거치면서 못 쓰게 되므로,
  // 누르고 있는 동안의 배경(background_fill) 전환은 직접 상태로 들고 있는다.
  const [isPressed, setIsPressed] = useState(false);
  const resolvedIconWidth = compact ? 13 : iconWidth;
  const resolvedIconHeight = compact ? 13 : iconHeight;

  return (
    <Container
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      pressed={isPressed}
      showDivider={showDivider}
      compact={compact}
    >
      <TitleSection compact={compact}>
        <IconAvatar emphasized={emphasized} compact={compact}>
          <Icon
            width={resolvedIconWidth}
            height={resolvedIconHeight}
            color={emphasized ? theme.semantic.text.white : theme.blue[500]}
          />
        </IconAvatar>
        <TextBlock compact={compact}>
          <TitleRow compact={compact}>
            <NameGroup compact={compact}>
              <BuildingText compact={compact}>{building}</BuildingText>
              <PlaceText compact={compact}>{place}</PlaceText>
            </NameGroup>
            {room && (
              <RoomText compact={compact} numberOfLines={1}>
                {room}
              </RoomText>
            )}
            <FavoriteToggle isFavorite={isFavorite} onPress={onToggleFavorite} />
          </TitleRow>
          <DescriptionText compact={compact} numberOfLines={1}>
            {description}
          </DescriptionText>
        </TextBlock>
      </TitleSection>

      {images && <FacilityImagePair images={images} compact={compact} height={compact ? 68.477 : 100} />}
    </Container>
  );
}

const Container = styled(Pressable)<{ pressed: boolean; showDivider: boolean; compact: boolean }>`
  width: 100%;
  padding: ${({ compact }) => (compact ? '10.956px 13.695px 13.695px' : '16px 20px 20px')};
  gap: ${({ compact }) => (compact ? '10.956px' : '16px')};
  background-color: ${({ theme, pressed }) => (pressed ? theme.semantic.background.fill : 'transparent')};
  border-bottom-width: ${({ showDivider, compact }) => (showDivider ? (compact ? '0.685px' : '1px') : '0px')};
  border-bottom-color: ${({ theme }) => theme.semantic.line.tertiary};
`;

const TitleSection = styled.View<{ compact: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${({ compact }) => (compact ? '8.217px' : '12px')};
  width: 100%;
`;

const IconAvatar = styled.View<{ emphasized: boolean; compact: boolean }>`
  width: ${({ compact }) => (compact ? '24.652px' : '36px')};
  height: ${({ compact }) => (compact ? '24.652px' : '36px')};
  align-items: center;
  justify-content: center;
  border-radius: 100px;
  background-color: ${({ theme, emphasized }) => (emphasized ? theme.blue[500] : theme.semantic.background.color)};
`;

const TextBlock = styled.View<{ compact: boolean }>`
  flex: 1;
  gap: ${({ compact }) => (compact ? '1.37px' : '2px')};
`;

const TitleRow = styled.View<{ compact: boolean }>`
  flex-direction: row;
  align-items: center;
  /* NameGroup(S동-학생회관 사이 2px)의 2배: 학생회관-동아리방 사이는 4px */
  gap: ${({ compact }) => (compact ? '2.739px' : '4px')};
  width: 100%;
  /* room이 있으면 RoomText(flex:1)가 이미 남는 공간을 채워서 즐겨찾기를 끝으로 밀어내지만,
     room이 없는(emphasized 건물 항목 등) 경우엔 밀어줄 요소가 없어서 이걸로 대신 처리한다. */
  justify-content: space-between;
`;

const NameGroup = styled.View<{ compact: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${({ compact }) => (compact ? '1.37px' : '2px')};
  flex-shrink: 0;
`;

const textStyle = css<{ compact: boolean }>`
  font-family: ${({ theme }) => theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ compact, theme }) => (compact ? '10.96px' : `${theme.typography.bodyNormal.medium.fontSize}px`)};
  line-height: ${({ compact, theme }) => (compact ? '16.44px' : `${theme.typography.bodyNormal.medium.lineHeight}px`)};
  letter-spacing: ${({ compact, theme }) =>
    compact ? '-0.2192px' : `${theme.typography.bodyNormal.medium.letterSpacing}px`};
`;

const BuildingText = styled.Text<{ compact: boolean }>`
  ${textStyle}
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const PlaceText = styled.Text<{ compact: boolean }>`
  ${textStyle}
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const RoomText = styled.Text<{ compact: boolean }>`
  ${textStyle}
  flex: 1;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const DescriptionText = styled.Text<{ compact: boolean }>`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ compact, theme }) => (compact ? '9.59px' : `${theme.typography.labelNormal.medium.fontSize}px`)};
  line-height: ${({ compact, theme }) => (compact ? '14.39px' : `${theme.typography.labelNormal.medium.lineHeight}px`)};
  letter-spacing: ${({ compact, theme }) =>
    compact ? '-0.1918px' : `${theme.typography.labelNormal.medium.letterSpacing}px`};
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

