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
  /** 즐겨찾기 장소 키를 만들 시설/호실 이름. 건물 자체면 생략(facilityName엔 "R동 홍문관"처럼 표시용 이름이 들어간다) */
  placeName?: string;
}

/**
 * 길찾기 화면(NavigationScreen)에서 출발지/도착지 입력창을 누르면 RouteLocationSearchScreen으로
 * 이동하고, 거기서 검색 결과를 고르면 이 값이 실려서 길찾기 탭으로 돌아온다. 방금 고른 쪽만
 * 담는 게 아니라 항상 출발/도착 두 값을 다 담아서, 한쪽만 값이 오갈 때 다른 쪽이 유실되지
 * 않게(둘 다 독립적으로 유지되게) 한다.
 */
export interface RouteLocationSelection {
  departureLabel?: string;
  destinationLabel?: string;
  /** 서버 검색 결과에서 골랐으면 그 노드 id(GET /api/route의 출발/도착). 앱 더미 장소면 없다. */
  departureNodeId?: number;
  destinationNodeId?: number;
}

// 하단 탭 4개. 길찾기는 탭이 아니라 루트 스택에 푸시되는 화면이다(RootStackParamList.Navigation) —
// 탭이면 화면이 계속 마운트된 채로 남아서, 나가고 들어올 때 진짜 이전 화면이 실시간으로 비치는
// 네이티브 스와이프 백(애플뮤직 같은) 제스처를 쓸 수 없기 때문이다.
export type MainTabParamList = {
  map: { focusFacility?: FocusFacilityParam } | undefined;
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
  // 건물 카드의 "건물 내부 보기"를 누르면 뜨는 건물 내부 지도(층별 평면도). buildingCode("T동")로
  // floorMaps.ts의 층 목록을 찾고, 나머지는 하단 건물 정보 카드에 그대로 쓴다.
  // fromCardHeight는 넘어오기 직전 지도 위 건물 카드(outside)의 높이 — 내부 지도 카드가 그 자리에서
  // 시작해 제자리로 내려앉는 전환 애니메이션에 쓴다.
  BuildingIndoor: {
    buildingCode: string;
    buildingName: string;
    description: string;
    fromCardHeight?: number;
  };
  // 길찾기 화면. 탭이 아니라 루트 스택에 푸시되는 화면이라, 네이티브 스와이프 백 제스처로
  // 뒤로 밀면 진짜로 살아있는 이전 화면(map 탭 등)이 실시간으로 비친다.
  Navigation: { routeSelection?: RouteLocationSelection } | undefined;
  // 길찾기 화면의 출발지/도착지 입력창을 누르면 뜨는 검색 화면. target으로 지금 고르는 중인
  // 입력창을 구분하고, 나머지 한쪽 값(departureLabel/destinationLabel)은 이미 골라둔 값을
  // 그대로 들고 있다가 결과와 함께 돌려보내기 위해 같이 받아온다.
  RouteLocationSearch: { target: 'departure' | 'destination' } & RouteLocationSelection;
  // 길찾기 경로 보기의 "경로 안내 시작"을 누르면 뜨는 길 안내 화면. 출발/도착 노드가 있으면 서버 경로
  // (useRouteSearch 캐시)에서 routeId로 경로를 찾고, 없으면 더미/테스트 경로를 쓴다. 경로의 요약값과
  // destinationLabel은 도착했을 때 상단 카드("…에 도착했어요")에 쓴다.
  RouteGuidance: { routeId: string; destinationLabel: string; fromNodeId?: number; toNodeId?: number };
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
