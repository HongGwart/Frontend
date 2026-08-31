import React from 'react';
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
        options={{ animation: 'fade', animationDuration: 150 }}
      />
    </Stack.Navigator>
  );
}
