import React, { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from 'styled-components/native';
import { SectionHeader } from '@components/mypage/SectionHeader';
import { DefaultDepartureCard } from '@components/mypage/DefaultDepartureCard';
import { FavoritePlaceCard } from '@components/mypage/FavoritePlaceCard';
import { MenuRow } from '@components/mypage/MenuRow';
import { APP_VERSION, PRIVACY_POLICY_URL } from '@constant/appInfo';
import { useFavorites } from '@hooks/useFavorites';
import { DUMMY_DEFAULT_DEPARTURE, FavoritePlace, favoritePlaceToFocusParam } from '@constant/dummyMypage';
import { toFavoritePlace } from '@constant/favoriteCards';
import { RootStackParamList } from '@navigation/types';
import { resetOnboarding } from '@storage/onboarding';

// 마이페이지 즐겨찾기 섹션에서 보여줄 최대 개수
const MAX_FAVORITES_ON_MYPAGE = 3;

// 상단 헤더("마이페이지" + 뒤로가기)와 하단 탭 바(NavigationBar)는 MainTabNavigator가
// 이미 그려주고 있어서, 여기서는 스크롤되는 본문만 담당한다.
export default function MypageScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // 즐겨찾기는 기기 로컬에 저장된 앱 전역 상태(FavoritesProvider). 여기서 별을 끄면 목록에서 빠진다.
  const { favorites, removeFavorite } = useFavorites();

  // 마이페이지에서는 즐겨찾기를 최대 5개까지만 보여준다(전체는 "더보기" → FavoriteListScreen).
  const visibleFavorites = useMemo(
    () => favorites.slice(0, MAX_FAVORITES_ON_MYPAGE).map(toFavoritePlace),
    [favorites],
  );

  const openFacilityOnMap = (place: FavoritePlace) => {
    navigation.navigate('MainTabs', {
      screen: 'map',
      params: { focusFacility: favoritePlaceToFocusParam(place) },
    });
  };

  return (
    <Container>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <DepartureSection>
          <SectionHeader
            title="기본 출발지"
            action="길찾기 시 기본으로 사용해요"
            actionVariant="hint"
          />
          <DefaultDepartureCard
            buildingCode={DUMMY_DEFAULT_DEPARTURE.buildingCode}
            buildingName={DUMMY_DEFAULT_DEPARTURE.buildingName}
            roomNumber={DUMMY_DEFAULT_DEPARTURE.roomNumber}
            description={DUMMY_DEFAULT_DEPARTURE.description}
            onEditPress={() => navigation.navigate('DepartureSetting')}
          />
        </DepartureSection>

        <FavoritesSection>
          <SectionHeader
            title="즐겨찾기"
            action="더보기"
            onActionPress={() => navigation.navigate('FavoriteList')}
            filled
          />
          {visibleFavorites.length === 0 && (
            <EmptyFavoritesText>지도에서 별을 눌러 자주 가는 장소를 즐겨찾기해 보세요</EmptyFavoritesText>
          )}
          {visibleFavorites.map((item, index) => (
            <FavoritePlaceCard
              key={item.id}
              name={item.name}
              buildingCode={item.buildingCode}
              buildingName={item.buildingName}
              locationDetail={item.locationDetail}
              photo={item.photo}
              icon={item.icon}
              iconWidth={item.iconWidth}
              iconHeight={item.iconHeight}
              isOpen={item.isOpen}
              statusText={item.statusText}
              hours={item.hours}
              isFavorite
              onToggleFavorite={() => removeFavorite(item.id)}
              onPress={() => openFacilityOnMap(item)}
              showDivider={index !== visibleFavorites.length - 1}
            />
          ))}
        </FavoritesSection>

        {/* 즐겨찾기 섹션과 같은 문법(SectionHeader filled + 흰 배경 행 + 구분선). 이용약관/문의하기 등도 여기에 행으로 추가한다. */}
        <ServiceInfoSection>
          <SectionHeader title="서비스 정보" filled />
          <MenuRow
            title="개인정보처리방침"
            onPress={() =>
              Linking.openURL(PRIVACY_POLICY_URL).catch(error =>
                console.warn('[mypage] 개인정보처리방침을 열지 못했어요', error),
              )
            }
          />
          <MenuRow title="앱 버전" value={APP_VERSION} showDivider={false} />
        </ServiceInfoSection>


        {/* {__DEV__ && (
          // [개발용] 온보딩 완료 기록을 지우고 온보딩부터 다시 본다(최초 실행 흐름 확인용).
          <Pressable
            onPress={async () => {
              await resetOnboarding();
              // 이 화면은 탭 안에 있어서 reset은 부모(루트 스택)에 해야 온보딩으로 돌아간다.
              navigation
                .getParent<NativeStackNavigationProp<RootStackParamList>>()
                ?.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
            }}
          >
            <DevActionText>[DEV] 온보딩 다시 보기</DevActionText>
          </Pressable>
        )} */}


      </ScrollView>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;

const styles = StyleSheet.create({
  content: {
    paddingTop: 23,
    paddingBottom: 24,
    gap: 24,
  },
});

const DepartureSection = styled.View`
  padding-horizontal: 20px;
  gap: 8px;
`;

const FavoritesSection = styled.View`
  width: 100%;
`;

const ServiceInfoSection = styled.View`
  width: 100%;
`;

const EmptyFavoritesText = styled.Text`
  padding: 24px 20px;
  text-align: center;
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const DevActionText = styled.Text`
  text-align: center;
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
