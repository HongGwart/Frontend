import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import OnboardingScreen from '@screens/OnboardingScreen';
import SearchScreen from '@screens/SearchScreen';
import FavoriteListScreen from '@screens/FavoriteListScreen';
import DepartureSettingScreen from '@screens/DepartureSettingScreen';
import FacilityCategoryListScreen from '@screens/FacilityCategoryListScreen';
import BuildingDetailScreen from '@screens/BuildingDetailScreen';
import RouteLocationSearchScreen from '@screens/RouteLocationSearchScreen';
import RouteGuidanceScreen from '@screens/RouteGuidanceScreen';
import BuildingIndoorScreen from '@screens/BuildingIndoorScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * 앱 전체 라우팅의 최상위. 탭 화면들(MainTabs)과, 탭 바 없이 전체화면으로 뜨는
 * Search 화면을 형제로 둔다. 두 화면 다 자체 헤더/뒤로가기 UI를 갖고 있어서
 * 스택 기본 헤더는 끈다.
 */
export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'none' }} />
      {/* 온보딩에서 넘어올 때 옆에서 슬라이드해 들어오는 기본 애니메이션을 잠시 끔. */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ animation: 'none' }} />
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
      <Stack.Screen name="FavoriteList" component={FavoriteListScreen} />
      <Stack.Screen name="DepartureSetting" component={DepartureSettingScreen} />
      <Stack.Screen name="RouteLocationSearch" component={RouteLocationSearchScreen} />
      <Stack.Screen name="RouteGuidance" component={RouteGuidanceScreen} />
      <Stack.Screen name="FacilityCategoryList" component={FacilityCategoryListScreen} />
      {/*
        시설 정보 카드를 위로 슬라이드하면 뜨는 화면이라, 화면 전체가 밑에서 올라오는
        기본 전환 대신 헤더는 바로 나타나고 그 아래 콘텐츠만 카드가 있던 자리에서 이어
        받듯 아래에서 올라온다(BuildingDetailScreen 안의 SlideInDown 애니메이션). 그래서
        여기서는 스택 자체의 전환 애니메이션을 끈다.
      */}
      <Stack.Screen name="BuildingDetail" component={BuildingDetailScreen} options={{ animation: 'none' }} />
      {/*
        건물 카드의 "건물 내부 보기"에서 넘어오는 화면이라, 옆에서 통째로 밀려 들어오면 카드가 옆으로
        같이 움직여 끊겨 보인다. 대신 제자리에서 크로스페이드하고, 카드는 BuildingIndoorScreen 안에서
        바깥 카드 자리부터 이어서 내려앉게 한다. (Search와 같은 이유로 안드로이드는 애니메이션을 끈다.)
      */}
      <Stack.Screen
        name="BuildingIndoor"
        component={BuildingIndoorScreen}
        options={Platform.OS === 'ios' ? { animation: 'fade', animationDuration: 200 } : { animation: 'none' }}
      />
    </Stack.Navigator>
  );
}
