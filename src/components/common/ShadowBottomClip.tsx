import React from 'react';
import styled from 'styled-components/native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  /** 위/좌/우로 더 키울(그리고 마이너스 마진으로 되돌릴) 그림자 반경(px) */
  spread: number;
  children: React.ReactNode;
}

/**
 * 카드 아래쪽엔 그림자가 없어야 하는데(위/좌/우만) React Native의 shadow-*는 네 방향을
 * 따로 끌 수 없다. 그래서 카드를 이 래퍼로 감싸 위/좌/우로만 그림자 반경만큼 여유를 더
 * 주고(margin을 마이너스로 줘서 레이아웃 자리는 그대로 유지) overflow: hidden을 걸면,
 * 아래쪽 그림자만 카드 바닥에서 바로 잘리고 나머지 3면은 안 잘린다.
 */
export function ShadowBottomClip({ spread, children }: Props) {
  return <Clip spread={spread}>{children}</Clip>;
}

const Clip = styled.View<{ spread: number }>`
  overflow: hidden;
  padding-top: ${({ spread }) => spread}px;
  padding-left: ${({ spread }) => spread}px;
  padding-right: ${({ spread }) => spread}px;
  margin-top: -${({ spread }) => spread}px;
  margin-left: -${({ spread }) => spread}px;
  margin-right: -${({ spread }) => spread}px;
`;

// Figma: background: linear-gradient(180deg, #FFF 0%, rgba(255,255,255,0) 100%) —
// 카드 맨 아래 항목이 잘려 보이지 않게, 카드 바닥에 흰색→투명 페이드를 얹는다.
export const BottomFade = styled(LinearGradient).attrs({
  colors: ['rgba(255, 255, 255, 0)', '#FFFFFF'],
  locations: [0, 1],
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
})`
  position: absolute;
  bottom: 0px;
  left: 0px;
  right: 0px;
  height: 100px;
`;
