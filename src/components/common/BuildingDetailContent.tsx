import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';
import BuildingViewIcon from '@assets/svgs/icons/buildingView.svg';
import Header from '@components/layout/Header';
import { Button } from './Button';
import { FacilityImagePair } from './FacilityImagePair';
import { OperatingHoursRow } from './FacilityInfoCard';
import { BuildingFacilityCard } from './BuildingFacilityCard';
import { CATEGORY_MARKER_ICONS } from '@constant/categoryMarkerIcons';
import { DUMMY_MAP_MARKERS, DUMMY_CATEGORY_MARKERS } from '@constant/dummyMapMarkers';
import { DUMMY_MAIN_ENTRANCE, DUMMY_OPERATING_HOURS } from '@constant/dummyFacilityInfo';

interface Props {
  buildingCode: string;
  onBack?: () => void;
}

const GRID_COLUMNS = 2;

// BuildingDetailHeader 높이(56px + 세이프에어리어 top) — 길찾기/주변상권 등 다른 탭
// 화면들이 쓰는 공통 Header와 정확히 같은 값이다(MainTabNavigator가 Header를 이 값으로
// 감싸는 것과 동일). MapScreen이 시설 카드를 위로 슬라이드하는 동안 이 헤더 미리보기와
// 본문 미리보기를 따로 움직이려면 이 높이를 알아야 해서 export한다.
const HEADER_CONTENT_HEIGHT = 56;
export const BUILDING_DETAIL_HEADER_HEIGHT = HEADER_CONTENT_HEIGHT;

/**
 * 건물 상세보기 헤더(뒤로가기 + "H동 중앙도서관"). 다른 탭 화면들과 똑같이 공통 Header
 * 컴포넌트를 그대로 쓴다 — 그래야 높이/타이포가 정확히 같아진다. 본문(BuildingDetailBody)과
 * 분리해둔 이유: 지도 시설 카드를 위로 슬라이드하는 동안 MapScreen이 헤더는 검색창 자리
 * 위로 먼저 트랜지션해 보여주고, 본문은 카드 밑단을 그대로 뒤따라오게 하는 식으로 서로
 * 다른 애니메이션을 태워야 해서다.
 */
export function BuildingDetailHeader({ buildingCode, onBack }: { buildingCode: string; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const dongMarker = DUMMY_MAP_MARKERS.find(marker => marker.label === buildingCode);

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: theme.semantic.background.primary }}>
      <Header title={dongMarker?.label ?? ''} subtitle={dongMarker?.buildingName} onBackPress={onBack} />
    </View>
  );
}

/** 건물 상세보기 본문(스크롤 영역 + 하단 CTA). BuildingDetailHeader를 뺀 나머지 전부. */
export function BuildingDetailBody({ buildingCode }: { buildingCode: string }) {
  const insets = useSafeAreaInsets();

  const dongMarker = DUMMY_MAP_MARKERS.find(marker => marker.label === buildingCode);
  const facilities = DUMMY_CATEGORY_MARKERS.filter(marker => marker.buildingCode === buildingCode);

  // 마커 즐겨찾기와 마찬가지로, 실제 연동 전까지 이 컴포넌트 로컬에서만 토글 상태를 들고
  // 있는다(MapScreen의 favoriteOverrides와 같은 패턴).
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const toggleFavorite = (id: string, current: boolean) => {
    setFavoriteOverrides(prev => ({ ...prev, [id]: !current }));
  };

  const rows: (typeof facilities)[] = [];
  for (let i = 0; i < facilities.length; i += GRID_COLUMNS) {
    rows.push(facilities.slice(i, i + GRID_COLUMNS));
  }

  if (!dongMarker) {
    return (
      <EmptyState>
        <EmptyText>건물 정보를 찾을 수 없어요</EmptyText>
      </EmptyState>
    );
  }

  return (
    <Container>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <Section>
          {dongMarker.images && <FacilityImagePair images={dongMarker.images} height={160} />}
          <DescriptionText>{dongMarker.description}</DescriptionText>
          <InfoList>
            <InfoRow>
              <InfoLabelText>주 출입구</InfoLabelText>
              <InfoValueText>{DUMMY_MAIN_ENTRANCE}</InfoValueText>
            </InfoRow>
            <InfoRow>
              <InfoLabelText>운영 시간</InfoLabelText>
              <InfoValueColumn>
                <OperatingHoursRow operatingHours={DUMMY_OPERATING_HOURS} />
                <InfoValueText>연중무휴</InfoValueText>
              </InfoValueColumn>
            </InfoRow>
          </InfoList>
        </Section>

        {facilities.length > 0 && (
          <FacilitySection>
            <FacilitySectionTitle>편의시설</FacilitySectionTitle>
            <FacilityGrid>
              {rows.map((row, rowIndex) => (
                <FacilityRow key={rowIndex}>
                  {row.map(marker => {
                    const isFavorite = favoriteOverrides[marker.id] ?? marker.favorite ?? false;
                    return (
                      <BuildingFacilityCard
                        key={marker.id}
                        photo={marker.images?.[0]}
                        icon={CATEGORY_MARKER_ICONS[marker.category].icon}
                        title={marker.room}
                        isOpen={DUMMY_OPERATING_HOURS.isOpen}
                        statusText={DUMMY_OPERATING_HOURS.statusText}
                        isFavorite={isFavorite}
                        onToggleFavorite={() => toggleFavorite(marker.id, isFavorite)}
                      />
                    );
                  })}
                  {/* 홀수 개로 끝나는 마지막 행은 빈 칸을 채워서 카드 폭이 그리드 절반으로 유지되게 한다. */}
                  {row.length < GRID_COLUMNS && <FacilityRowFiller />}
                </FacilityRow>
              ))}
            </FacilityGrid>
          </FacilitySection>
        )}
      </ScrollView>

      <CtaBar style={{ paddingBottom: insets.bottom + 8 }}>
        <Button label="건물 내부 보기" icon={BuildingViewIcon} iconWidth={17} iconHeight={18} onPress={() => {}} />
      </CtaBar>
    </Container>
  );
}

/**
 * 헤더 + 본문을 그대로 이어붙인 완성형. BuildingDetailScreen처럼 둘을 따로 애니메이션
 *시킬 필요 없이 평범한 화면으로 쓰는 곳에서만 이걸 쓴다.
 */
export function BuildingDetailContent({ buildingCode, onBack }: Props) {
  return (
    <Container>
      <BuildingDetailHeader buildingCode={buildingCode} onBack={onBack} />
      <BuildingDetailBody buildingCode={buildingCode} />
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

const Section = styled.View`
  width: 100%;
  padding: 12px 20px 0;
  gap: 12px;
`;

const DescriptionText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const InfoList = styled.View`
  width: 100%;
  gap: 8px;
`;

const InfoRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
`;

const InfoLabelText = styled.Text`
  width: 51px;
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const InfoValueText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const InfoValueColumn = styled.View`
  flex: 1;
  gap: 2px;
  justify-content: center;
`;

const FacilitySection = styled.View`
  width: 100%;
  margin-top: 16px;
`;

const FacilitySectionTitle = styled.Text`
  padding: 8px 20px;
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const FacilityGrid = styled.View`
  width: 100%;
  padding: 0 20px;
  gap: 16px;
`;

const FacilityRow = styled.View`
  flex-direction: row;
  width: 100%;
  gap: 16px;
`;

const FacilityRowFiller = styled.View`
  flex: 1;
`;

const CtaBar = styled.View`
  width: 100%;
  padding: 8px 20px 0;
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
