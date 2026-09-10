import { NavigatorScreenParams } from '@react-navigation/native';

/**
 * 마이페이지/즐겨찾기 목록에서 시설을 탭했을 때 map 탭으로 넘겨줄 시설 정보.
 * map 탭이 이 값을 받으면 해당 시설의 정보 바텀시트(FacilityInfoCard)를 열어준다.
 */
export interface FocusFacilityParam {
  id: string;
  buildingCode: string;
  buildingName: string;
  facilityName: string;
  isFavorite?: boolean;
}

// 하단 탭 5개. 기존 NavigationBar.tsx의 NavigationTab과 이름을 맞춰서 헷갈리지 않게 한다.
export type MainTabParamList = {
  map: { focusFacility?: FocusFacilityParam } | undefined;
  navigation: undefined;
  facility: undefined;
  hongdae: undefined;
  mypage: undefined;
};

// 최상위 스택. 탭 화면들(MainTabs)과, 탭 바 없이 전체화면으로 뜨는 화면(Search)을 구분한다.
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Search: undefined;
  FavoriteList: undefined;
  DepartureSetting: undefined;
  // 편의시설 탭에서 카테고리(식당/카페 등)를 탭했을 때 뜨는 해당 카테고리 장소 목록.
  FacilityCategoryList: { categoryId: FacilityCategoryId };
};

// 편의시설 카테고리 그리드(FacilityScreen)의 카테고리 id. 여기서 export해서
// facilityCategories.ts와 네비게이션 타입이 같은 정의를 쓰게 한다.
export type FacilityCategoryId =
  | 'restaurant'
  | 'cafe'
  | 'store'
  | 'readingRoom'
  | 'pc'
  | 'printer'
  | 'bookReturn'
  | 'smokingArea'
  | 'etc';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
