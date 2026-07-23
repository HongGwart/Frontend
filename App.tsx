import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '@theme';
// import DevThemeCheckScreen from '@screens/DevThemeCheck.screen';
import MapScreen from '@screens/MapScreen';
import DevThemeCheckScreen from '@screens/DevThemeCheck.screen';

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
  return (
    <View style={styles.container}>
      {/* <DevThemeCheckScreen /> */}
      <MapScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default App;