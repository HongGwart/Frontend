import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { theme } from '@theme';
import { useAppFonts } from '@hooks/useAppFonts';
import { FavoritesProvider } from '@hooks/useFavorites';
import RootNavigator from '@navigation/RootNavigator';
import { isOnboardingCompleted } from '@storage/onboarding';
import { queryClient } from '@api/queryClient';
import { ApiErrorToastHost } from '@api/errorToast';

SplashScreen.preventAutoHideAsync().catch(() => {});

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const fontsLoaded = useAppFonts();
  // 온보딩을 이미 봤는지(로컬 저장값). undefined면 아직 읽는 중.
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>();
  useEffect(() => {
    isOnboardingCompleted().then(setOnboardingCompleted);
  }, []);
  const ready = fontsLoaded && onboardingCompleted !== undefined;

  const onLayoutRootView = useCallback(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Pretendard가 아직 등록되기 전에 그리면 semiBold/medium 구분이 안 되는 기본
  // 시스템 폰트로 한 프레임 반짝였다가 바뀌어 보이므로, 로드 끝날 때까지 아무것도
  // 안 그린다 (스플래시 화면이 그 자리를 대신 채운다). 온보딩 여부도 읽은 뒤에 그려야
  // 첫 화면이 온보딩 → 지도로 번쩍 바뀌지 않는다.
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <NavigationContainer>
              <FavoritesProvider>
                <RootNavigator initialRouteName={onboardingCompleted ? 'MainTabs' : 'Onboarding'} />
              </FavoritesProvider>
            </NavigationContainer>
            {/* API 실패 시 화면 아래에 뜨는 전역 경고 토스트(queryClient의 전역 onError가 띄운다) */}
            <ApiErrorToastHost />
          </SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default App;
