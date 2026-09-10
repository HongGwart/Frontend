import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from 'styled-components/native';
import Header from '@components/layout/Header';
import { FavoritePlaceCard } from '@components/mypage/FavoritePlaceCard';
import { FACILITY_CATEGORIES } from '@constant/facilityCategories';
import { DUMMY_FACILITY_CATEGORY_PLACES } from '@constant/dummyFacilityCategoryPlaces';
import { RootStackParamList } from '@navigation/types';

// 편의시설 탭에서 카테고리 카드를 탭하면 뜨는 해당 카테고리 장소 목록.
// Figma "편의시설_카페"(719:1582) 등 카테고리별 화면들이 전부 같은 레이아웃(공통
// Header + facility category_list 카드 반복)이라 카테고리 하나로 통일해서 구현했다.
// 탭 바 없이 전체화면으로 뜬다(FavoriteListScreen과 같은 패턴).
export default function FacilityCategoryListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'FacilityCategoryList'>>();

  const category = FACILITY_CATEGORIES.find(item => item.id === params.categoryId);
  const places = DUMMY_FACILITY_CATEGORY_PLACES[params.categoryId];

  // 실제 즐겨찾기 연동 전까지, 이 화면 안에서만 유지되는 로컬 토글 상태.
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const toggleFavorite = (id: string) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Container edges={['top']}>
      <Header title={category?.label ?? ''} onBackPress={() => navigation.goBack()} />
      {places.length > 0 ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 8 }}
          showsVerticalScrollIndicator={false}
        >
          {places.map((place, index) => (
            <FavoritePlaceCard
              key={place.id}
              name={place.name}
              buildingCode={place.buildingCode}
              buildingName={place.buildingName}
              locationDetail={place.locationDetail}
              photo={place.photo}
              icon={place.icon}
              iconWidth={place.iconWidth}
              iconHeight={place.iconHeight}
              isOpen={place.isOpen}
              statusText={place.statusText}
              hours={place.hours}
              isFavorite={favoriteIds.has(place.id)}
              onToggleFavorite={() => toggleFavorite(place.id)}
              showDivider={index !== places.length - 1}
            />
          ))}
        </ScrollView>
      ) : (
        <EmptyState>
          <EmptyText>등록된 {category?.label ?? '편의시설'} 정보가 없어요</EmptyText>
        </EmptyState>
      )}
    </Container>
  );
}

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

const EmptyState = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const EmptyText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;
