import React, { useCallback, useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';
import * as SplashScreen from 'expo-splash-screen';
import { theme } from '@theme';
import { useAppFonts } from '@hooks/useAppFonts';
import IndoorMapTestScreen from '@screens/IndoorMapTestScreen';

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
  return (
    <View style={styles.container}>
      {/* <DevThemeCheckScreen /> */}
      {/* <MapScreen /> */}
            <IndoorMapTestScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default App;