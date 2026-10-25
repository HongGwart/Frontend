import React, { useState } from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import StarIcon from '@assets/svgs/icons/star.svg';
import StarOutlineIcon from '@assets/svgs/icons/starOutline.svg';

interface Props {
  isFavorite: boolean;
  onPress?: () => void;
  /** 원 전체 크기(px). 기본 24px — 테두리 두께/별 아이콘도 이 크기에 비례해서 같이 줄어든다. */
  size?: number;
}

const DEFAULT_SIZE = 24;

/**
 * 원형 테두리 + 별 아이콘으로 된 즐겨찾기 토글 버튼. FacilityInfoCard/FacilityListItem 등
 * "T동 제1공학관" 같은 제목 옆에 붙는 즐겨찾기 버튼(Figma "Favoraite" 컴포넌트)에서 공통으로 쓴다.
 * 상태 3가지: 기본(회색 테두리+별), 누르는 중(진회색), 즐겨찾기됨(골드).
 */
export function FavoriteToggle({ isFavorite, onPress, size = DEFAULT_SIZE }: Props) {
  const theme = useTheme();
  // Pressable의 style-as-function은 styled-components를 거치면서 못 쓰게 되므로,
  // 누르는 동안의 회색 강조 상태는 직접 상태로 들고 있는다.
  const [isPressed, setIsPressed] = useState(false);
  const scale = size / DEFAULT_SIZE;
  const iconSize = 16 * scale;

  return (
    <FavoriteCircle
      isFavorite={isFavorite}
      isPressed={isPressed}
      size={size}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      hitSlop={8}
    >
      {isFavorite ? (
        <StarIcon width={iconSize} height={iconSize} />
      ) : (
        <StarOutlineIcon
          width={iconSize}
          height={iconSize}
          color={isPressed ? theme.semantic.text.tertiary : theme.semantic.line.primary}
        />
      )}
    </FavoriteCircle>
  );
}

const FavoriteCircle = styled(Pressable)<{ isFavorite: boolean; isPressed: boolean; size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: 100px;
  align-items: center;
  justify-content: center;
  border-width: ${({ size }) => 1.5 * (size / DEFAULT_SIZE)}px;
  border-color: ${({ theme, isFavorite, isPressed }) =>
    isFavorite ? theme.sub.beige : isPressed ? theme.semantic.line.primary : theme.semantic.line.secondary};
`;
