import React, { useEffect, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, useWindowDimensions } from 'react-native';
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
import TimeIcon from '@assets/svgs/onboarding/time.svg';
import UmbrellaIcon from '@assets/svgs/onboarding/umbrella.svg';
import StairsChipIcon from '@assets/svgs/onboarding/stairsChip.svg';
import OnboardingRouteMockupImage from '@assets/images/onboardingRouteMockup.png';
import { Button } from '@components/common/Button';
import { Chip } from '@components/common/Chip';
import { RootStackParamList } from '@navigation/types';

// 마커/로고가 같은 자리에 그대로 있고 색만 바뀌는 두 디자인(Figma "스플래시" 669:3768 →
// "온보딩" 679:1156)이라, 화면을 둘로 나눠 navigation.replace로 뚝 끊어 넘기는 대신
// 한 화면 안에서 배경/로고 색을 크로스페이드하고 나머지 콘텐츠(서브타이틀/점 인디케이터/CTA)를
// 이어서 페이드인시킨다. 그 뒤로는 온보딩 페이지들을 옆으로 스와이프해서 넘기는
// 가로 페이저(Pager)로 이어진다(Figma "온보딩" 785:7523이 그 두 번째 페이지).
const BRAND_HOLD_MS = 1200;
const COLOR_TRANSITION_MS = 600;
const CONTENT_FADE_DELAY_MS = BRAND_HOLD_MS + COLOR_TRANSITION_MS - 200;
const CONTENT_FADE_MS = 400;

// Figma 점 인디케이터가 5개라 총 5페이지짜리로 기획된 것으로 보이지만, 디자인이 나온
// 두 페이지만 우선 구현한다 — 나머지는 디자인이 나오는 대로 Pager 안에 이어 추가.
const TOTAL_PAGES = 5;

// 길찾기 목업의 칩 3개는 사용자가 직접 누르는 게 아니라, 왼쪽("최단 경로")부터
// 순서대로 하나씩 자동으로 활성화되는 걸 반복 재생해서 "이런 경로들이 있다"를
// 보여주기만 하는 데모 애니메이션이다.
const ROUTE_OPTION_COUNT = 3;
const ROUTE_OPTION_CYCLE_MS = 1200;

// 배경 도면 + 길찾기 폰 목업(Figma 1252:43431, 1252:41198)은 SVG로 쪼개서 넣으면
// 레이어들이 각자 다른 위치로 어긋나 보이는 문제가 있어, Figma에서 3x로 내보낸
// PNG 한 장을 그대로 배경 이미지로 쓴다. 그 위에 겹쳐 있던 칩 3개("최단 경로"/
// "비 회피"/"계단 회피")만 실제 Chip 컴포넌트로 절대 위치에 띄워서 탭 인터랙션/
// 애니메이션이 가능하게 했다.
const ROUTE_MOCKUP_ASPECT_RATIO = 375 / 523;
// 원래 좌표(42)에서 오른쪽으로 살짝 옮긴 값.
const ROUTE_MOCKUP_CHIP_ROW_LEFT = `${(54 / 375) * 100}%`;
const ROUTE_MOCKUP_CHIP_ROW_TOP = `${(202 / 523) * 100}%`;

export default function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // 0 = 브랜드 배경 + 골드 로고(스플래시), 1 = 흰 배경 + 블루 로고(온보딩 페이지들).
  const colorProgress = useSharedValue(0);
  // 페이지 콘텐츠(페이저 + 점 인디케이터 + CTA) — 스플래시 단계엔 없다가 색 전환이
  // 끝날 무렵 페이드인.
  const contentOpacity = useSharedValue(0);
  // 지금 보고 있는 온보딩 페이지(스와이프로 이동). 점 인디케이터 표시에만 쓰여서
  // reanimated 없이 일반 state로 충분하다.
  const [pageIndex, setPageIndex] = useState(0);
  // 길찾기 목업의 "최단 경로"/"비 회피"/"계단 회피" 칩 중 지금 활성화된 것. 사용자가
  // 누르는 게 아니라 아래 인터벌로 왼쪽부터 순서대로 자동 순환된다.
  const [selectedRouteOptionIndex, setSelectedRouteOptionIndex] = useState(0);

  useEffect(() => {
    colorProgress.value = withDelay(BRAND_HOLD_MS, withTiming(1, { duration: COLOR_TRANSITION_MS }));
    contentOpacity.value = withDelay(CONTENT_FADE_DELAY_MS, withTiming(1, { duration: CONTENT_FADE_MS }));
  }, [colorProgress, contentOpacity]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSelectedRouteOptionIndex((prev) => (prev + 1) % ROUTE_OPTION_COUNT);
    }, ROUTE_OPTION_CYCLE_MS);
    return () => clearInterval(intervalId);
  }, []);

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

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPageIndex(Math.round(event.nativeEvent.contentOffset.x / screenWidth));
  };

  return (
    <Container style={containerStyle}>
      <Pager
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        <Page style={{ width: screenWidth }}>
          <TopSpacer />
          {/* 로고 자체는 처음부터(스플래시 단계부터) 바로 보여야 하므로 FadeInContent로
              감싸지 않는다 — 골드/블루 크로스페이드는 goldLayerStyle/blueLayerStyle이
              각자 담당한다. */}
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
        </Page>

        <Page style={{ width: screenWidth }}>
          <TopSpacer />
          <FadeInContent style={[{ width: '100%', alignItems: 'center' }, contentStyle]}>
            <RouteMockupWrapper>
              <RouteMockupImage source={OnboardingRouteMockupImage} resizeMode="contain" />
              <ChipRow style={{ left: ROUTE_MOCKUP_CHIP_ROW_LEFT, top: ROUTE_MOCKUP_CHIP_ROW_TOP }}>
                <Chip
                  label="최단 경로"
                  icon={TimeIcon}
                  active={selectedRouteOptionIndex === 0}
                  disabled
                  bounceOnActivate
                />
                <Chip
                  label="비 회피"
                  icon={UmbrellaIcon}
                  active={selectedRouteOptionIndex === 1}
                  disabled
                  bounceOnActivate
                />
                <Chip
                  label="계단 회피"
                  icon={StairsChipIcon}
                  active={selectedRouteOptionIndex === 2}
                  disabled
                  bounceOnActivate
                />
              </ChipRow>
            </RouteMockupWrapper>

            <Caption>나에게 맞는 경로를 선택하세요</Caption>
          </FadeInContent>
          <BottomSpacer />
        </Page>
      </Pager>

      <FadeInContent style={[{ width: '100%', alignItems: 'center' }, contentStyle]}>
        <PageDots>
          {Array.from({ length: TOTAL_PAGES }).map((_, index) => (
            <Dot key={index} active={index === pageIndex} />
          ))}
        </PageDots>

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

const FadeInContent = styled(Animated.View)``;

const Pager = styled.ScrollView`
  flex: 1;
  width: 100%;
`;

const Page = styled.View`
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

const Subtitle = styled.Text`
  margin-top: 28px;
  font-family: ${({ theme }) => theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
  text-align: center;
`;

const RouteMockupWrapper = styled.View`
  width: 100%;
  aspect-ratio: ${ROUTE_MOCKUP_ASPECT_RATIO};
  position: relative;
`;

const RouteMockupImage = styled.Image`
  width: 100%;
  height: 100%;
`;

const ChipRow = styled.View`
  position: absolute;
  flex-direction: row;
  gap: 8px;
`;

const Caption = styled.Text`
  margin-top: 24px;
  font-family: ${({ theme }) => theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
  text-align: center;
`;

const PageDots = styled.View`
  flex-direction: row;
  justify-content: center;
  width: 100%;
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
