import React, { useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '@theme';
import NavigationBar, { NavigationTab } from '@components/common/NavigationBar';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <ThemeProvider theme={theme}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppContent />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('map');

  return (
    <View style={styles.container}>
      <View style={styles.screen} />
      <NavigationBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screen: { flex: 1 },
});

export default App;
