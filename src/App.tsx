import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';
import * as SplashScreen from 'expo-splash-screen';
import { theme } from '@theme';
import { useAppFonts } from '@hooks/useAppFonts';
import Header from '@components/common/Header';
import NavigationBar, { NavigationTab } from '@components/common/NavigationBar';
import IndoorMapTestScreen from '@screens/IndoorMapTestScreen';
import FacilityScreen from '@screens/FacilityScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * 탭(경로)별 상단 헤더 노출 여부와 타이틀. 여기 없는 탭은 헤더 없이 화면을 그대로 그린다.
 * 화면이 자체적으로 상단 UI(검색바 등)를 갖고 있는 경우(map)는 헤더를 쓰지 않는다.
 */
const HEADER_TITLE_BY_TAB: Partial<Record<NavigationTab, string>> = {
  facility: '편의시설',
};

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
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<NavigationTab>('map');

  // TODO: 길찾기 페이지로 이동
  const goToNavigation = () => {};
  // TODO: 편의시설 페이지로 이동
  const goToFacility = () => {};
  // TODO: 주변상권 페이지로 이동
  const goToHongdae = () => {};
  // TODO: MY 페이지로 이동
  const goToMypage = () => {};

  const handleTabPress = (tab: NavigationTab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'navigation':
        goToNavigation();
        break;
      case 'facility':
        goToFacility();
        break;
      case 'hongdae':
        goToHongdae();
        break;
      case 'mypage':
        goToMypage();
        break;
    }
  };

  const headerTitle = HEADER_TITLE_BY_TAB[activeTab];

  return (
    <View style={styles.container}>
      <View style={styles.screen}>
        {headerTitle && (
          <View style={{ paddingTop: insets.top }}>
            <Header title={headerTitle} onBackPress={() => setActiveTab('map')} />
          </View>
        )}
        {activeTab === 'map' && <IndoorMapTestScreen />}
        {activeTab === 'facility' && <FacilityScreen />}
      </View>
      <NavigationBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screen: { flex: 1 },
});

export default App;
