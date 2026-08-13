import React, { useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '@theme';
import NavigationBar, { NavigationTab } from '@components/common/NavigationBar';
import IndoorMapTestScreen from '@screens/IndoorMapTestScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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

  return (
    <View style={styles.container}>
      <View style={styles.screen}>{activeTab === 'map' && <IndoorMapTestScreen />}</View>
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
