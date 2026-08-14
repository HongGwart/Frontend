import React, { useState } from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import StarIcon from '@assets/svgs/icons/star.svg';
import StarOutlineIcon from '@assets/svgs/icons/starOutline.svg';

interface Props {
  isFavorite: boolean;
  onPress?: () => void;
}

/**
 * 원형 테두리 + 별 아이콘으로 된 즐겨찾기 토글 버튼. FacilityInfoCard/FacilityListItem 등
 * "T동 제1공학관" 같은 제목 옆에 붙는 즐겨찾기 버튼(Figma "Favoraite" 컴포넌트)에서 공통으로 쓴다.
 * 상태 3가지: 기본(회색 테두리+별), 누르는 중(진회색), 즐겨찾기됨(골드).
 */
export function FavoriteToggle({ isFavorite, onPress }: Props) {
  const theme = useTheme();
  // Pressable의 style-as-function은 styled-components를 거치면서 못 쓰게 되므로,
  // 누르는 동안의 회색 강조 상태는 직접 상태로 들고 있는다.
  const [isPressed, setIsPressed] = useState(false);

  return (
    <FavoriteCircle
      isFavorite={isFavorite}
      isPressed={isPressed}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      hitSlop={8}
    >
      {isFavorite ? (
        <StarIcon width={16} height={16} />
      ) : (
        <StarOutlineIcon
          width={16}
          height={16}
          color={isPressed ? theme.semantic.text.tertiary : theme.semantic.line.primary}
        />
      )}
    </FavoriteCircle>
  );
}

const FavoriteCircle = styled(Pressable)<{ isFavorite: boolean; isPressed: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 100px;
  align-items: center;
  justify-content: center;
  border-width: 1.5px;
  border-color: ${({ theme, isFavorite, isPressed }) =>
    isFavorite ? theme.sub.beige : isPressed ? theme.semantic.line.primary : theme.semantic.line.secondary};
`;
