import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from 'styled-components/native';
import Header from '@components/layout/Header';
import { FavoritePlaceCard } from '@components/mypage/FavoritePlaceCard';
import { DUMMY_FAVORITE_PLACES, favoritePlaceToFocusParam } from '@constant/dummyMypage';
import { RootStackParamList } from '@navigation/types';

// 마이페이지 "즐겨찾기" 섹션의 "더보기"를 누르면 오는 전체 목록 화면(Figma "마이페이지_즐겨찾기 목록").
// 탭 바 없이 전체화면으로 뜨고, 상단은 공통 Header(뒤로가기 + "즐겨찾기"), 본문은 마이페이지와
// 같은 FavoritePlaceCard 리스트다. 새로 만든 컴포넌트는 없다.
export default function FavoriteListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState(DUMMY_FAVORITE_PLACES);
  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(item => item.id !== id));
  };

  const openFacilityOnMap = (place: (typeof favorites)[number]) => {
    navigation.navigate('MainTabs', {
      screen: 'map',
      params: { focusFacility: favoritePlaceToFocusParam(place) },
    });
  };

  return (
    <Container edges={['top']}>
      <Header title="즐겨찾기" onBackPress={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 8 }}
        showsVerticalScrollIndicator={false}
      >
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
            onPress={() => openFacilityOnMap(item)}
            showDivider={index !== favorites.length - 1}
          />
        ))}
      </ScrollView>
    </Container>
  );
}

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;
