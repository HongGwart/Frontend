import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from 'styled-components/native';
import { SectionHeader } from '@components/mypage/SectionHeader';
import { DefaultDepartureCard } from '@components/mypage/DefaultDepartureCard';
import { FavoritePlaceCard } from '@components/mypage/FavoritePlaceCard';
import { useFavorites } from '@hooks/useFavorites';
import { DUMMY_DEFAULT_DEPARTURE, FavoritePlace, favoritePlaceToFocusParam } from '@constant/dummyMypage';
import { RootStackParamList } from '@navigation/types';

// 마이페이지 즐겨찾기 섹션에서 보여줄 최대 개수
const MAX_FAVORITES_ON_MYPAGE = 5;

// 상단 헤더("마이페이지" + 뒤로가기)와 하단 탭 바(NavigationBar)는 MainTabNavigator가
// 이미 그려주고 있어서, 여기서는 스크롤되는 본문만 담당한다.
export default function MypageScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // 즐겨찾기 상태는 FavoriteListScreen과 공유(FavoritesProvider). 토글은 목록에서 제거하는 더미 동작.
  const { favorites, removeFavorite } = useFavorites();

  // 마이페이지에서는 즐겨찾기를 최대 5개까지만 보여준다(전체는 "더보기" → FavoriteListScreen).
  const visibleFavorites = favorites.slice(0, MAX_FAVORITES_ON_MYPAGE);

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
