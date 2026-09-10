import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import { FacilityCategoryGrid } from '@components/common/FacilityCategoryGrid';
import { FACILITY_CATEGORIES } from '@constant/facilityCategories';

// Figma "편의시설"(716:2973). 상단 헤더는 MainTabNavigator가 타이틀("편의시설")을
// 이미 보여주고 있어서, 여기서는 안내 문구 + 카테고리 그리드 본문만 그린다.
export default function FacilityScreen() {
  return (
    <Container>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Description>교내 편의시설을 카테고리별로 찾아보세요</Description>
        <FacilityCategoryGrid categories={FACILITY_CATEGORIES} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
});

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;

const Description = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;
