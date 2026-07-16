// import React from 'react';
// import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { ThemeProvider } from 'styled-components/native';
// import { theme } from './theme';
// import DevThemeCheckScreen from '@screens/DevThemeCheck.screen';
// import MapScreen from '@screens/MapScreen';

// function App() {
//   const isDarkMode = useColorScheme() === 'dark';

//   return (
//     <ThemeProvider theme={theme}>
//       <SafeAreaProvider>
//         <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
//         <AppContent />
//       </SafeAreaProvider>
//     </ThemeProvider>
//   );
// }

// function AppContent() {
//   return (
//     <View style={styles.container}>
//       <DevThemeCheckScreen />
//       {/* <MapScreen /> */}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// export default App;
import React from 'react';
import { View, Text } from 'react-native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Hello</Text>
      </View>
    </SafeAreaProvider>
  );
}

export default App;
