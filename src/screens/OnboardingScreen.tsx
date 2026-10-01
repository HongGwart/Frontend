import React, { useEffect, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, useWindowDimensions } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import GoldLogoSymbol from '@assets/svgs/goldLogoSymbol.svg';
import GoldLogoType from '@assets/svgs/goldLogoType.svg';
import BlueLogoSymbol from '@assets/svgs/blueLogoSymbol.svg';
import BlueLogoType from '@assets/svgs/blueLogoType.svg';
import TimeIcon from '@assets/svgs/onboarding/time.svg';
import UmbrellaIcon from '@assets/svgs/onboarding/umbrella.svg';
import StairsChipIcon from '@assets/svgs/onboarding/stairsChip.svg';
import BuildingIcon from '@assets/svgs/icons/building.svg';
import BookIcon from '@assets/svgs/icons/book.svg';
import CafeIcon from '@assets/svgs/icons/cafe.svg';
import StoreIcon from '@assets/svgs/icons/store.svg';
import RestaurantIcon from '@assets/svgs/icons/restaurant.svg';
import PrinterIcon from '@assets/svgs/icons/printer.svg';
import SmokeIcon from '@assets/svgs/icons/smoke.svg';
import PcIcon from '@assets/svgs/icons/pc.svg';
import OnboardingRouteMockupImage from '@assets/images/onboardingRouteMockup.png';
import OnboardingSearchMockupImage from '@assets/images/onboardingSearchMockup.png';
import OnboardingFacilityMockupImage from '@assets/images/onboardingFacilityMockup.png';
import OnboardingHongdaeFlatImage from '@assets/images/onboardingHongdaeFlat.png';
import { Button } from '@components/common/Button';
import { Marker } from '@components/common/Marker';
import { Chip } from '@components/common/Chip';
import { SearchBar } from '@components/common/SearchBar';
import { FacilityListSheet, FacilityListSheetItem } from '@components/common/FacilityListSheet';
import { FacilityInfoCard } from '@components/common/FacilityInfoCard';
import { DUMMY_FACILITY_IMAGES } from '@constant/dummyFacilityInfo';
import { RootStackParamList } from '@navigation/types';
import { markOnboardingCompleted } from '@storage/onboarding';

// 마커/로고가 같은 자리에 그대로 있고 색만 바뀌는 두 디자인(Figma "스플래시" 669:3768 →
// "온보딩" 679:1156)이라, 화면을 둘로 나눠 navigation.replace로 뚝 끊어 넘기는 대신
// 한 화면 안에서 배경/로고 색을 크로스페이드하고 나머지 콘텐츠(서브타이틀/점 인디케이터/CTA)를
// 이어서 페이드인시킨다. 그 뒤로는 온보딩 페이지들을 옆으로 스와이프해서 넘기는
// 가로 페이저(Pager)로 이어진다(Figma "온보딩" 785:7523이 그 두 번째 페이지).
const BRAND_HOLD_MS = 1200;
const COLOR_TRANSITION_MS = 600;
const CONTENT_FADE_DELAY_MS = BRAND_HOLD_MS + COLOR_TRANSITION_MS - 200;
const CONTENT_FADE_MS = 400;

// Figma 점 인디케이터가 5개라 총 5페이지짜리로 기획된 것으로 보이지만, 디자인이 나온
// 두 페이지만 우선 구현한다 — 나머지는 디자인이 나오는 대로 Pager 안에 이어 추가.
const TOTAL_PAGES = 5;

// 길찾기 목업의 칩 3개는 사용자가 직접 누르는 게 아니라, 왼쪽("최단 경로")부터
// 순서대로 하나씩 자동으로 활성화되는 걸 반복 재생해서 "이런 경로들이 있다"를
// 보여주기만 하는 데모 애니메이션이다.
const ROUTE_OPTION_COUNT = 3;
const ROUTE_OPTION_CYCLE_MS = 1200;

// 배경 도면 + 길찾기 폰 목업(Figma 1252:43431, 1252:41198)은 SVG로 쪼개서 넣으면
// 레이어들이 각자 다른 위치로 어긋나 보이는 문제가 있어, Figma에서 3x로 내보낸
// PNG 한 장을 그대로 배경 이미지로 쓴다. 그 위에 겹쳐 있던 칩 3개("최단 경로"/
// "비 회피"/"계단 회피")만 실제 Chip 컴포넌트로 절대 위치에 띄워서 탭 인터랙션/
// 애니메이션이 가능하게 했다.
const ROUTE_MOCKUP_ASPECT_RATIO = 375 / 523;
// 원래 좌표(42)에서 오른쪽으로 살짝 옮긴 값.
const ROUTE_MOCKUP_CHIP_ROW_LEFT = `${(54 / 375) * 100}%`;
const ROUTE_MOCKUP_CHIP_ROW_TOP = `${(202 / 523) * 100}%`;
// ImageMagick -trim으로 찾은 "여백 3px"는 폰 위로 삐져나온 배경 도면 라인(방 번호
// 라벨 등)까지 포함한 값이라 잘못된 기준이었다 — 실제 폰 몸체는 이미지 안에서 꽤
// 아래(실기기 스크린샷으로 검색 페이지 폰 위치와 비교 측정한 값 기준 약 15%)에서
// 시작한다. RouteMockupWrapper(width:100%)에 이 비율만큼 마이너스 마진을 줘서
// 검색 페이지와 폰 위치를 맞춘다.
const ROUTE_MOCKUP_PHONE_TOP_RATIO = 0.15;
// ImageMagick -trim으로 잰 실제 콘텐츠 하단(1110px, 3x) ~ 이미지 전체 높이(1568px, 3x)
// 사이 여백 455px(3x) = 151.667pt. 칩 오버레이(top 202)와 달리 이 이미지 하단 근처엔
// 덧씌우는 실컴포넌트가 없어서(트림값이 왜곡될 이유가 없어서) 이 여백은 폰 몸체 밖
// 진짜 여백으로 신뢰할 수 있다. 폰 "바닥"~Caption 사이를 34px로 맞추려면 이 여백만큼
// Caption의 margin-top에서 빼줘야 한다(화면 폭에 비례해서 커지는 값이라 렌더 시 계산).
const ROUTE_MOCKUP_PHONE_BOTTOM_BLANK_UNITS = 151.667;
// 검색 목업 폰 박스(240x439.584 캔버스)는 반대로 트림 여백을 못 믿는다 — 검색창(top 240)/
// 시설카드(top 310+)가 바로 그 "여백"처럼 보이는 하단부에 실컴포넌트로 덧씌워지는 자리라서,
// 트림 여백은 "폰 밖 공간"이 아니라 "스크린샷에 안 그려둔 폰 화면 안쪽"일 뿐이다. 즉
// SearchMockupPhoneBox 자체가 이미 폰 실제 바닥까지 포함한다고 보고 보정 없이 그대로 쓴다.
// (위 결론 정정) 검색창(240)은 폰 스크린샷 안쪽이 맞지만, 시설 카드(310)는 -trim으로
// 잰 실제 콘텐츠 하단(864px/3x = 288 캔버스 단위)보다 더 아래라 폰 바깥(=슬라이드업
// 되어 폰 밑으로 삐져나오는 카드) 위치다. 즉 288이 진짜 "폰 바닥"이고, 그 뒤(288~439.584)는
// 라우트 목업과 마찬가지로 진짜 여백이라 레이아웃 공간을 그만큼 낭비하고 있었다 —
// 그 낭비된 공간 때문에 페이지 안에 다 안 들어가서 Caption이 화면 밖으로 밀려
// 안 보이는 버그가 있었다. 그래서 Scene의 실제 차지 높이를 폰 바닥(288)까지로 줄이고,
// 검색창/카드 위치는 퍼센트 대신 스케일(260/240) 곱한 고정 px로 둬서 이 높이 변경과
// 무관하게 만든다.
const CAPTION_TO_PHONE_BOTTOM_GAP = 34;

// 세 번째 온보딩 페이지(Figma 785:7580)도 배경은 폰+지도 스크린샷 한 장(1252:43034를
// 3x로 내보낸 PNG)이고, 그 위에 검색창(SearchBar)과 시설 리스트(FacilityListSheet)만
// 실제 컴포넌트로 얹는다. 검색창은 "열람실"이 한 글자씩 타이핑되는 걸 반복 재생하고,
// 다 타이핑되면 그 아래로 시설 카드가 슬라이드업된다 — 둘 다 사용자가 조작하는 게
// 아니라 자동 재생되는 데모라 pointerEvents="none"으로 감싸 탭이 전혀 먹히지 않게 했다.
// Figma에서 검색창(255.87)과 시설 카드(256.79)는 폰(240)보다 더 넓게 화면 앞으로
// 떠 있는 구조다(캔버스 375 기준). 그래서 폰 사진만 작은 고정 크기로 보여주고,
// 검색창/카드는 그 폰을 담고 있는 더 넓은 장면(scene) 기준으로 퍼센트를 잡아서
// 폰 양옆으로 자연스럽게 삐져나오게 한다.
const SEARCH_MOCKUP_CANVAS_WIDTH = 375;
const SEARCH_MOCKUP_PHONE_WIDTH = 240;
const SEARCH_MOCKUP_PHONE_TARGET_WIDTH = 260;
const SEARCH_MOCKUP_ASPECT_RATIO = SEARCH_MOCKUP_PHONE_WIDTH / 439.584;
const SEARCH_MOCKUP_SCENE_WIDTH_PX = (SEARCH_MOCKUP_PHONE_TARGET_WIDTH * SEARCH_MOCKUP_CANVAS_WIDTH) / SEARCH_MOCKUP_PHONE_WIDTH;
const SEARCH_MOCKUP_SCENE_WIDTH = `${SEARCH_MOCKUP_SCENE_WIDTH_PX}px`;
// 폰 원본(240)→실제 렌더 폭(260)으로 커진 배율. 검색창/카드/장면 높이를 전부 이 배율로
// 캔버스 단위 → 실제 px로 변환한다(Scene 높이를 줄여도 이 값들이 %가 아니라 고정 px라
// 영향을 안 받는다).
const SEARCH_MOCKUP_SCALE = SEARCH_MOCKUP_PHONE_TARGET_WIDTH / SEARCH_MOCKUP_PHONE_WIDTH;
// 폰 목업 이미지를 -trim으로 재보면 실제 콘텐츠(폰 스크린샷)는 위에서부터 864px(3x)
// = 288 캔버스 단위에서 끝나고, 그 아래(288~439.584)는 완전히 투명한 여백이다. 이
// 288이 폰의 진짜 바닥이고, 그 뒤는 시설 카드가 슬라이드업하며 폰 밑으로 삐져나오는
// 자리다. Scene에 439.584 전체높이를 다 잡아주면 이 여백만큼 레이아웃 공간이 낭비돼서
// Caption이 페이지 밖으로 밀려버리므로, Scene은 딱 288까지만 차지하게 하고 폰 사진
// 자체는 SearchMockupPhoneBox에 절대위치로 얹어 전체 높이(439.584)를 그대로 유지한다.
const SEARCH_MOCKUP_PHONE_VISIBLE_BOTTOM_CANVAS_UNITS = 288;
const SEARCH_MOCKUP_SCENE_HEIGHT_PX = SEARCH_MOCKUP_PHONE_VISIBLE_BOTTOM_CANVAS_UNITS * SEARCH_MOCKUP_SCALE;
const SEARCH_MOCKUP_PHONE_LEFT_PX = (SEARCH_MOCKUP_SCENE_WIDTH_PX - SEARCH_MOCKUP_PHONE_TARGET_WIDTH) / 2;

// 검색창을 아래로 3px(화면 기준) 더 내리기 위한 보정치. 캔버스(439.584) 단위 오프셋에
// 화면 px을 다시 캔버스 단위로 환산(스케일의 역수)해서 더해준다.
const SEARCH_MOCKUP_SEARCH_BAR_TOP_NUDGE_PX = 4;
const SEARCH_MOCKUP_SEARCH_BAR_TOP_NUDGE_CANVAS_UNITS = SEARCH_MOCKUP_SEARCH_BAR_TOP_NUDGE_PX / SEARCH_MOCKUP_SCALE;
// Figma 좌표(phone: y216 h439.584, search bar: y240) 기준으로 계산한, 폰 목업 박스
// 안에서 검색창이 위치할 세로 위치(px, Scene 상단 기준).
const SEARCH_MOCKUP_SEARCH_BAR_TOP =
  (240 - 216 + SEARCH_MOCKUP_SEARCH_BAR_TOP_NUDGE_CANVAS_UNITS) * SEARCH_MOCKUP_SCALE;
// Figma 좌표(facility list: y310) 기준으로 계산한, 시설 카드가 위치할 세로 위치(px).
const SEARCH_MOCKUP_FACILITY_CARD_TOP = (310 - 216) * SEARCH_MOCKUP_SCALE;
// 검색창/시설 카드의 가로 위치·너비는 폰이 아니라 캔버스(375) 기준 비율.
const SEARCH_MOCKUP_SEARCH_BAR_LEFT = `${(60.13 / SEARCH_MOCKUP_CANVAS_WIDTH) * 100}%`;
const SEARCH_MOCKUP_SEARCH_BAR_WIDTH = `${(255.87 / SEARCH_MOCKUP_CANVAS_WIDTH) * 100}%`;
const SEARCH_MOCKUP_FACILITY_CARD_LEFT = `${(59 / SEARCH_MOCKUP_CANVAS_WIDTH) * 100}%`;
const SEARCH_MOCKUP_FACILITY_CARD_WIDTH = `${(256.79 / SEARCH_MOCKUP_CANVAS_WIDTH) * 100}%`;

const SEARCH_DEMO_QUERY = '열람실';
const SEARCH_DEMO_CHAR_INTERVAL_MS = 180;
const SEARCH_DEMO_TYPING_START_DELAY_MS = 260;
const SEARCH_DEMO_CARD_APPEAR_DELAY_MS = 200;
const SEARCH_DEMO_HOLD_MS = 1600;
const SEARCH_DEMO_RESTART_DELAY_MS = 500;

const SEARCH_DEMO_FACILITY_ITEMS: FacilityListSheetItem[] = [
  {
    id: 'onboarding-search-demo-1',
    icon: BuildingIcon,
    emphasized: true,
    building: 'T동',
    place: '제1공학관',
    description: '공과대학 전공 강의실 및 실습실',
  },
  {
    id: 'onboarding-search-demo-2',
    icon: BookIcon,
    building: 'T동',
    place: '제1공학관',
    room: '505호',
    description: '공과대학 전공 강의실 및 실습실',
    images: DUMMY_FACILITY_IMAGES,
  },
];

// 네 번째 온보딩 페이지(Figma 785:7604)도 배경은 폰+지도 스크린샷 한 장(1252:43650을
// 3x로 내보낸 PNG)이고, 그 위로 두 개만 실제 컴포넌트로 얹는다 — ① 폰 위에 원형으로
// 늘어선 편의시설 아이콘 7개가 실제로 위치를 이동하며 회전하고, ② 맨 위(가운데)로
// 온 아이콘에 맞는 편의시설 카드(FacilityInfoCard)가 아래에 크로스페이드로 바뀐다.
// 폰 자체 크기/보이는 바닥 기준(288 캔버스 단위)은 검색 목업 페이지와 완전히 동일한
// 스크린샷 구조라 그 상수들을 그대로 재사용한다.
const FACILITY_RING_ICON_BOX_SIZE = 48;
// Figma(1257:45531/45533/45572)에서 실측한 좌/우 아이콘 중심 좌표를, 맨 위 슬롯에서부터의
// 각도 거리(dist, 0=맨 위)별 키포인트로 옮긴 값이다 — 원 공식(sin/cos) 대신 이 실측
// 간격을 그대로 보간해서 써야 Figma 배치와 일치한다. dist=0(맨 위 슬롯)은 아이콘 아래쪽
// 끝이 폰 상단(Scene 0,0)에서 16px 위에 오도록 지정한 값이다(center = -16 - iconBox/2 = -40).
// x는 중심(0)에서 좌우로 얼마나 벌어지는지(항상 양수, 부호는 좌/우에 따라 따로 곱한다),
// y는 폰 상단(Scene 0,0) 기준 아이콘 중심의 세로 위치(위쪽일수록 음수).
const FACILITY_RING_TOP_ICON_GAP = 16;
// 7개가 51.43°씩 떨어져 있으면 "쉬는" 위치의 dist는 최대 154.29°까지만 나오지만, 회전
// 도중(한 슬롯에서 다음 슬롯으로 넘어가는 사이)에는 dist가 그보다 커져 180°(맨 아래/뒤)
// 까지 지나간다. 154.29(마지막 쉬는 위치)~160 구간에서 opacity를 0까지 마저 떨어뜨리고
// dx는 그대로 붙잡아 둬서(136.5 유지) "제자리에서 사라지게" 하고, 완전히 안 보이게 된
// 160~180 구간에서만 dx를 0으로 모으고 dy를 계속 내린다 — 이렇게 안 보이는 동안에만
// 폰 뒤 중앙으로 가라앉게 해야, 사라지는 게 아니라 옆으로 슬라이드해 넘어가는 것처럼
// 보이던 문제가 없어진다. 반대쪽(오른쪽)에서 나타날 때도 대칭이라 같은 지점(160)에서
// 다시 튀어나온 뒤, 이후 정상 회전을 타고 위로 올라간다.
const FACILITY_RING_DIST_KEYPOINTS = [0, 360 / 7, (360 / 7) * 2, (360 / 7) * 3, 160, 180];
const FACILITY_RING_DX_KEYPOINTS = [0, 68.5, 121.5, 136.5, 136.5, 0];
const FACILITY_RING_DY_KEYPOINTS = [
  -FACILITY_RING_TOP_ICON_GAP - FACILITY_RING_ICON_BOX_SIZE / 2,
  -18,
  31,
  88,
  97,
  130,
];
const FACILITY_RING_ICON_COUNT = 7;
const FACILITY_RING_ANGLE_STEP = 360 / FACILITY_RING_ICON_COUNT;
const FACILITY_RING_TICK_MS = 2000;
const FACILITY_RING_ROTATE_DURATION_MS = 550;
const FACILITY_CARD_FADE_MS = 220;
// 시설 카드 윗변이 폰 맨 윗부분(SearchMockupScene 상단)에서 152px 아래에 오게 한다.
// FacilityInfoCardBox는 원래 Scene 바로 다음(=Scene 바닥, SEARCH_MOCKUP_SCENE_HEIGHT_PX)에서
// 시작하므로, 그 차이만큼 margin-top으로 끌어올린다(음수면 폰 이미지 위에 겹쳐진다).
const FACILITY_CARD_TOP_GAP_FROM_PHONE_TOP = 152;

interface FacilityDemoCategory {
  id: string;
  icon: React.FC<SvgProps>;
  cardProps: Pick<
    React.ComponentProps<typeof FacilityInfoCard>,
    'facilityName' | 'buildingCode' | 'buildingName' | 'locationDetail' | 'operatingHours' | 'images'
  >;
}

const FACILITY_DEMO_CATEGORIES: FacilityDemoCategory[] = [
  {
    id: 'cafe',
    icon: CafeIcon,
    cardProps: {
      facilityName: '카페나무',
      buildingCode: 'R동',
      buildingName: '홍문관',
      locationDetail: '로비층',
      operatingHours: { isOpen: true, statusText: '운영 중', detailText: '22:00에 운영 종료' },
      images: DUMMY_FACILITY_IMAGES,
    },
  },
  {
    id: 'store',
    icon: StoreIcon,
    cardProps: {
      facilityName: 'GS25 홍대점',
      buildingCode: 'R동',
      buildingName: '홍문관',
      locationDetail: '지하 1층',
      operatingHours: { isOpen: true, statusText: '운영 중', detailText: '24시간 운영' },
      images: DUMMY_FACILITY_IMAGES,
    },
  },
  {
    id: 'restaurant',
    icon: RestaurantIcon,
    cardProps: {
      facilityName: '학생식당',
      buildingCode: 'S동',
      buildingName: '학생회관',
      locationDetail: '1층',
      operatingHours: { isOpen: true, statusText: '운영 중', detailText: '14:00에 운영 종료' },
      images: DUMMY_FACILITY_IMAGES,
    },
  },
  {
    id: 'print',
    icon: PrinterIcon,
    cardProps: {
      facilityName: '프린트룸',
      buildingCode: 'T동',
      buildingName: '제1공학관',
      locationDetail: '2층',
      operatingHours: { isOpen: true, statusText: '운영 중', detailText: '22:00에 운영 종료' },
      images: DUMMY_FACILITY_IMAGES,
    },
  },
  {
    id: 'smoke',
    icon: SmokeIcon,
    cardProps: {
      facilityName: '흡연구역',
      buildingCode: 'G동',
      buildingName: '신관',
      locationDetail: '옥상',
      operatingHours: { isOpen: true, statusText: '운영 중', detailText: '24시간 운영' },
      images: DUMMY_FACILITY_IMAGES,
    },
  },
  {
    id: 'book',
    icon: BookIcon,
    cardProps: {
      facilityName: '제1열람실',
      buildingCode: 'T동',
      buildingName: '제1공학관',
      locationDetail: '3층',
      operatingHours: { isOpen: true, statusText: '운영 중', detailText: '24시간 운영' },
      images: DUMMY_FACILITY_IMAGES,
    },
  },
  {
    id: 'pc',
    icon: PcIcon,
    cardProps: {
      facilityName: 'PC실',
      buildingCode: 'T동',
      buildingName: '제1공학관',
      locationDetail: '4층',
      operatingHours: { isOpen: true, statusText: '운영 중', detailText: '22:00에 운영 종료' },
      images: DUMMY_FACILITY_IMAGES,
    },
  },
];

// 다섯 번째(마지막) 온보딩 페이지(Figma 785:7628)는 배경 지도 사진+흰 비네트+폰
// 스크린샷을 각각 레이어로 재조립하는 대신, Figma에서 그 프레임 전체(1762:77719)를
// 3x로 통으로 내보낸 PNG 한 장을 그대로 배경으로 깐다 — 레이어별 위치를 일일이 맞추다
// 생기던 어긋남/하단 경계 문제를 원천적으로 없앤다. 그 위에 얹는 장식용 반짝이는 마커
// 3개(marker_shine)만 실제 지도에서 쓰는 <Marker /> 컴포넌트(즐겨찾기 별 모양)를
// 재사용해 벡터로 올린다.
const MARKER_BASE_SIZE = 36;
// 배경 PNG 자체가 그려진 Figma 캔버스 폭(375pt) — 마커 좌표도 이 캔버스 기준이라, 화면
// 폭에 맞춰 배경을 늘릴 때와 똑같은 배율을 마커 위치/크기에도 곱해야 어긋나지 않는다.
const HONGDAE_FLAT_CANVAS_WIDTH = 375;
const HONGDAE_FLAT_ASPECT_RATIO = 375 / 656;
// 배경 PNG 캔버스(375x656) 안에서 폰 스크린샷 윗변의 y좌표(Figma "주변상권" 프레임 top).
const HONGDAE_FLAT_PHONE_TOP = 216;
// 다른 목업 페이지들처럼 폰 콘텐츠의 288 캔버스 유닛(=SEARCH_MOCKUP_PHONE_VISIBLE_BOTTOM_CANVAS_UNITS)
// 까지만 레이아웃 높이로 차지하게 하고 그 아래(하단 리스트/네비게이션바)는 잘라낸다 —
// 안 그러면 배경까지 포함한 이 페이지 전체 높이가 다른 페이지보다 훨씬 커져서, 캡션이
// 스크롤뷰(Pager)의 세로 뷰포트 밖으로 밀려나 아예 안 보이게 된다.
const HONGDAE_FLAT_VISIBLE_HEIGHT = 288;

interface MarkerShineSpec {
  /** 마커 본인의 시각적 지름(캔버스 375pt 기준) */
  size: number;
  /** 배경 PNG 캔버스(375pt) 기준 마커 박스의 좌상단 left */
  left: number;
  /** 배경 PNG 캔버스(375pt) 기준 마커 박스의 좌상단 top */
  top: number;
}

const HONGDAE_MARKER_SHINES: MarkerShineSpec[] = [
  // Figma 1252:42675 — 폰 오른쪽에 딱 붙은 중간 크기 마커
  { size: 40, left: 308, top: 220 },
  // Figma 1252:42681 — 폰 왼쪽 위, 폰보다 위로 올라간 큰 마커
  { size: 56, left: 84, top: 124 },
  // Figma 1252:42686 — 폰 왼쪽 아래, 폰 밖으로 삐져나온 작은 마커
  { size: 36, left: 27, top: 295 },
];

// 마커 3개가 토스 스타일로 살짝 숨쉬듯 불투명도가 반짝이는 트랜지션. 전부 같은 박자로
// 움직이면 기계적으로 보여서, 마커마다 시작 딜레이를 다르게 줘 위상을 어긋나게 한다.
const MARKER_GLOW_STAGGER_MS = 260;
const MARKER_GLOW_DIM_MS = 900;
const MARKER_GLOW_BRIGHT_MS = 900;
const MARKER_GLOW_MIN_OPACITY = 0.35;

function MarkerGlow({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      index * MARKER_GLOW_STAGGER_MS,
      withRepeat(
        withSequence(
          withTiming(MARKER_GLOW_MIN_OPACITY, {
            duration: MARKER_GLOW_DIM_MS,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(1, { duration: MARKER_GLOW_BRIGHT_MS, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      ),
    );
  }, [index, opacity]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={glowStyle}>{children}</Animated.View>;
}

// 링 안의 아이콘 하나. 회전 각도(shared value)와 자기 슬롯 각도로 매 프레임
// 위치(x,y)·불투명도·스케일을 직접 계산한다 — 부모 안에서 map으로 7개를 그려야 해서
// useAnimatedStyle을 쓰려면 이렇게 별도 컴포넌트로 뺄 수밖에 없다(훅을 map 콜백
// 안에서 직접 호출할 수 없어서).
function FacilityRingIcon({
  index,
  icon: Icon,
  rotation,
}: {
  index: number;
  icon: React.FC<SvgProps>;
  rotation: SharedValue<number>;
}) {
  const theme = useTheme();
  const style = useAnimatedStyle(() => {
    const baseAngle = index * FACILITY_RING_ANGLE_STEP;
    const angleDeg = baseAngle + rotation.value;
    const normalized = (((angleDeg % 360) + 540) % 360) - 180;
    const dist = Math.abs(normalized);
    const sign = normalized < 0 ? -1 : 1;
    // 쉬는 위치(최대 154.29°)에서는 7개가 다 옅게라도 보이도록 0이 되지 않게 하되,
    // 회전 중 154.29°를 지나 180°(맨 아래)까지 더 내려가는 동안에는 흰 배경 속으로
    // 사르르 사라지도록 그 구간에서만 0으로 마저 페이드아웃한다.
    const opacity = interpolate(
      dist,
      [0, 15, 90, 154.29, 160, 180],
      [1, 0.33, 0.33, 0.18, 0, 0],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(dist, [0, 15, 40], [1.12, 1.12, 1], Extrapolation.CLAMP);
    const dx = interpolate(dist, FACILITY_RING_DIST_KEYPOINTS, FACILITY_RING_DX_KEYPOINTS, Extrapolation.CLAMP);
    const dy = interpolate(dist, FACILITY_RING_DIST_KEYPOINTS, FACILITY_RING_DY_KEYPOINTS, Extrapolation.CLAMP);
    return {
      opacity,
      transform: [
        { translateX: sign * dx - FACILITY_RING_ICON_BOX_SIZE / 2 },
        { translateY: dy - FACILITY_RING_ICON_BOX_SIZE / 2 },
        { scale },
      ],
    };
  });

  return (
    <RingIconCircle style={style} pointerEvents="none">
      <Icon width={24} height={24} color={theme.blue[500]} />
    </RingIconCircle>
  );
}

export default function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // 0 = 브랜드 배경 + 골드 로고(스플래시), 1 = 흰 배경 + 블루 로고(온보딩 페이지들).
  const colorProgress = useSharedValue(0);
  // 페이지 콘텐츠(페이저 + 점 인디케이터 + CTA) — 스플래시 단계엔 없다가 색 전환이
  // 끝날 무렵 페이드인.
  const contentOpacity = useSharedValue(0);
  // 지금 보고 있는 온보딩 페이지(스와이프로 이동). 점 인디케이터 표시에만 쓰여서
  // reanimated 없이 일반 state로 충분하다.
  const [pageIndex, setPageIndex] = useState(0);
  // "입학하기"는 마지막 페이지에서만 바로 눌리게 열린다(트랜지션 없이 즉시 반영).
  const ctaEnabled = pageIndex === TOTAL_PAGES - 1;
  // 길찾기 목업의 "최단 경로"/"비 회피"/"계단 회피" 칩 중 지금 활성화된 것. 사용자가
  // 누르는 게 아니라 아래 인터벌로 왼쪽부터 순서대로 자동 순환된다.
  const [selectedRouteOptionIndex, setSelectedRouteOptionIndex] = useState(0);
  // 검색창 목업에 "열람실"이 한 글자씩 타이핑되는 걸 보여주는 텍스트. 사용자 입력이
  // 아니라 아래 반복 루프가 채워 넣는다.
  const [searchDemoQuery, setSearchDemoQuery] = useState('');
  // 검색어가 다 타이핑된 뒤에만 켜져서 시설 카드를 슬라이드업시키는 진행도(0~1).
  const facilityCardProgress = useSharedValue(0);
  // 타이핑 중(글자가 다 안 채워진 동안)에만 깜빡이는 커서 표시 여부.
  const [caretOn, setCaretOn] = useState(true);
  const isTypingIncomplete = searchDemoQuery.length < SEARCH_DEMO_QUERY.length;

  // 편의시설 목업의 아이콘 링 회전 각도(도). 매 틱마다 -각도스텝만큼 더 돌려서, 항상
  // 다음 아이콘이 맨 위(가운데)로 오게 한다.
  const facilityRingRotation = useSharedValue(0);
  // 지금 맨 위에 온 편의시설(카드에 표시되는 것). 링 회전이 다 끝난 뒤(카드가 완전히
  // 사라진 시점)에만 바뀌어서, 카드 텍스트가 안 보일 때 바뀌고 다시 나타난다.
  const [activeFacilityIndex, setActiveFacilityIndex] = useState(0);
  const facilityCardFade = useSharedValue(1);
  // 편의시설 링 회전 인터벌의 애니메이션 완료 콜백이 unmount 뒤에도 늦게 실행돼 setState를
  // 부르지 않도록 마운트 여부를 들고 있는다(worklet에서 읽어야 해서 SharedValue로 둔다).
  const isMounted = useSharedValue(true);

  useEffect(() => {
    colorProgress.value = withDelay(BRAND_HOLD_MS, withTiming(1, { duration: COLOR_TRANSITION_MS }));
    contentOpacity.value = withDelay(CONTENT_FADE_DELAY_MS, withTiming(1, { duration: CONTENT_FADE_MS }));
  }, [colorProgress, contentOpacity]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSelectedRouteOptionIndex((prev) => (prev + 1) % ROUTE_OPTION_COUNT);
    }, ROUTE_OPTION_CYCLE_MS);
    return () => clearInterval(intervalId);
  }, []);


  useEffect(() => {
    const intervalId = setInterval(() => setCaretOn((prev) => !prev), 480);
    return () => clearInterval(intervalId);
  }, []);

  // "열람실"을 한 글자씩 타이핑 → 잠깐 멈춰서 시설 카드 슬라이드업 → 다 보여준 채로
  // 대기 → 지우고 카드도 내려간 뒤 → 다시 처음부터, 를 계속 반복하는 데모 루프.
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timeoutId = setTimeout(resolve, ms);
      });

    const runLoop = async () => {
      while (!cancelled) {
        setSearchDemoQuery('');
        facilityCardProgress.value = withTiming(0, { duration: 200 });
        await wait(SEARCH_DEMO_TYPING_START_DELAY_MS);
        if (cancelled) return;

        for (let charCount = 1; charCount <= SEARCH_DEMO_QUERY.length; charCount += 1) {
          // 사람이 실제로 치는 것처럼 글자마다 간격을 살짝 흔들어준다(고정 간격이면 기계적으로 보임).
          await wait(SEARCH_DEMO_CHAR_INTERVAL_MS + Math.random() * 120 - 40);
          if (cancelled) return;
          setSearchDemoQuery(SEARCH_DEMO_QUERY.slice(0, charCount));
        }

        await wait(SEARCH_DEMO_CARD_APPEAR_DELAY_MS);
        if (cancelled) return;
        facilityCardProgress.value = withSpring(1, { damping: 15, stiffness: 160 });

        await wait(SEARCH_DEMO_HOLD_MS);
        if (cancelled) return;
        facilityCardProgress.value = withTiming(0, { duration: 220 });

        await wait(SEARCH_DEMO_RESTART_DELAY_MS);
      }
    };

    runLoop();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [facilityCardProgress]);

  // 편의시설 아이콘 링을 일정 간격으로 한 칸씩 물리적으로 돌리고, 카드가 다 사라진
  // 시점(페이드아웃 완료)에 다음 편의시설로 바꿔치기한 뒤 다시 페이드인시킨다.
  useEffect(() => {
    let tick = 0;
    // withTiming의 완료 콜백은 UI 스레드(worklet)에서 실행되기 때문에, 인터벌이 정리된
    // 뒤(화면이 unmount된 뒤)에도 이미 예약된 애니메이션이 끝나면서 콜백이 늦게 한 번
    // 더 실행될 수 있다 — 그때 scheduleOnRN(setActiveFacilityIndex)가 unmount된 컴포넌트의
    // setState를 부르지 않도록, SharedValue로 마운트 여부를 들고 있다가 확인한다.
    isMounted.value = true;
    const intervalId = setInterval(() => {
      tick += 1;
      facilityRingRotation.value = withTiming(-tick * FACILITY_RING_ANGLE_STEP, {
        duration: FACILITY_RING_ROTATE_DURATION_MS,
        // 기본(선형에 가까운) 이징은 안 보이는 구간(160~180°)을 빠르게 지나고 나서도
        // 등속으로 계속 움직여, 반대쪽에서 다시 나타난 요소가 위로 올라오는 속도가
        // 처음엔 덜 붙는 것처럼 보인다. ease-out으로 바꿔서 회전 시작 직후 속도를 한번에
        // 붙이고 뒤로 갈수록 감속하게 하면 "튀어나와서 올라오는" 느낌이 더 산다.
        easing: Easing.out(Easing.cubic),
      });
      facilityCardFade.value = withTiming(0, { duration: FACILITY_CARD_FADE_MS }, (finished) => {
        if (finished && isMounted.value) {
          scheduleOnRN(setActiveFacilityIndex, tick % FACILITY_RING_ICON_COUNT);
          facilityCardFade.value = withTiming(1, { duration: FACILITY_CARD_FADE_MS });
        }
      });
    }, FACILITY_RING_TICK_MS);
    return () => {
      isMounted.value = false;
      clearInterval(intervalId);
    };
  }, [facilityCardFade, facilityRingRotation, isMounted]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      [theme.semantic.background.brand, theme.semantic.background.primary],
    ),
  }));
  const goldLayerStyle = useAnimatedStyle(() => ({ opacity: 1 - colorProgress.value }));
  const blueLayerStyle = useAnimatedStyle(() => ({ opacity: colorProgress.value }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
  const facilityCardStyle = useAnimatedStyle(() => ({
    opacity: facilityCardProgress.value,
    transform: [{ translateY: (1 - facilityCardProgress.value) * 28 }],
  }));
  const facilityInfoCardFadeStyle = useAnimatedStyle(() => ({
    opacity: facilityCardFade.value,
    transform: [{ translateY: (1 - facilityCardFade.value) * 10 }],
  }));
  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPageIndex(Math.round(event.nativeEvent.contentOffset.x / screenWidth));
  };

  return (
    <Container style={containerStyle}>
      <Pager
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        <Page style={{ width: screenWidth }}>
          <TopSpacer />
          {/* 로고 자체는 처음부터(스플래시 단계부터) 바로 보여야 하므로 FadeInContent로
              감싸지 않는다 — 골드/블루 크로스페이드는 goldLayerStyle/blueLayerStyle이
              각자 담당한다. */}
          <LogoStack>
            <LogoLayer style={goldLayerStyle}>
              <SymbolBox>
                <GoldLogoSymbol width={117.27} height={152.443} />
              </SymbolBox>
              <GoldLogoType width={163} height={42.487} />
            </LogoLayer>
            <LogoLayer style={blueLayerStyle}>
              <SymbolBox>
                <BlueLogoSymbol width={117.27} height={152.443} />
              </SymbolBox>
              <BlueLogoType width={163} height={42.487} />
            </LogoLayer>
          </LogoStack>
          <FadeInContent style={contentStyle}>
            <Subtitle>홍익대 캠퍼스 내비게이션 앱</Subtitle>
          </FadeInContent>
          <BottomSpacer />
        </Page>

        <Page style={{ width: screenWidth }}>
          <PhoneMockupTopSpacer />
          <FadeInContent style={[{ width: '100%', alignItems: 'center' }, contentStyle]}>
            <RouteMockupWrapper
              style={{ marginTop: -(screenWidth * (523 / 375) * ROUTE_MOCKUP_PHONE_TOP_RATIO) }}
            >
              <RouteMockupImage source={OnboardingRouteMockupImage} resizeMode="contain" />
              <ChipRow style={{ left: ROUTE_MOCKUP_CHIP_ROW_LEFT, top: ROUTE_MOCKUP_CHIP_ROW_TOP }}>
                <Chip
                  label="최단 경로"
                  icon={TimeIcon}
                  active={selectedRouteOptionIndex === 0}
                  disabled
                  bounceOnActivate
                />
                <Chip
                  label="비 회피"
                  icon={UmbrellaIcon}
                  active={selectedRouteOptionIndex === 1}
                  disabled
                  bounceOnActivate
                />
                <Chip
                  label="계단 회피"
                  icon={StairsChipIcon}
                  active={selectedRouteOptionIndex === 2}
                  disabled
                  bounceOnActivate
                />
              </ChipRow>
            </RouteMockupWrapper>

            <Caption
              style={{
                marginTop:
                  CAPTION_TO_PHONE_BOTTOM_GAP -
                  screenWidth * (ROUTE_MOCKUP_PHONE_BOTTOM_BLANK_UNITS / 375),
              }}
            >
              나에게 맞는 경로를 선택하세요
            </Caption>
          </FadeInContent>
          <BottomSpacer />
        </Page>

        <Page style={{ width: screenWidth }}>
          <PhoneMockupTopSpacer />
          <FadeInContent style={[{ width: '100%', alignItems: 'center' }, contentStyle]}>
            <SearchMockupScene>
              <SearchMockupPhoneBox>
                <SearchMockupImage source={OnboardingSearchMockupImage} resizeMode="contain" />
              </SearchMockupPhoneBox>

              <SearchBarBox
                style={{ top: SEARCH_MOCKUP_SEARCH_BAR_TOP, left: SEARCH_MOCKUP_SEARCH_BAR_LEFT, width: SEARCH_MOCKUP_SEARCH_BAR_WIDTH }}
                pointerEvents="none"
              >
                <SearchBar
                  value={searchDemoQuery + (isTypingIncomplete && caretOn ? '|' : '')}
                  onChangeText={() => {}}
                  compact
                />
              </SearchBarBox>

              <FacilityCardBox
                style={[
                  {
                    top: SEARCH_MOCKUP_FACILITY_CARD_TOP,
                    left: SEARCH_MOCKUP_FACILITY_CARD_LEFT,
                    width: SEARCH_MOCKUP_FACILITY_CARD_WIDTH,
                  },
                  facilityCardStyle,
                ]}
                pointerEvents="none"
              >
                <FacilityListSheet items={SEARCH_DEMO_FACILITY_ITEMS} compact />
              </FacilityCardBox>
            </SearchMockupScene>

            <Caption style={{ marginTop: CAPTION_TO_PHONE_BOTTOM_GAP }}>
              찾고 싶은 곳을 바로 검색하세요
            </Caption>
          </FadeInContent>
          <BottomSpacer />
        </Page>

        <Page style={{ width: screenWidth }}>
          <PhoneMockupTopSpacer />
          <FadeInContent style={[{ width: '100%', alignItems: 'center' }, contentStyle]}>
            <SearchMockupScene>
              {/* 아이콘 링을 폰 스크린샷보다 먼저 그려서 폰 뒤에 깔리게 한다(회전하며
                  폰 몸체 쪽으로 들어가는 아이콘은 폰에 가려지고, 옆으로 삐져나온
                  부분만 보이는 게 Figma 의도와 맞다). */}
              <FacilityIconRing pointerEvents="none">
                {FACILITY_DEMO_CATEGORIES.map((category, index) => (
                  <FacilityRingIcon
                    key={category.id}
                    index={index}
                    icon={category.icon}
                    rotation={facilityRingRotation}
                  />
                ))}
              </FacilityIconRing>

              <SearchMockupPhoneBox>
                <SearchMockupImage source={OnboardingFacilityMockupImage} resizeMode="contain" />
              </SearchMockupPhoneBox>

              <FacilityInfoCardBox
                style={[{ top: FACILITY_CARD_TOP_GAP_FROM_PHONE_TOP }, facilityInfoCardFadeStyle]}
                pointerEvents="none"
              >
                <FacilityInfoCard
                  variant="facility"
                  isFavorite
                  compact
                  hideCta
                  {...FACILITY_DEMO_CATEGORIES[activeFacilityIndex].cardProps}
                />
              </FacilityInfoCardBox>
            </SearchMockupScene>

            <Caption style={{ marginTop: CAPTION_TO_PHONE_BOTTOM_GAP }}>
              지금 열려있는 시설을 확인하세요
            </Caption>
          </FadeInContent>
          <BottomSpacer />
        </Page>

        <Page style={{ width: screenWidth }}>
          <PhoneMockupTopSpacer />
          <FadeInContent style={[{ width: '100%', alignItems: 'center' }, contentStyle]}>
            {(() => {
              const hongdaeScale = screenWidth / HONGDAE_FLAT_CANVAS_WIDTH;
              const hongdaeHeight = screenWidth / HONGDAE_FLAT_ASPECT_RATIO;
              // 다른 온보딩 페이지는 PhoneMockupTopSpacer(240px) 바로 다음에 폰 스크린샷의
              // 윗변이 온다. 이 배경 PNG는 폰(캔버스 y=216)보다 위쪽 배경 그림까지 포함하고
              // 있어서, 그만큼 음수 마진으로 Scene 전체를 끌어올려야 폰 세로 위치가 다른
              // 페이지와 맞는다(마커도 이 Scene 기준 캔버스 절대좌표를 그대로 쓴다).
              const marginTop = -HONGDAE_FLAT_PHONE_TOP * hongdaeScale;
              // Scene은 "배경(0) ~ 폰 하단에서 288유닛까지(=phone top + visible height)"만
              // 레이아웃 높이로 차지하고, 그 아래로 삐져나오는 이미지 나머지(리스트 하단/
              // 네비게이션바)는 overflow: hidden으로 잘라낸다 — 안 그러면 페이지 전체 높이가
              // 다른 페이지보다 커져서 캡션이 Pager 세로 뷰포트 밖으로 밀려 안 보이게 된다.
              const visibleHeight = (HONGDAE_FLAT_PHONE_TOP + HONGDAE_FLAT_VISIBLE_HEIGHT) * hongdaeScale;
              return (
                <HongdaeFlatScene style={{ width: screenWidth, height: visibleHeight, marginTop }}>
                  <HongdaeFlatImage
                    source={OnboardingHongdaeFlatImage}
                    resizeMode="contain"
                    style={{ width: screenWidth, height: hongdaeHeight, top: 0 }}
                  />

                  {HONGDAE_MARKER_SHINES.map((marker, index) => {
                    const visualSize = marker.size * hongdaeScale;
                    return (
                      <MarkerShineBox
                        key={index}
                        pointerEvents="none"
                        style={{
                          left: marker.left * hongdaeScale + (visualSize - MARKER_BASE_SIZE) / 2,
                          top: marker.top * hongdaeScale + (visualSize - MARKER_BASE_SIZE) / 2,
                          transform: [{ scale: visualSize / MARKER_BASE_SIZE }],
                        }}
                      >
                        <MarkerGlow index={index}>
                          <Marker favorite />
                        </MarkerGlow>
                      </MarkerShineBox>
                    );
                  })}
                </HongdaeFlatScene>
              );
            })()}

            <Caption style={{ marginTop: CAPTION_TO_PHONE_BOTTOM_GAP }}>
              홍대 맛집도 바로 찾아보세요
            </Caption>
          </FadeInContent>
          <BottomSpacer />
        </Page>
      </Pager>

      <FadeInContent style={[{ width: '100%', alignItems: 'center' }, contentStyle]}>
        <PageDots>
          {Array.from({ length: TOTAL_PAGES }).map((_, index) => (
            <Dot key={index} active={index === pageIndex} />
          ))}
        </PageDots>

        <CtaBar style={{ paddingBottom: insets.bottom + 8 }}>
          <Button
            label="입학하기"
            disabled={!ctaEnabled}
            onPress={() => {
              // 끝까지 보고 입학하기를 눌렀을 때만 완료로 기록한다(중간에 앱을 끄면 다음에 다시 보여준다).
              markOnboardingCompleted();
              navigation.replace('MainTabs', { screen: 'map' });
            }}
          />
        </CtaBar>
      </FadeInContent>
    </Container>
  );
}

const Container = styled(Animated.View)`
  flex: 1;
  align-items: center;
`;

const FadeInContent = styled(Animated.View)``;

const Pager = styled.ScrollView`
  flex: 1;
  width: 100%;
`;

const Page = styled.View`
  align-items: center;
`;

const TopSpacer = styled.View`
  flex: 1;
`;

const BottomSpacer = styled.View`
  flex: 1;
`;

// 경로 목업 페이지와 검색 목업 페이지, 둘 다 이 고정 여백만큼 내려온 자리에서
// 폰 이미지가 시작한다 — 두 페이지 전환 시 폰이 같은 높이에 있는 것처럼 보이게
// 맞춘 값(TopSpacer flex:1로 각자 다르게 중앙 정렬되면 콘텐츠 높이가 달라서
// 폰 위치도 미묘하게 어긋난다).
const PHONE_MOCKUP_TOP_MARGIN = 240;

const PhoneMockupTopSpacer = styled.View`
  height: ${PHONE_MOCKUP_TOP_MARGIN}px;
`;

// 골드/블루 두 레이어가 같은 자리에 겹쳐 있다가 opacity로 크로스페이드된다.
const LogoStack = styled.View`
  width: 163px;
  height: 229.487px;
`;

const LogoLayer = styled(Animated.View)`
  position: absolute;
  inset: 0;
  align-items: center;
  gap: 24px;
`;

// 로고 심볼 원본 비율(117.27 x 152.443)을 유지한 채 163px 정사각형 박스 중앙에 놓는다.
// 163x163으로 늘려서 그리면 로고가 눌린 것처럼 보인다.
const SymbolBox = styled.View`
  width: 163px;
  height: 163px;
  align-items: center;
  justify-content: center;
`;

const Subtitle = styled.Text`
  margin-top: 28px;
  font-family: ${({ theme }) => theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
  text-align: center;
`;

const RouteMockupWrapper = styled.View`
  width: 100%;
  aspect-ratio: ${ROUTE_MOCKUP_ASPECT_RATIO};
  position: relative;
`;

const RouteMockupImage = styled.Image`
  width: 100%;
  height: 100%;
`;

const ChipRow = styled.View`
  position: absolute;
  flex-direction: row;
  gap: 8px;
`;

// 장면(scene) 전체는 폰보다 넓다 — 그 안에서 폰 사진은 고정 크기(260px)로 작게
// 앉혀두고, 검색창/시설 카드는 이 장면 기준 퍼센트로 배치해서 폰 양옆으로 자연스럽게
// 삐져나오게 한다(Figma 원본 구조와 동일).
const SearchMockupScene = styled.View`
  width: ${SEARCH_MOCKUP_SCENE_WIDTH};
  height: ${SEARCH_MOCKUP_SCENE_HEIGHT_PX}px;
  position: relative;
`;

const SearchMockupPhoneBox = styled.View`
  position: absolute;
  top: 0px;
  left: ${SEARCH_MOCKUP_PHONE_LEFT_PX}px;
  width: ${SEARCH_MOCKUP_PHONE_TARGET_WIDTH}px;
  aspect-ratio: ${SEARCH_MOCKUP_ASPECT_RATIO};
`;

const SearchMockupImage = styled.Image`
  width: 100%;
  height: 100%;
`;

const SearchBarBox = styled.View`
  position: absolute;
`;

// 홍대 목업 페이지 배경은 Figma 프레임 전체를 통으로 내보낸 PNG 한 장(OnboardingHongdaeFlatImage)
// 이라, width/height만 화면 폭 비율로 잡아주면 배경/비네트/폰 스크린샷이 전부 이미 맞는
// 자리에 있다. 그 위 마커만 이 Scene 기준 절대 위치로 얹는다.
const HongdaeFlatScene = styled.View`
  position: relative;
  overflow: hidden;
`;

const HongdaeFlatImage = styled.Image`
  position: absolute;
  left: 0px;
`;

const MarkerShineBox = styled.View`
  position: absolute;
`;

const FacilityCardBox = styled(Animated.View)`
  position: absolute;
`;

// 링의 회전 기준점(앵커) — 폰 상단 가운데에 크기 0으로 딱 붙여두고, 아이콘들은 전부
// transform(translateX/Y)만으로 이 점을 중심으로 원을 그리며 움직인다.
const FacilityIconRing = styled.View`
  position: absolute;
  left: 50%;
  top: 0px;
  width: 0px;
  height: 0px;
`;

const RingIconCircle = styled(Animated.View)`
  position: absolute;
  width: ${FACILITY_RING_ICON_BOX_SIZE}px;
  height: ${FACILITY_RING_ICON_BOX_SIZE}px;
  border-radius: 100px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.semantic.background.color};
`;

// SearchMockupScene(position:relative) 안에서 절대 위치로 얹는다 — 이전에는 Scene의
// 형제 블록으로 흐름에 끼어 있어서, 그 실제 렌더 높이만큼 뒤따르는 Caption이 밀려나
// 검색 목업 페이지의 Caption과 세로 위치가 달라지는 문제가 있었다. 가로 중앙 정렬은
// transform: translateX 대신 left: 17%(=(100-66)/2)로 한다 — facilityInfoCardFadeStyle이
// 이미 자기 transform(translateY)을 갖고 있어서, 여기서 transform을 또 주면 RN
// 스타일 병합 시 나중 온 배열 값이 앞의 transform을 통째로 덮어써 버린다.
const FacilityInfoCardBox = styled(Animated.View)`
  position: absolute;
  left: 17%;
  width: 66%;
`;

const Caption = styled.Text`
  margin-top: 24px;
  z-index: 1;
  font-family: ${({ theme }) => theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
  text-align: center;
`;

const PageDots = styled.View`
  flex-direction: row;
  justify-content: center;
  width: 100%;
  gap: 8px;
  margin-bottom: 32px;
`;

const Dot = styled.View<{ active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ theme, active }) => (active ? theme.semantic.main : theme.semantic.line.primary)};
`;

const CtaBar = styled.View`
  width: 100%;
  padding: 0 20px;
`;
