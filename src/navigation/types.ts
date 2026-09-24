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

/**
 * 길찾기 화면(NavigationScreen)에서 출발지/도착지 입력창을 누르면 RouteLocationSearchScreen으로
 * 이동하고, 거기서 검색 결과를 고르면 이 값이 실려서 길찾기 탭으로 돌아온다.
 */
export interface RouteLocationSelection {
  target: 'departure' | 'destination';
  /** 입력창에 그대로 표시할 텍스트 (예: "H동 중앙도서관 314호") */
  label: string;
}

// 하단 탭 5개. 기존 NavigationBar.tsx의 NavigationTab과 이름을 맞춰서 헷갈리지 않게 한다.
export type MainTabParamList = {
  map: { focusFacility?: FocusFacilityParam } | undefined;
  navigation: { routeSelection?: RouteLocationSelection } | undefined;
  facility: undefined;
  hongdae: undefined;
  mypage: undefined;
};

// 최상위 스택. 탭 화면들(MainTabs)과, 탭 바 없이 전체화면으로 뜨는 화면(Search)을 구분한다.
export type RootStackParamList = {
  // 앱 첫 진입 시 보여주는 온보딩 화면. 브랜드 스플래시(골드 로고)로 시작해 한 화면
  // 안에서 흰 배경/블루 로고 + 소개 문구/CTA로 크로스페이드된다(OnboardingScreen).
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Search: undefined;
  FavoriteList: undefined;
  DepartureSetting: undefined;
  // 편의시설 탭에서 카테고리(식당/카페 등)를 탭했을 때 뜨는 해당 카테고리 장소 목록.
  FacilityCategoryList: { categoryId: FacilityCategoryId };
  // 지도 위 시설 정보 카드를 위로 슬라이드하면 뜨는 건물 상세보기. buildingCode는
  // DummyMapMarker.label(예: "H동")과 매칭된다.
  BuildingDetail: { buildingCode: string };
  // 길찾기 화면의 출발지/도착지 입력창을 누르면 뜨는 검색 화면. target으로 어느 입력창을
  // 채워야 하는지 구분한다.
  RouteLocationSearch: { target: 'departure' | 'destination' };
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
