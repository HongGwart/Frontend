import React, { useCallback, useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { theme } from '@theme';
import { useAppFonts } from '@hooks/useAppFonts';
import RootNavigator from '@navigation/RootNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const fontsLoaded = useAppFonts();

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  // Pretendard가 아직 등록되기 전에 그리면 semiBold/medium 구분이 안 되는 기본
  // 시스템 폰트로 한 프레임 반짝였다가 바뀌어 보이므로, 로드 끝날 때까지 아무것도
  // 안 그린다 (스플래시 화면이 그 자리를 대신 채운다).
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ThemeProvider theme={theme}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default App;
