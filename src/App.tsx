import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';
import * as SplashScreen from 'expo-splash-screen';
import { theme } from '@theme';
import { useAppFonts } from '@hooks/useAppFonts';
import AppLayout from '@components/layout/AppLayout';
import { NavigationTab } from '@components/layout/NavigationBar';
import MapScreen from '@screens/MapScreen';
import FacilityScreen from '@screens/FacilityScreen';
import SearchScreen from '@screens/SearchScreen';
import NavigationScreen from '@screens/NavigationScreen';
import HongdaeScreen from '@screens/HongdaeScreen';
import MypageScreen from '@screens/MypageScreen';

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
          <AppContent />
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('map');
  const [isSearchPage, setIsSearchPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 검색 페이지는 탭 화면들과 별개로, 하단 내비게이션 바 없이 전체 화면으로 뜬다.
  // (검색 결과를 탭했을 때도 지도 화면으로 라우팅하지 않고 검색 뷰 안에서 지도+카드를 보여준다.
  // SearchScreen.tsx 참고.)
  if (isSearchPage) {
    return (
      <SearchScreen
        value={searchQuery}
        onChangeText={setSearchQuery}
        onBackPress={() => setIsSearchPage(false)}
      />
    );
  }

  return (
    <AppLayout
      activeTab={activeTab}
      onTabPress={setActiveTab}
      onHeaderBackPress={() => setActiveTab('map')}
    >
      {activeTab === 'map' && <MapScreen onSearchPress={() => setIsSearchPage(true)} />}
      {activeTab === 'facility' && <FacilityScreen />}
      {activeTab === 'navigation' && <NavigationScreen />}
      {activeTab === 'hongdae' && <HongdaeScreen />}
      {activeTab === 'mypage' && <MypageScreen />}
    </AppLayout>
  );
}

export default App;
