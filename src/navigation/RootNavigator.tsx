import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import SearchScreen from '@screens/SearchScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * 앱 전체 라우팅의 최상위. 탭 화면들(MainTabs)과, 탭 바 없이 전체화면으로 뜨는
 * Search 화면을 형제로 둔다. 두 화면 다 자체 헤더/뒤로가기 UI를 갖고 있어서
 * 스택 기본 헤더는 끈다.
 */
export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        // native-stack의 animationDuration은 iOS 전용이라(안드로이드는 무시됨),
        // 안드로이드는 커스텀 duration을 줄 수 없는 대신 애니메이션 자체를 꺼서
        // 두 플랫폼 다 확실히 빠르게 전환되도록 한다.
        options={
          Platform.OS === 'ios'
            ? { animation: 'fade', animationDuration: 150 }
            : { animation: 'none' }
        }
      />
    </Stack.Navigator>
  );
}
