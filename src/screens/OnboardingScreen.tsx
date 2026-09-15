import React, { useEffect } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import GoldLogoSymbol from '@assets/svgs/goldLogoSymbol.svg';
import GoldLogoType from '@assets/svgs/goldLogoType.svg';
import BlueLogoSymbol from '@assets/svgs/blueLogoSymbol.svg';
import BlueLogoType from '@assets/svgs/blueLogoType.svg';
import { Button } from '@components/common/Button';
import { RootStackParamList } from '@navigation/types';

// 마커/로고가 같은 자리에 그대로 있고 색만 바뀌는 두 디자인(Figma "스플래시" 669:3768 →
// "온보딩" 679:1156)이라, 화면을 둘로 나눠 navigation.replace로 뚝 끊어 넘기는 대신
// 한 화면 안에서 배경/로고 색을 크로스페이드하고 나머지 콘텐츠(서브타이틀/점 인디케이터/CTA)를
// 이어서 페이드인시킨다.
const BRAND_HOLD_MS = 1200;
const COLOR_TRANSITION_MS = 600;
const CONTENT_FADE_DELAY_MS = BRAND_HOLD_MS + COLOR_TRANSITION_MS - 200;
const CONTENT_FADE_MS = 400;

const TOTAL_PAGES = 5;
const ACTIVE_PAGE_INDEX = 0;

export default function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // 0 = 브랜드 배경 + 골드 로고(스플래시), 1 = 흰 배경 + 블루 로고(온보딩 소개).
  const colorProgress = useSharedValue(0);
  // 서브타이틀/점 인디케이터/CTA — 스플래시 단계에는 없다가 색 전환이 끝날 무렵 페이드인.
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    colorProgress.value = withDelay(BRAND_HOLD_MS, withTiming(1, { duration: COLOR_TRANSITION_MS }));
    contentOpacity.value = withDelay(CONTENT_FADE_DELAY_MS, withTiming(1, { duration: CONTENT_FADE_MS }));
  }, [colorProgress, contentOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      [theme.semantic.background.brand, theme.semantic.background.primary],
    ),
  }));
  const goldLayerStyle = useAnimatedStyle(() => ({ opacity: 1 - colorProgress.value }));
  const blueLayerStyle = useAnimatedStyle(() => ({ opacity: colorProgress.value }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  return (
    <Container style={containerStyle}>
      <TopSpacer />
      <LogoStack>
        <LogoLayer style={goldLayerStyle}>
          <SymbolBox>
            <GoldLogoSymbol width={117.27} height={152.443} />
          </SymbolBox>
          <GoldLogoType width={163} height={42.487} />
        </LogoLayer>
        <LogoLayer style={blueLayerStyle}>
          <SymbolBox>
            <BlueLogoSymbol width={117.27} height={152.443} />
          </SymbolBox>
          <BlueLogoType width={163} height={42.487} />
        </LogoLayer>
      </LogoStack>

      <FadeInContent style={contentStyle}>
        <Subtitle>홍익대 캠퍼스 내비게이션 앱</Subtitle>
      </FadeInContent>

      <BottomSpacer />

      <FadeInContent style={contentStyle}>
        <PageDots>
          {Array.from({ length: TOTAL_PAGES }).map((_, index) => (
            <Dot key={index} active={index === ACTIVE_PAGE_INDEX} />
          ))}
        </PageDots>
      </FadeInContent>

      <FadeInContent style={[{ width: '100%' }, contentStyle]}>
        <CtaBar style={{ paddingBottom: insets.bottom + 8 }}>
          <Button label="입학하기" disabled onPress={() => navigation.replace('MainTabs', { screen: 'map' })} />
        </CtaBar>
      </FadeInContent>
    </Container>
  );
}

const Container = styled(Animated.View)`
  flex: 1;
  align-items: center;
`;

const TopSpacer = styled.View`
  flex: 1;
`;

const BottomSpacer = styled.View`
  flex: 1;
`;

// 골드/블루 두 레이어가 같은 자리에 겹쳐 있다가 opacity로 크로스페이드된다.
const LogoStack = styled.View`
  width: 163px;
  height: 229.487px;
`;

const LogoLayer = styled(Animated.View)`
  position: absolute;
  inset: 0;
  align-items: center;
  gap: 24px;
`;

// 로고 심볼 원본 비율(117.27 x 152.443)을 유지한 채 163px 정사각형 박스 중앙에 놓는다.
// 163x163으로 늘려서 그리면 로고가 눌린 것처럼 보인다.
const SymbolBox = styled.View`
  width: 163px;
  height: 163px;
  align-items: center;
  justify-content: center;
`;

const FadeInContent = styled(Animated.View)``;

const Subtitle = styled.Text`
  margin-top: 28px;
  font-family: ${({ theme }) => theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
  text-align: center;
`;

const PageDots = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-bottom: 32px;
`;

const Dot = styled.View<{ active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ theme, active }) => (active ? theme.semantic.main : theme.semantic.line.primary)};
`;

const CtaBar = styled.View`
  width: 100%;
  padding: 0 20px;
`;
