import { NavigatorScreenParams } from '@react-navigation/native';

// 하단 탭 5개. 기존 NavigationBar.tsx의 NavigationTab과 이름을 맞춰서 헷갈리지 않게 한다.
export type MainTabParamList = {
  map: undefined;
  navigation: undefined;
  facility: undefined;
  hongdae: undefined;
  mypage: undefined;
};

// 최상위 스택. 탭 화면들(MainTabs)과, 탭 바 없이 전체화면으로 뜨는 화면(Search)을 구분한다.
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Search: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
