import React, { useCallback, useMemo, useRef } from 'react';
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
import { favoriteFromCategoryMarker } from '@constant/favoriteInputs';
import { useFavorites } from '@hooks/useFavorites';

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

  // buildingCode가 바뀔 때만 다시 계산한다 — 즐겨찾기 토글처럼 buildingCode와
  // 무관한 상태 변화로 리렌더될 때마다 정적 더미 배열을 다시 find/filter/그룹핑하지
  // 않도록 memo화했다.
  const dongMarker = useMemo(
    () => DUMMY_MAP_MARKERS.find(marker => marker.label === buildingCode),
    [buildingCode],
  );
  const facilities = useMemo(
    () => DUMMY_CATEGORY_MARKERS.filter(marker => marker.buildingCode === buildingCode),
    [buildingCode],
  );

  // 즐겨찾기는 기기 로컬에 저장된 앱 전역 상태(지도/마이페이지와 같은 상태).
  const { isFavorite, toggleFavorite: toggleFavoritePlace } = useFavorites();
  // id만 받는 안정적인 참조로 둬서(마커별로 map 콜백 안에서 새 화살표 함수를 만들어 넘기지 않아도 되게)
  // BuildingFacilityCard의 React.memo가 실제로 효과를 본다. 최신 토글 함수는 ref로 읽는다.
  const toggleRef = useRef(toggleFavoritePlace);
  toggleRef.current = toggleFavoritePlace;
  const toggleFavorite = useCallback((id: string) => {
    const marker = DUMMY_CATEGORY_MARKERS.find(item => item.id === id);
    if (marker) toggleRef.current(favoriteFromCategoryMarker(marker));
  }, []);

  const rows = useMemo(() => {
    const grouped: (typeof facilities)[] = [];
    for (let i = 0; i < facilities.length; i += GRID_COLUMNS) {
      grouped.push(facilities.slice(i, i + GRID_COLUMNS));
    }
    return grouped;
  }, [facilities]);

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
          {/* 사진은 한 장 249×160으로 나열하고, 화면 폭을 넘는 만큼은 오른쪽으로 가로 스크롤된다. */}
          {dongMarker.images && (
            <FacilityImagePair images={dongMarker.images} itemWidth={249} height={160} bleed={20} />
          )}
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
                <InfoNoteText>연중무휴</InfoNoteText>
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
                    const favorite = isFavorite(favoriteFromCategoryMarker(marker));
                    return (
                      <BuildingFacilityCard
                        key={marker.id}
                        id={marker.id}
                        photo={marker.images?.[0]}
                        icon={CATEGORY_MARKER_ICONS[marker.category].icon}
                        title={marker.room}
                        isOpen={DUMMY_OPERATING_HOURS.isOpen}
                        statusText={DUMMY_OPERATING_HOURS.statusText}
                        isFavorite={favorite}
                        onToggleFavorite={toggleFavorite}
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
        {/* 실내 지도 화면이 아직 없어서, 지금은 눌러도 아무 일도 없는 대신 비활성화해둔다. */}
        <Button label="건물 내부 보기" icon={BuildingViewIcon} iconWidth={17} iconHeight={18} disabled />
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

// 헤더와 첫 콘텐츠(사진) 사이 간격 8px.
const Section = styled.View`
  width: 100%;
  padding: 8px 20px 0;
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

// 운영 시간 아래 보조 문구("연중무휴") — 왼쪽 라벨(주 출입구·운영 시간)과 같은 옅은 색.
const InfoNoteText = styled(InfoValueText)`
  color: ${({ theme }) => theme.semantic.text.tertiary};
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
