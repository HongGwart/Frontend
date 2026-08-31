import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@components/layout/Header';
import NavigationBar, { NavigationTab } from '@components/layout/NavigationBar';
import MapScreen from '@screens/MapScreen';
import FacilityScreen from '@screens/FacilityScreen';
import NavigationScreen from '@screens/NavigationScreen';
import HongdaeScreen from '@screens/HongdaeScreen';
import MypageScreen from '@screens/MypageScreen';
import { MainTabParamList, RootStackParamList } from './types';

/**
 * 탭(경로)별 상단 헤더 타이틀. 여기 없는 탭은 헤더 없이 화면을 그대로 그린다.
 * 화면이 자체적으로 상단 UI(검색바 등)를 갖고 있는 map은 헤더를 쓰지 않는다.
 * 기존 AppLayout.tsx의 HEADER_TITLE_BY_TAB과 동일한 설정을 여기로 옮겼다.
 */
const HEADER_TITLE_BY_TAB: Partial<Record<NavigationTab, string>> = {
  navigation: '길찾기',
  facility: '편의시설',
  hongdae: '주변상권',
  mypage: '마이페이지',
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// map 탭에서 검색창을 누르면 탭 바 없이 전체화면으로 뜨는 Search 스택 화면으로 이동한다.
// Search는 이 탭 내비게이터의 형제(RootNavigator)에 있어서 부모 스택 쪽 navigation이 필요하다.
function MapTabScreen() {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return <MapScreen onSearchPress={() => rootNavigation.navigate('Search')} />;
}

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => {
        const headerTitle = HEADER_TITLE_BY_TAB[route.name];
        return {
          headerShown: Boolean(headerTitle),
          // 헤더의 뒤로가기는 기존 AppLayout과 동일하게 실제 스택 pop이 아니라
          // "map 탭으로 돌아가기"로 동작한다. Header 자체는 상단 세이프에어리어를
          // 신경 쓰지 않는 컴포넌트라, 기존 AppLayout처럼 paddingTop으로 감싸준다.
          header: () => (
            <View style={{ paddingTop: insets.top }}>
              <Header title={headerTitle ?? ''} onBackPress={() => navigation.navigate('map')} />
            </View>
          ),
        };
      }}
      tabBar={({ state, navigation }) => (
        <NavigationBar
          activeTab={state.routeNames[state.index] as NavigationTab}
          onTabPress={tab => navigation.navigate(tab)}
          bottomInset={insets.bottom}
        />
      )}
    >
      <Tab.Screen name="map" component={MapTabScreen} />
      <Tab.Screen name="navigation" component={NavigationScreen} />
      <Tab.Screen name="facility" component={FacilityScreen} />
      <Tab.Screen name="hongdae" component={HongdaeScreen} />
      <Tab.Screen name="mypage" component={MypageScreen} />
    </Tab.Navigator>
  );
}
