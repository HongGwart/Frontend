import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NaverMapView } from '@mj-studio/react-native-naver-map';
import { SearchBar } from '@components/common/SearchBar';
import { CategoryChipList } from '@components/common/CategoryChipList';
import { NaverMapMarker } from '@components/map/NaverMapMarker';
import { NaverMapCategoryMarker } from '@components/map/NaverMapCategoryMarker';
import { CategoryKey } from '@constant/categoryChips';
import { CATEGORY_MARKER_ICONS } from '@constant/categoryMarkerIcons';
import { DUMMY_MAP_MARKERS, DUMMY_CATEGORY_MARKERS } from '@constant/dummyMapMarkers';

interface Props {
  onSearchPress?: () => void;
}

export default function MapScreen({ onSearchPress }: Props) {
  // 메인홈 카테고리 칩은 한 번에 하나만 선택된다. 실제 지도 필터링과의 연결은
  // 추후 지도 데이터가 준비되면 여기 selectedKey를 그대로 넘기면 된다.
  const [selectedKey, setSelectedKey] = useState<CategoryKey | null>(null);

  // 동(건물) 마커는 칩이 하나도 안 켜져 있을 때만 보여준다. 특정 카테고리를 고르면 그
  // 카테고리 마커만 남기고, 동 마커는 화면에서 사라진다.
  const dongMarkers = selectedKey === null ? DUMMY_MAP_MARKERS : [];

  // "즐겨찾기" 칩은 시설 카테고리가 아니라 상태라서, 동 마커/카테고리 마커 중
  // isFavorite인 것들만 모아서 보여준다.
  const categoryMarkers =
    selectedKey === null
      ? []
      : selectedKey === 'favorite'
        ? DUMMY_CATEGORY_MARKERS.filter(marker => marker.favorite)
        : DUMMY_CATEGORY_MARKERS.filter(marker => marker.category === selectedKey);

  const favoriteDongMarkers =
    selectedKey === 'favorite' ? DUMMY_MAP_MARKERS.filter(marker => marker.favorite) : [];

  return (
    <View style={styles.container}>
      <NaverMapView
        style={StyleSheet.absoluteFill}
        initialCamera={{
          latitude: 37.5504,
          longitude: 126.9251,
          zoom: 16,
        }}
      >
        {[...dongMarkers, ...favoriteDongMarkers].map(marker => (
          <NaverMapMarker
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            label={marker.label}
            favorite={marker.favorite}
            count={marker.count}
          />
        ))}
        {categoryMarkers.map(marker => (
          <NaverMapCategoryMarker
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            favorite={marker.favorite}
            count={marker.count}
            {...CATEGORY_MARKER_ICONS[marker.category]}
          />
        ))}
      </NaverMapView>
      <SafeAreaView edges={['top']} style={styles.searchBarWrapper} pointerEvents="box-none">
        <View style={styles.searchBarPadding}>
          <SearchBar value="" onChangeText={() => {}} onPress={onSearchPress} />
        </View>
        <CategoryChipList selectedKey={selectedKey} onSelect={setSelectedKey} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBarWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 13,
    gap: 12,
  },
  searchBarPadding: {
    paddingHorizontal: 20,
  },
});
