import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import rawMapData from '@assets/svgs/floors/A_1_test.json';
import VisualBackground from '@assets/svgs/floors/A_1_test_bg.svg';
import VisualDoors from '@assets/svgs/floors/A_1_test_doors.svg';
import VisualIcons from '@assets/svgs/floors/A_1_test_icons.svg';
import { IndoorMapView } from '@components/map/IndoorMapView';
import { SearchBar } from '@components/common/SearchBar';
import { FloorMapData } from '@appTypes/room';

const mapData: FloorMapData = rawMapData as FloorMapData;

export default function IndoorMapTestScreen() {
  const [query, setQuery] = useState('');

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.searchBarWrapper}>
        {/* <SearchBar value={query} onChangeText={setQuery} /> */}
      </SafeAreaView>
      <IndoorMapView
        mapData={mapData}
        renderBackground={({ width, height }) => (
          <VisualBackground width={width} height={height} />
        )}
        renderForeground={({ width, height }) => (
          <>
            <VisualDoors width={width} height={height} />
            <VisualIcons width={width} height={height} />
          </>
        )}
        onRoomSelect={(room) => {
          console.log('selected room:', room?.id, room?.placeId);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBarWrapper: { paddingHorizontal: 16, paddingVertical: 8 },
});