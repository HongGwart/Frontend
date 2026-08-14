import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NaverMapView } from '@mj-studio/react-native-naver-map';
import { SearchBar } from '@components/common/SearchBar';

interface Props {
  onSearchPress?: () => void;
}

export default function MapScreen({ onSearchPress }: Props) {
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
        <SearchBar value="" onChangeText={() => {}} onPress={onSearchPress} />
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
    paddingHorizontal: 20,
    paddingTop: 13,
  },
});
