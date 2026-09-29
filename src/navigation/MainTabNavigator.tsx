import React, { useRef } from 'react';
import { Dimensions, Easing, View } from 'react-native';
import { BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
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
 */
const HEADER_TITLE_BY_TAB: Partial<Record<NavigationTab, string>> = {
  navigation: '길찾기',
  facility: '편의시설',
  hongdae: '주변상권',
  mypage: '마이페이지',
};

const Tab = createBottomTabNavigator<MainTabParamList>();

type SceneStyleInterpolator = NonNullable<BottomTabNavigationOptions['sceneStyleInterpolator']>;

// 지도(map) ↔ 길찾기(navigation) 탭 전환을 스택 push/pop처럼 보이게 하는 애니메이션.
// 길찾기는 탭 바가 없는 전체화면이라, 다른 탭처럼 제자리에서 바뀌면 화면이 툭 갈아끼워진 느낌이 든다.
// progress: 활성 탭 0, 활성 탭보다 앞 인덱스 -1, 뒤 인덱스 1 (bottom-tabs 규칙).
const TAB_PUSH_SPEC: BottomTabNavigationOptions['transitionSpec'] = {
  animation: 'timing',
  config: { duration: 300, easing: Easing.out(Easing.cubic) },
};

// 길찾기 화면은 어느 탭에서 오든 항상 오른쪽에서 들어오고, 나갈 땐 오른쪽으로 빠진다.
const forNavigationPush: SceneStyleInterpolator = ({ current }) => {
  const width = Dimensions.get('window').width;
  return {
    sceneStyle: {
      transform: [
        { translateX: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [width, 0, width] }) },
      ],
    },
  };
};

// 지도는 길찾기가 덮는 동안 왼쪽으로 조금만 밀려나는 패럴랙스(iOS push의 뒤 화면처럼).
// 지도는 첫 탭이라 progress가 0 또는 -1만 오간다. 길찾기와 오갈 때만 쓰고, 다른 탭과는 forSubtleShift.
const forMapUnderPush: SceneStyleInterpolator = ({ current }) => {
  const width = Dimensions.get('window').width;
  return {
    sceneStyle: {
      transform: [
        { translateX: current.progress.interpolate({ inputRange: [-1, 0], outputRange: [-width * 0.3, 0] }) },
      ],
    },
  };
};

// 편의시설/주변상권/마이페이지(와 그 탭들을 오가는 지도)는 길찾기만큼 크게 움직이지 않고, 제자리에서
// 살짝 옆으로 밀리며 페이드되는 미세한 전환만 준다. 오는 방향(progress ±1)에 따라 좌우가 정해진다.
const TAB_SUBTLE_SPEC: BottomTabNavigationOptions['transitionSpec'] = {
  animation: 'timing',
  config: { duration: 180, easing: Easing.out(Easing.cubic) },
};
const SUBTLE_SHIFT = 10;

const forSubtleShift: SceneStyleInterpolator = ({ current }) => ({
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
  // 지도 탭의 전환은 상대가 길찾기일 때만 크게(패럴랙스), 다른 탭이면 미세하게 움직여야 해서 직전/현재
  // 활성 탭을 기억한다. screenOptions는 탭 상태가 바뀔 때 전환 애니메이션보다 먼저 다시 계산되므로,
  // 여기서 갱신하면 그 전환에 맞는 옵션이 잡힌다. 탭이 실제로 바뀔 때만 갱신해서, 전환 도중 다른 이유로
  // 옵션이 다시 계산돼도 값이 흔들리지 않는다.
  const focusHistoryRef = useRef<{ current: string | null; previous: string | null }>({
    current: null,
    previous: null,
  });

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => {
        const tabState = navigation.getState();
        const focusedTab = tabState.routes[tabState.index]?.name ?? null;
        const history = focusHistoryRef.current;
        if (focusedTab !== history.current) {
          history.previous = history.current;
          history.current = focusedTab;
        }
        const isNavigationTransition = history.current === 'navigation' || history.previous === 'navigation';

        const headerTitle = HEADER_TITLE_BY_TAB[route.name];
        // 길찾기 탭이 "경로 보기"(지도+구간 안내) 상태로 바뀌면 NavigationScreen이
        // setParams로 이 값을 켜는데, 그때는 이 탭 내비게이터의 헤더를 아예 끄고
        // NavigationScreen이 지도 위에 직접 투명 헤더를 얹는다(Figma 733:2584) — bottom-tabs의
        // header는 항상 레이아웃 공간을 차지해서 배경만 투명하게 해선 지도가 안 비친다.
        const isViewingRoute =
          route.name === 'navigation' && Boolean((route.params as MainTabParamList['navigation'])?.isViewingRoute);
        return {
          ...(route.name === 'navigation'
            ? { transitionSpec: TAB_PUSH_SPEC, sceneStyleInterpolator: forNavigationPush }
            : route.name === 'map' && isNavigationTransition
              ? { transitionSpec: TAB_PUSH_SPEC, sceneStyleInterpolator: forMapUnderPush }
              : { transitionSpec: TAB_SUBTLE_SPEC, sceneStyleInterpolator: forSubtleShift }),
          headerShown: Boolean(headerTitle) && !isViewingRoute,
          // Figma "길 찾기_출발지/도착지 입력"(720:4897)엔 하단 탭 바가 없어서, 이 탭만 고정으로 감춘다.
          tabBarStyle: route.name === 'navigation' ? { display: 'none' } : undefined,
          // 헤더의 뒤로가기는 기본적으로 기존 AppLayout과 동일하게 실제 스택 pop이 아니라
          // "map 탭으로 돌아가기"로 동작한다. 다만 길찾기는 다른 화면(시설카드 출발/도착 등)에서
          // 넘어올 수 있어서, 그때는 map으로 고정하지 않고 진짜 이전 화면으로 돌아간다.
          // Header 자체는 상단 세이프에어리어를 신경 쓰지 않는 컴포넌트라, 기존 AppLayout처럼
          // paddingTop으로 감싸준다.
          header: () => (
            <View style={{ paddingTop: insets.top, backgroundColor: theme.semantic.background.primary }}>
              <Header
                title={headerTitle ?? ''}
                onBackPress={() => {
                  const parent = navigation.getParent();
                  if (route.name === 'navigation' && parent?.canGoBack()) {
                    parent.goBack();
                    return;
                  }
                  navigation.navigate('map');
                }}
              />
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
            // 길찾기 탭은 들어올 때마다 빈 입력부터 시작해야 해서 resetKey를 같이 넘긴다.
            onTabPress={tab =>
              tab === 'navigation' ? navigation.navigate('navigation', { resetKey: Date.now() }) : navigation.navigate(tab)
            }
            bottomInset={insets.bottom}
          />
        );
      }}
    >
      <Tab.Screen name="map" component={MapTabScreen} />
      <Tab.Screen name="navigation" component={NavigationScreen} />
      <Tab.Screen name="facility" component={FacilityScreen} />
      <Tab.Screen name="hongdae" component={HongdaeScreen} />
      <Tab.Screen name="mypage" component={MypageScreen} />
    </Tab.Navigator>
  );
}
