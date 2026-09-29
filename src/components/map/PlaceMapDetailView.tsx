import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NaverMapView } from '@mj-studio/react-native-naver-map';
import styled from 'styled-components/native';
import ChevronLeftIcon from '@assets/svgs/icons/chevronLeft.svg';
import { SearchBar } from '@components/common/SearchBar';
import { CategoryChipList } from '@components/common/CategoryChipList';
import { CategoryKey } from '@constant/categoryChips';
import { MAP_MIN_ZOOM, MAP_MAX_ZOOM } from '@constant/mapCamera';

interface Props {
  /** 지도 첫 카메라 중심 = 장소 좌표 */
  latitude: number;
  longitude: number;
  onBack: () => void;
  /** 장소 좌표에 찍을 마커(NaverMapView의 children으로 들어간다). */
  marker: React.ReactNode;
  /** 화면 하단에 붙는 시설 정보 카드(FacilityInfoCard). */
  card: React.ReactNode;
}

/**
 * 목록에서 장소 하나를 눌렀을 때 뜨는 "지도 + 시설 카드" 상세 화면의 공통 뼈대.
 * Figma "주변상권_시설 클릭 시"(773:4093) — 상단엔 뒤로가기 + 장식용 검색창 + 카테고리 칩(메인
 * 지도와 같은 UI), 가운데엔 장소 좌표에 마커를 찍은 네이버 지도, 하단엔 시설 카드가 붙는다.
 * 주변상권(HongdaeScreen)과 편의시설 목록(FacilityCategoryListScreen)이 같이 쓴다.
 */
export function PlaceMapDetailView({ latitude, longitude, onBack, marker, card }: Props) {
  const insets = useSafeAreaInsets();
  // 상단 카테고리 칩. 메인 지도 화면(MapScreen)과 동일한 칩 UI만 우선 갖춘다(마커 필터링 연결 없음).
  const [selectedKey, setSelectedKey] = useState<CategoryKey | null>(null);

  return (
    <Container>
      <TopBar topInset={insets.top} pointerEvents="box-none">
        <SearchRow>
          <BackButton onPress={onBack} hitSlop={8}>
            <ChevronLeftIcon width={24} height={24} />
          </BackButton>
          {/* map 탭 상단 검색창과 동일하게, 여기서는 입력 불가(onPress만 있는) 장식용 검색창이다. */}
          <SearchBarWrap>
            <SearchBar value="" onChangeText={() => {}} onPress={() => {}} />
          </SearchBarWrap>
        </SearchRow>
        <CategoryChipList selectedKey={selectedKey} onSelect={setSelectedKey} />
      </TopBar>
      <MapArea>
        <NaverMapView
          style={StyleSheet.absoluteFill}
          initialCamera={{ latitude, longitude, zoom: 17 }}
          minZoom={MAP_MIN_ZOOM}
          maxZoom={MAP_MAX_ZOOM}
        >
          {marker}
        </NaverMapView>
      </MapArea>
      {card}
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;

const TopBar = styled.View<{ topInset: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  gap: 12px;
  padding-top: ${({ topInset }) => topInset + 12}px;
  padding-bottom: 8px;
`;

const SearchRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding-horizontal: 20px;
`;

const BackButton = styled(Pressable)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

const SearchBarWrap = styled.View`
  flex: 1;
`;

const MapArea = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;
