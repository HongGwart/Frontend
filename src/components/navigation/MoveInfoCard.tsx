import React from 'react';
import { Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import CloseThinIcon from '@assets/svgs/icons/closeThin.svg';

interface Props {
  /** 이동 방식 아이콘(도보/계단/출입구/엘리베이터 등). 64x64로 그려진다. */
  icon: React.FC<SvgProps>;
  /**
   * 안내 문구. Figma처럼 특정 지점에서 줄바꿈해야 하면 문자열에 "\n"을 넣어서 두 줄로
   * 만든다(자동 줄바꿈에 맡기면 Figma와 다른 지점에서 끊길 수 있다).
   */
  title: string;
  /** 예: "약 1분 소요" */
  durationText: string;
  onClose?: () => void;
  /** 전체 구간 수. 하단 진행 점(dot)을 이 개수만큼 그린다. */
  stepCount: number;
  /** 지금 보여주는 구간의 인덱스(0부터 시작). 이 점만 강조색으로 그려진다. */
  activeStepIndex: number;
}

/**
 * 길 안내 중 화면 하단(또는 임의 위치)에 떠서 "다음 이렇게 이동하세요"를 보여주는 카드.
 * Figma "move info"(1156:48531/48757/49080) — 아이콘/문구/소요시간이 이동 방식(도보,
 * 계단, 출입구 등)에 따라 바뀌고, 여러 구간을 스와이프/자동 전환으로 넘길 때 하단 점으로
 * 지금이 몇 번째 구간인지 보여준다. 반투명 흰 배경 + 블러(backdrop-blur)로 지도가 은은하게
 * 비쳐서, 어떤 배경 위에 얹어도(지도든 사진이든) 잘 어울린다.
 */
export function MoveInfoCard({ icon: Icon, title, durationText, onClose, stepCount, activeStepIndex }: Props) {
  const theme = useTheme();

  return (
    <Container>
      <Blur intensity={40} tint="light" />
      <Content>
        <TopRow>
          <Icon width={64} height={64} color={theme.blue[500]} />
          <TextBlock>
            <Title>{title}</Title>
            <Duration>{durationText}</Duration>
          </TextBlock>
          <CloseButton onPress={onClose} hitSlop={8}>
            {/* closeThin.svg는 여백 없이 X만 꽉 찬 아이콘이라, Figma "x"(24 박스 안 18px 글리프)에
                맞추려면 24 버튼 안에 18로 그린다. */}
            <CloseThinIcon width={18} height={18} color={theme.semantic.text.tertiary} />
          </CloseButton>
        </TopRow>

        {stepCount > 1 && (
          <DotRow>
            {Array.from({ length: stepCount }).map((_, index) => (
              <Dot key={index} active={index === activeStepIndex} />
            ))}
          </DotRow>
        )}
      </Content>
    </Container>
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

const TextBlock = styled.View`
  flex: 1;
  gap: 4px;
`;

const Title = styled.Text`
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

const DotRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const Dot = styled.View<{ active: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: ${({ theme, active }) => (active ? theme.blue[500] : theme.semantic.line.primary)};
`;
