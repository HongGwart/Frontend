import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import CloseThinIcon from '@assets/svgs/icons/closeThin.svg';

// 진행 점은 이 개수까지만 보여준다. 카드 폭(320pt 안팎)에 점 6px + 간격 8px이면 23개가 한계인데 안내 카드는
// 37장까지 나와서, 지금 구간 주변만 보여주고 넘길 때마다 점 줄이 따라 움직인다(인스타그램 사진 넘김처럼).
const MAX_VISIBLE_DOTS = 7;
const DOT_SIZE = 6;
// 앞뒤로 점이 더 있다는 표시로 창 맨 끝 점을 작게 그린다.
const EDGE_DOT_SIZE = 3;

/** 보여줄 점의 구간 인덱스들. 지금 구간이 가능한 한 가운데 오게 창을 잡는다. */
function visibleDotRange(stepCount: number, activeIndex: number) {
  if (stepCount <= MAX_VISIBLE_DOTS) return { start: 0, end: stepCount };
  const start = Math.min(stepCount - MAX_VISIBLE_DOTS, Math.max(0, activeIndex - Math.floor(MAX_VISIBLE_DOTS / 2)));
  return { start, end: start + MAX_VISIBLE_DOTS };
}

interface Props {
  /** 이동 방식 아이콘(도보/계단/출입구/엘리베이터 등). 64x64로 그려진다. */
  icon: React.FC<SvgProps>;
  /**
   * 안내 문구. Figma처럼 특정 지점에서 줄바꿈해야 하면 문자열에 "\n"을 넣어서 두 줄로
   * 만든다(자동 줄바꿈에 맡기면 Figma와 다른 지점에서 끊길 수 있다). 칸은 2줄 높이로 고정이고, 넘치면 글자를 줄인다.
   */
  title: string;
  /** 예: "약 1분 소요" */
  durationText: string;
  onClose?: () => void;
  /** 전체 구간 수. 하단 진행 점(dot)을 이 개수만큼(많으면 지금 구간 주변 MAX_VISIBLE_DOTS개만) 그린다. */
  stepCount: number;
  /** 지금 보여주는 구간의 인덱스(0부터 시작). 이 점만 강조색으로 그려진다. */
  activeStepIndex: number;
  /**
   * 카드 틀은 그대로 두고 안쪽 내용(아이콘/문구/소요 시간)에만 걸 스타일. 구간을 좌우로 넘길 때
   * 내용만 밀려 나가고 들어오게 하는 데 쓴다(카드가 overflow: hidden이라 틀 밖은 잘린다).
   */
  contentStyle?: StyleProp<ViewStyle> | AnimatedStyle<ViewStyle>;
}

/**
 * 길 안내 중 화면 하단(또는 임의 위치)에 떠서 "다음 이렇게 이동하세요"를 보여주는 카드.
 * Figma "move info"(1156:48531/48757/49080) — 아이콘/문구/소요시간이 이동 방식(도보,
 * 계단, 출입구 등)에 따라 바뀌고, 여러 구간을 스와이프/자동 전환으로 넘길 때 하단 점으로
 * 지금이 몇 번째 구간인지 보여준다. 반투명 흰 배경 + 블러(backdrop-blur)로 지도가 은은하게
 * 비쳐서, 어떤 배경 위에 얹어도(지도든 사진이든) 잘 어울린다.
 */
export function MoveInfoCard({
  icon: Icon,
  title,
  durationText,
  onClose,
  stepCount,
  activeStepIndex,
  contentStyle,
}: Props) {
  const theme = useTheme();

  return (
    <Container>
      <Blur intensity={40} tint="light" />
      <Content>
        <TopRow>
          <SlidingContent style={contentStyle}>
            <Icon width={64} height={64} color={theme.blue[500]} />
            <TextBlock>
              {/* 1줄·2줄·3줄 문구마다 카드 높이가 바뀌면 진행 점 위치와 지도 패딩(카메라)이 같이 흔들려서, 문구 칸을
                  2줄 높이로 고정한다. 2줄을 넘는 문구(실제 응답의 13%)는 글자를 80%까지 줄여 2줄 안에 넣는다. */}
              <Title numberOfLines={TITLE_LINES} adjustsFontSizeToFit minimumFontScale={0.8}>
                {title}
              </Title>
              <Duration>{durationText}</Duration>
            </TextBlock>
          </SlidingContent>
          <CloseButton onPress={onClose} hitSlop={8}>
            {/* closeThin.svg는 여백 없이 X만 꽉 찬 아이콘이라, Figma "x"(24 박스 안 18px 글리프)에
                맞추려면 24 버튼 안에 18로 그린다. */}
            <CloseThinIcon width={18} height={18} color={theme.semantic.text.tertiary} />
          </CloseButton>
        </TopRow>

        {stepCount > 1 && <StepDots stepCount={stepCount} activeIndex={activeStepIndex} />}
      </Content>
    </Container>
  );
}

function StepDots({ stepCount, activeIndex }: { stepCount: number; activeIndex: number }) {
  const theme = useTheme();
  const { start, end } = visibleDotRange(stepCount, activeIndex);
  const indexes = Array.from({ length: end - start }, (_, i) => start + i);
  return (
    <DotRow>
      {indexes.map(index => {
        const isEdge = (index === start && start > 0) || (index === end - 1 && end < stepCount);
        const size = isEdge ? EDGE_DOT_SIZE : DOT_SIZE;
        return (
          // 구간 인덱스를 key로 써서, 창이 밀리면 기존 점은 옆으로 미끄러지고 끝에서 하나가 들어오고 나간다.
          <Animated.View
            key={index}
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            layout={LinearTransition.duration(200)}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: index === activeIndex ? theme.blue[500] : theme.semantic.line.primary,
            }}
          />
        );
      })}
    </DotRow>
  );
}

const Container = styled.View`
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.66);
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.05;
  shadow-radius: 20px;
  elevation: 8;
`;

const Blur = styled(BlurView)`
  position: absolute;
  inset: 0px;
`;

const Content = styled.View`
  width: 100%;
  align-items: center;
  gap: 24px;
  padding-top: 24px;
  padding-bottom: 16px;
  padding-horizontal: 20px;
`;

const TopRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
`;

// X 버튼은 제자리에 두고 아이콘+문구만 좌우로 움직일 수 있게 따로 묶는다.
const SlidingContent = styled(Animated.View)`
  flex: 1;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
`;

const TextBlock = styled.View`
  flex: 1;
  gap: 4px;
`;

const TITLE_LINES = 2;

const Title = styled.Text`
  height: ${({ theme }) => theme.typography.headline.semiBold.lineHeight * TITLE_LINES}px;
  font-family: ${({ theme }) => theme.typography.headline.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.headline.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.headline.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.headline.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const Duration = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const CloseButton = styled(Pressable)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

// 점 크기가 끝에서 바뀌어도 줄 높이가 흔들리지 않게 큰 점 높이로 고정한다.
const DotRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: ${DOT_SIZE}px;
`;
