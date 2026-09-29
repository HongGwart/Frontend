import React from 'react';
import { Easing, View } from 'react-native';
import { BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
import Header from '@components/layout/Header';
import NavigationBar, { NavigationTab } from '@components/layout/NavigationBar';
import MapScreen from '@screens/MapScreen';
import FacilityScreen from '@screens/FacilityScreen';
import HongdaeScreen from '@screens/HongdaeScreen';
import MypageScreen from '@screens/MypageScreen';
import { MainTabParamList, RootStackParamList } from './types';

/**
 * 탭(경로)별 상단 헤더 타이틀. 여기 없는 탭은 헤더 없이 화면을 그대로 그린다.
 * 화면이 자체적으로 상단 UI(검색바 등)를 갖고 있는 map은 헤더를 쓰지 않는다.
 */
const HEADER_TITLE_BY_TAB: Partial<Record<NavigationTab, string>> = {
  facility: '편의시설',
  hongdae: '주변상권',
  mypage: '마이페이지',
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// 탭 전환은 제자리에서 살짝 옆으로 밀리며 페이드되는 미세한 전환만 준다(오는 방향에 따라 좌우가
// 정해짐). 길찾기는 더 이상 탭이 아니라 루트 스택에 푸시되는 화면이라(RootNavigator 참고),
// 여기서 흉내 낼 필요가 없다 — native-stack이 기본으로 주는 진짜 슬라이드+스와이프 백을 쓴다.
const TAB_SUBTLE_SPEC: BottomTabNavigationOptions['transitionSpec'] = {
  animation: 'timing',
  config: { duration: 180, easing: Easing.out(Easing.cubic) },
};
const SUBTLE_SHIFT = 10;

const forSubtleShift: NonNullable<BottomTabNavigationOptions['sceneStyleInterpolator']> = ({ current }) => ({
  sceneStyle: {
    opacity: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-SUBTLE_SHIFT, 0, SUBTLE_SHIFT],
        }),
      },
    ],
  },
});

// map 탭에서 검색창을 누르면 탭 바 없이 전체화면으로 뜨는 Search 스택 화면으로 이동한다.
// Search는 이 탭 내비게이터의 형제(RootNavigator)에 있어서 부모 스택 쪽 navigation이 필요하다.
function MapTabScreen() {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // 마이페이지/즐겨찾기 목록에서 시설을 탭하고 넘어오면 focusFacility가 실려 온다.
  const { params } = useRoute<RouteProp<MainTabParamList, 'map'>>();
  return (
    <MapScreen
      onSearchPress={() => rootNavigation.navigate('Search')}
      onOpenBuildingDetail={buildingCode => rootNavigation.navigate('BuildingDetail', { buildingCode })}
      onOpenBuildingIndoor={building => rootNavigation.navigate('BuildingIndoor', building)}
      focusFacility={params?.focusFacility}
    />
  );
}

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  // 길찾기 탭 버튼을 누르면 탭 전환이 아니라 루트 스택에 새 화면을 푸시한다 — 그래야 뒤로
  // 나올 때 native-stack의 스와이프 백 제스처로 실제 이전 화면이 실시간으로 비친다.
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => {
        const headerTitle = HEADER_TITLE_BY_TAB[route.name];
        return {
          transitionSpec: TAB_SUBTLE_SPEC,
          sceneStyleInterpolator: forSubtleShift,
          headerShown: Boolean(headerTitle),
          // 헤더의 뒤로가기는 실제 스택 pop이 아니라 "map 탭으로 돌아가기"로 동작한다(기존
          // AppLayout과 동일). Header 자체는 상단 세이프에어리어를 신경 쓰지 않는 컴포넌트라,
          // 기존 AppLayout처럼 paddingTop으로 감싸준다.
          header: () => (
            <View style={{ paddingTop: insets.top, backgroundColor: theme.semantic.background.primary }}>
              <Header title={headerTitle ?? ''} onBackPress={() => navigation.navigate('map')} />
            </View>
          ),
        };
      }}
      tabBar={({ state, navigation, descriptors }) => {
        // 시설 상세처럼 탭 화면 안에서 전체화면 상태로 전환될 때, 그 화면이
        // options.tabBarStyle={{ display: 'none' }}을 setOptions로 걸면 탭 바를 감춘다.
        const currentRoute = state.routes[state.index];
        const tabBarStyle = descriptors[currentRoute.key].options.tabBarStyle as { display?: string } | undefined;
        const isTabBarHidden = tabBarStyle?.display === 'none';
        if (isTabBarHidden) return null;

        return (
          <NavigationBar
            activeTab={state.routeNames[state.index] as NavigationTab}
            onTabPress={tab => {
              // 길찾기는 탭이 아니라 루트 스택 화면(RootStackParamList.Navigation)이라 push한다.
              if (tab === 'navigation') {
                rootNavigation.navigate('Navigation');
                return;
              }
              navigation.navigate(tab);
            }}
            bottomInset={insets.bottom}
          />
        );
      }}
    >
      <Tab.Screen name="map" component={MapTabScreen} />
      <Tab.Screen name="facility" component={FacilityScreen} />
      <Tab.Screen name="hongdae" component={HongdaeScreen} />
      <Tab.Screen name="mypage" component={MypageScreen} />
    </Tab.Navigator>
  );
}
