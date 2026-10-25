import React from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';
import RightArrowIcon from '@assets/svgs/icons/rightArrow.svg';

interface Props {
  onPrev: () => void;
  onNext: () => void;
  /** 첫 구간이면 이전 버튼을 막는다. */
  prevDisabled?: boolean;
  /** 마지막 구간이면 다음 버튼을 막는다. */
  nextDisabled?: boolean;
}

/**
 * 길 안내 화면 우하단의 이전/다음 구간 버튼. Figma "arrow button"(1156:49122) —
 * 48px 흰 버튼 두 개를 2px 간격으로 붙이고 바깥쪽 모서리만 둥글게 한다.
 */
export function GuidanceStepButtons({ onPrev, onNext, prevDisabled = false, nextDisabled = false }: Props) {
  return (
    <Container>
      <ArrowButton side="left" onPress={onPrev} disabled={prevDisabled} hitSlop={4}>
        <ArrowIconWrapper disabled={prevDisabled} style={{ transform: [{ rotate: '180deg' }] }}>
          <RightArrowIcon width={24} height={24} />
        </ArrowIconWrapper>
      </ArrowButton>
      <ArrowButton side="right" onPress={onNext} disabled={nextDisabled} hitSlop={4}>
        <ArrowIconWrapper disabled={nextDisabled}>
          <RightArrowIcon width={24} height={24} />
        </ArrowIconWrapper>
      </ArrowButton>
    </Container>
  );
}

const Container = styled.View`
  flex-direction: row;
  gap: 2px;
  /* Figma drop-shadow: 0px 4px 5px rgba(0,0,0,0.05) */
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.05;
  shadow-radius: 5px;
  elevation: 3;
`;

const ArrowButton = styled(Pressable)<{ side: 'left' | 'right' }>`
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.semantic.background.primary};
  border-top-left-radius: ${({ side }) => (side === 'left' ? 8 : 0)}px;
  border-bottom-left-radius: ${({ side }) => (side === 'left' ? 8 : 0)}px;
  border-top-right-radius: ${({ side }) => (side === 'right' ? 8 : 0)}px;
  border-bottom-right-radius: ${({ side }) => (side === 'right' ? 8 : 0)}px;
`;

// 더 넘길 구간이 없으면 화살표만 옅게 해서 눌리지 않는 상태임을 보여준다.
const ArrowIconWrapper = styled.View<{ disabled: boolean }>`
  opacity: ${({ disabled }) => (disabled ? 0.3 : 1)};
`;
