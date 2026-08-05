import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import A_1_test_data from '@assets/svgs/floors/A_1_test.json';
import A_1_test_Background from '@assets/svgs/floors/A_1_test_bg.svg';
import A_1_test_Doors from '@assets/svgs/floors/A_1_test_doors.svg';
import A_2_data from '@assets/svgs/floors/A_2.json';
import A_2_Background from '@assets/svgs/floors/A_2_bg.svg';
import A_2_Doors from '@assets/svgs/floors/A_2_doors.svg';
import B_1_data from '@assets/svgs/floors/B_1.json';
import B_1_Background from '@assets/svgs/floors/B_1_bg.svg';
import B_1_Doors from '@assets/svgs/floors/B_1_doors.svg';

import { IndoorMapView } from '@components/map/IndoorMapView';
import { SearchBar } from '@components/common/SearchBar';
import { FloorMapData } from '@appTypes/room';

/**
 * 층 스위처 UI가 정식으로 나오기 전까지, 새로 뽑은 층 데이터를 눈으로 확인해보기 위한
 * 임시 토글. 층이 늘어날 때마다 여기 한 줄씩 추가하면 됨.
 */
const FLOORS: Record<string, { data: FloorMapData; Background: React.ComponentType<any>; Doors: React.ComponentType<any> }> = {
  A_1_test: {
    data: A_1_test_data as FloorMapData,
    Background: A_1_test_Background,
    Doors: A_1_test_Doors,
  },
  A_2: {
    data: A_2_data as FloorMapData,
    Background: A_2_Background,
    Doors: A_2_Doors,
  },
  B_1: {
    data: B_1_data as FloorMapData,
    Background: B_1_Background,
    Doors: B_1_Doors,
  },
};

export default function IndoorMapTestScreen() {
  const [query, setQuery] = useState('');
  const [floorId, setFloorId] = useState<keyof typeof FLOORS>('B_1');

  const floor = FLOORS[floorId];
  const mapData = useMemo(() => floor.data, [floor]);
  const Background = floor.Background;
  const Doors = floor.Doors;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.searchBarWrapper}>
        {/* <SearchBar value={query} onChangeText={setQuery} /> */}
        <View style={styles.floorSwitcher}>
          {Object.keys(FLOORS).map((id) => (
            <Pressable
              key={id}
              onPress={() => setFloorId(id)}
              style={[styles.floorButton, id === floorId && styles.floorButtonActive]}
            >
              <Text style={[styles.floorButtonText, id === floorId && styles.floorButtonTextActive]}>
                {id}
              </Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
      <IndoorMapView
        key={floorId}
        mapData={mapData}
        renderBackground={({ width, height }) => <Background width={width} height={height} />}
        renderForeground={({ width, height }) => <Doors width={width} height={height} />}
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
  floorSwitcher: { flexDirection: 'row', gap: 8 },
  floorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EEE',
  },
  floorButtonActive: { backgroundColor: '#1D2056' },
  floorButtonText: { color: '#333', fontWeight: '600' },
  floorButtonTextActive: { color: '#fff' },
});
