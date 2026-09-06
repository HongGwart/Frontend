import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styled from 'styled-components/native';
import { SectionHeader } from '@components/mypage/SectionHeader';
import { DefaultDepartureCard } from '@components/mypage/DefaultDepartureCard';
import { FavoritePlaceCard } from '@components/mypage/FavoritePlaceCard';
import { DUMMY_DEFAULT_DEPARTURE, DUMMY_FAVORITE_PLACES } from '@constant/dummyMypage';

// 상단 헤더("마이페이지" + 뒤로가기)와 하단 탭 바(NavigationBar)는 MainTabNavigator가
// 이미 그려주고 있어서, 여기서는 스크롤되는 본문만 담당한다.
export default function MypageScreen() {
  const navigation = useNavigation();
  // 즐겨찾기 토글을 누르면 목록에서 빼는 정도로만 우선 동작시킨다(실제 연동 전 더미).
  const [favorites, setFavorites] = useState(DUMMY_FAVORITE_PLACES);
  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(item => item.id !== id));
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
          {favorites.map((item, index) => (
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
              onPress={() => {}}
              showDivider={index !== favorites.length - 1}
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
