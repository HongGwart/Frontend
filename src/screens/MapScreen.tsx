import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NaverMapView } from '@mj-studio/react-native-naver-map';
import { SearchBar } from '@components/common/SearchBar';
import { CategoryChipList } from '@components/common/CategoryChipList';
import { CategoryKey } from '@constant/categoryChips';

interface Props {
  onSearchPress?: () => void;
}

export default function MapScreen({ onSearchPress }: Props) {
  // 메인홈 카테고리 칩은 한 번에 하나만 선택된다. 실제 지도 필터링과의 연결은
  // 추후 지도 데이터가 준비되면 여기 selectedKey를 그대로 넘기면 된다.
  const [selectedKey, setSelectedKey] = useState<CategoryKey | null>(null);

  return (
    <View style={styles.container}>
      <NaverMapView
        style={StyleSheet.absoluteFill}
        initialCamera={{
          latitude: 37.5504,
          longitude: 126.9251,
          zoom: 16,
        }}
      />
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
