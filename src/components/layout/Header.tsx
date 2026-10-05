import React from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';
import ChevronLeftIcon from '@assets/svgs/icons/chevronLeft.svg';

interface HeaderProps {
  title: string;
  /**
   * title 옆에 옅은 색으로 덧붙는 보조 텍스트(예: "H동" + "중앙도서관"). 건물 상세보기처럼
   * 코드+명칭을 같이 보여줘야 하는 화면에서만 쓰고, 생략하면 기존처럼 title 하나만 쓴다.
   */
  subtitle?: string;
  onBackPress?: () => void;
  /**
   * true면 배경을 투명하게 그린다(예: 길찾기 "경로 보기"처럼 지도가 헤더 뒤로 그대로
   * 비쳐야 하는 화면). 기본값 false는 기존처럼 불투명한 배경 그대로.
   */
  transparent?: boolean;
}

export default function Header({ title, subtitle, onBackPress, transparent = false }: HeaderProps) {
  return (
    <Container transparent={transparent}>
      {subtitle ? (
        <TitleRow>
          <CodeTitle numberOfLines={1}>{title}</CodeTitle>
          <Subtitle numberOfLines={1}>{subtitle}</Subtitle>
        </TitleRow>
      ) : (
        <Title numberOfLines={1}>{title}</Title>
      )}
      {/* 제목(flex: 1)이 헤더 폭 전체를 덮어서, 버튼을 먼저 그리면 제목이 위에 겹쳐 터치를
          가로챈다. 버튼을 마지막에 그리고 z-index도 올려 항상 제목 위에서 눌리게 한다. */}
      <BackButton onPress={onBackPress} hitSlop={8}>
        <ChevronLeftIcon width={24} height={24} />
      </BackButton>
    </Container>
  );
}

// 뒤로가기 버튼은 absolute로 항상 왼쪽 끝에서 20px(BACK_BUTTON_LEFT)에 고정되고, 제목은 좌우에
// 버튼 자리(20 + 24 + 간격 8 = 52px)만큼 여백을 둔 영역 안에서 가운데 정렬된다 — Figma 헤더의 제목
// 최대 폭 271px(375 − 52×2)과 같고, 제목이 길어도 버튼 밑으로 파고들지 않는다.
const BACK_BUTTON_LEFT = 20;
const BACK_BUTTON_SIZE = 24;
const TITLE_SIDE_INSET = BACK_BUTTON_LEFT + BACK_BUTTON_SIZE + 8;

const Container = styled.View<{ transparent: boolean }>`
  flex-direction: row;
  align-items: center;
  height: 56px;
  padding-horizontal: ${TITLE_SIDE_INSET}px;
  background-color: ${({ theme, transparent }) => (transparent ? 'transparent' : theme.semantic.background.primary)};
`;

const BackButton = styled(Pressable)`
  position: absolute;
  z-index: 1;
  left: ${BACK_BUTTON_LEFT}px;
  width: ${BACK_BUTTON_SIZE}px;
  height: ${BACK_BUTTON_SIZE}px;
  align-items: center;
  justify-content: center;
`;

const Title = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.headline.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.headline.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.headline.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) =>
    theme.typography.headline.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
  text-align: center;
`;

const TitleRow = styled.View`
  flex: 1;
  flex-direction: row;
  gap: 4px;
  align-items: center;
  justify-content: center;
`;

// styled-components의 `flex: 0`/`flex: 1`은 flexBasis: 0까지 같이 들어가서(css-to-react-native 변환), 코드+명칭
// 한 줄에서 쓰면 명칭 칸의 기본 폭이 0이 되고 코드 칸이 남는 폭을 다 가져가 명칭이 사라진다(T동처럼 글자에 따라
// 보였다 안 보였다 함). 그래서 이 줄에서는 flex 줄임말 대신 grow/shrink/basis를 각각 명시한다.
// 코드(title)는 글자 폭 그대로 고정.
const CodeTitle = styled(Title)`
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: auto;
`;

// 코드+명칭이 길어 271px를 넘으면 코드(title)는 그대로 두고 명칭(subtitle)만 줄여서 말줄임(…)한다(Figma와 같음).
const Subtitle = styled(Title)`
  flex-grow: 0;
  flex-shrink: 1;
  flex-basis: auto;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
