import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import A_1_test_data from '@assets/svgs/floors/A_1_test.json';
import A_1_test_Background from '@assets/svgs/floors/A_1_test_bg.svg';
import A_1_test_Doors from '@assets/svgs/floors/A_1_test_doors.svg';
import A_2_data from '@assets/svgs/floors/A_2.json';
import A_2_Background from '@assets/svgs/floors/A_2_bg.svg';
import A_2_Doors from '@assets/svgs/floors/A_2_doors.svg';
import B_1_data from '@assets/svgs/floors/B_1.json';
import B_1_Background from '@assets/svgs/floors/B_1_bg.svg';
import B_1_Doors from '@assets/svgs/floors/B_1_doors.svg';
import B_2_data from '@assets/svgs/floors/B_2.json';
import B_2_Background from '@assets/svgs/floors/B_2_bg.svg';
import B_2_Doors from '@assets/svgs/floors/B_2_doors.svg';
import B_3_data from '@assets/svgs/floors/B_3.json';
import B_3_Background from '@assets/svgs/floors/B_3_bg.svg';
import B_3_Doors from '@assets/svgs/floors/B_3_doors.svg';
import C_1_data from '@assets/svgs/floors/C_1.json';
import C_1_Background from '@assets/svgs/floors/C_1_bg.svg';
import C_1_Doors from '@assets/svgs/floors/C_1_doors.svg';
import C_2_data from '@assets/svgs/floors/C_2.json';
import C_2_Background from '@assets/svgs/floors/C_2_bg.svg';
import C_2_Doors from '@assets/svgs/floors/C_2_doors.svg';
import C_3_data from '@assets/svgs/floors/C_3.json';
import C_3_Background from '@assets/svgs/floors/C_3_bg.svg';
import C_3_Doors from '@assets/svgs/floors/C_3_doors.svg';
import C_4_data from '@assets/svgs/floors/C_4.json';
import C_4_Background from '@assets/svgs/floors/C_4_bg.svg';
import C_4_Doors from '@assets/svgs/floors/C_4_doors.svg';
import C_5_data from '@assets/svgs/floors/C_5.json';
import C_5_Background from '@assets/svgs/floors/C_5_bg.svg';
import C_5_Doors from '@assets/svgs/floors/C_5_doors.svg';
import C_6_data from '@assets/svgs/floors/C_6.json';
import C_6_Background from '@assets/svgs/floors/C_6_bg.svg';
import C_6_Doors from '@assets/svgs/floors/C_6_doors.svg';
import C_7_data from '@assets/svgs/floors/C_7.json';
import C_7_Background from '@assets/svgs/floors/C_7_bg.svg';
import C_7_Doors from '@assets/svgs/floors/C_7_doors.svg';
import C_8_data from '@assets/svgs/floors/C_8.json';
import C_8_Background from '@assets/svgs/floors/C_8_bg.svg';
import C_8_Doors from '@assets/svgs/floors/C_8_doors.svg';
import C_9_data from '@assets/svgs/floors/C_9.json';
import C_9_Background from '@assets/svgs/floors/C_9_bg.svg';
import C_9_Doors from '@assets/svgs/floors/C_9_doors.svg';

import D_B1_data from '@assets/svgs/floors/D_B1.json';
import D_B1_Background from '@assets/svgs/floors/D_B1_bg.svg';
import D_B1_Doors from '@assets/svgs/floors/D_B1_doors.svg';
import D_B2_data from '@assets/svgs/floors/D_B2.json';
import D_B2_Background from '@assets/svgs/floors/D_B2_bg.svg';
import D_B2_Doors from '@assets/svgs/floors/D_B2_doors.svg';
import D_B3_data from '@assets/svgs/floors/D_B3.json';
import D_B3_Background from '@assets/svgs/floors/D_B3_bg.svg';
import D_B3_Doors from '@assets/svgs/floors/D_B3_doors.svg';
import D_B4_data from '@assets/svgs/floors/D_B4.json';
import D_B4_Background from '@assets/svgs/floors/D_B4_bg.svg';
import D_B4_Doors from '@assets/svgs/floors/D_B4_doors.svg';
import D_B5_data from '@assets/svgs/floors/D_B5.json';
import D_B5_Background from '@assets/svgs/floors/D_B5_bg.svg';
import D_B5_Doors from '@assets/svgs/floors/D_B5_doors.svg';

import E_1_data from '@assets/svgs/floors/E_1.json';
import E_1_Background from '@assets/svgs/floors/E_1_bg.svg';
import E_1_Doors from '@assets/svgs/floors/E_1_doors.svg';
import E_2_data from '@assets/svgs/floors/E_2.json';
import E_2_Background from '@assets/svgs/floors/E_2_bg.svg';
import E_2_Doors from '@assets/svgs/floors/E_2_doors.svg';

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
  B_2: {
    data: B_2_data as FloorMapData,
    Background: B_2_Background,
    Doors: B_2_Doors,
  },
  B_3: {
    data: B_3_data as FloorMapData,
    Background: B_3_Background,
    Doors: B_3_Doors,
  },
  C_1: {
    data: C_1_data as FloorMapData,
    Background: C_1_Background,
    Doors: C_1_Doors,
  },
  C_2: {
    data: C_2_data as FloorMapData,
    Background: C_2_Background,
    Doors: C_2_Doors,
  },
  C_3: {
    data: C_3_data as FloorMapData,
    Background: C_3_Background,
    Doors: C_3_Doors,
  },
  C_4: {
    data: C_4_data as FloorMapData,
    Background: C_4_Background,
    Doors: C_4_Doors,
  },
  C_5: {
    data: C_5_data as FloorMapData,
    Background: C_5_Background,
    Doors: C_5_Doors,
  },
  C_6: {
    data: C_6_data as FloorMapData,
    Background: C_6_Background,
    Doors: C_6_Doors,
  },
  C_7: {
    data: C_7_data as FloorMapData,
    Background: C_7_Background,
    Doors: C_7_Doors,
  },
  C_8: {
    data: C_8_data as FloorMapData,
    Background: C_8_Background,
    Doors: C_8_Doors,
  },
  C_9: {
    data: C_9_data as FloorMapData,
    Background: C_9_Background,
    Doors: C_9_Doors,
  },
  D_B1: {
    data: D_B1_data as FloorMapData,
    Background: D_B1_Background,
    Doors: D_B1_Doors,
  },
  D_B2: {
    data: D_B2_data as FloorMapData,
    Background: D_B2_Background,
    Doors: D_B2_Doors,
  },
  D_B3: {
    data: D_B3_data as FloorMapData,
    Background: D_B3_Background,
    Doors: D_B3_Doors,
  },
  D_B4: {
    data: D_B4_data as FloorMapData,
    Background: D_B4_Background,
    Doors: D_B4_Doors,
  },
  D_B5: {
    data: D_B5_data as FloorMapData,
    Background: D_B5_Background,
    Doors: D_B5_Doors,
  },
  E_1: {
    data: E_1_data as FloorMapData,
    Background: E_1_Background,
    Doors: E_1_Doors,
  },
  E_2: {
    data: E_2_data as FloorMapData,
    Background: E_2_Background,
    Doors: E_2_Doors,
  },
};

/**
 * "C_2" -> { building: "C", floorNum: 2, label: "2F" }. "A_1_test"처럼 접미사가 붙어도 앞의 건물/층만 읽는다.
 * "D_B1"처럼 지하층은 floorNum을 음수(-1)로 둬서 1F보다 아래로 정렬되게 하고, label은 "B1"로 표시한다.
 */
function parseFloorId(id: string): { building: string; floorNum: number; label: string } {
  const m = id.match(/^([A-Za-z]+)_(B)?(\d+)/);
  if (!m) return { building: id, floorNum: 0, label: id };
  const [, building, basement, num] = m;
  const floorNum = basement ? -Number(num) : Number(num);
  const label = basement ? `B${num}` : `${num}F`;
  return { building, floorNum, label };
}

const FLOOR_IDS = Object.keys(FLOORS);
const BUILDINGS = Array.from(new Set(FLOOR_IDS.map((id) => parseFloorId(id).building))).sort();
/** 건물별 층 목록, 엘리베이터 버튼처럼 높은 층이 위로 오게 내림차순 정렬 */
const FLOORS_BY_BUILDING: Record<string, string[]> = Object.fromEntries(
  BUILDINGS.map((b) => [
    b,
    FLOOR_IDS.filter((id) => parseFloorId(id).building === b).sort(
      (a, c) => parseFloorId(c).floorNum - parseFloorId(a).floorNum
    ),
  ])
);

/** 층 전환 시 슬라이드 이동 거리(px). 위층으로 가면 아래에서, 아래층으로 가면 위에서 들어온다. */
const SLIDE_DISTANCE = 64;
const SLIDE_DURATION = 260;

export default function IndoorMapTestScreen() {
  const [query, setQuery] = useState('');
  const [floorId, setFloorId] = useState<keyof typeof FLOORS>('C_9');

  const building = parseFloorId(floorId).building;
  const floor = FLOORS[floorId];
  const mapData = useMemo(() => floor.data, [floor]);
  const Background = floor.Background;
  const Doors = floor.Doors;

  // 직전 층 번호를 기억해뒀다가, 층이 바뀔 때 위/아래 어느 방향에서 들어올지 결정한다.
  const prevFloorNumRef = useRef(parseFloorId(floorId).floorNum);
  const slideY = useSharedValue(0);

  useEffect(() => {
    const { floorNum } = parseFloorId(floorId);
    const goingUp = floorNum > prevFloorNumRef.current;
    slideY.value = goingUp ? SLIDE_DISTANCE : -SLIDE_DISTANCE;
    slideY.value = withTiming(0, { duration: SLIDE_DURATION, easing: Easing.out(Easing.cubic) });
    prevFloorNumRef.current = floorNum;
  }, [floorId, slideY]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.searchBarWrapper}>
        {/* <SearchBar value={query} onChangeText={setQuery} /> */}
        <View style={styles.buildingSwitcher}>
          {BUILDINGS.map((b) => (
            <Pressable
              key={b}
              onPress={() => setFloorId(FLOORS_BY_BUILDING[b][0])}
              style={[styles.buildingButton, b === building && styles.buildingButtonActive]}
            >
              <Text style={[styles.buildingButtonText, b === building && styles.buildingButtonTextActive]}>
                {b}동
              </Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      <Animated.View style={[styles.mapArea, slideStyle]}>
        <IndoorMapView
          key={floorId}
          mapData={mapData}
          renderBackground={({ width, height }) => <Background width={width} height={height} />}
          renderForeground={({ width, height }) => <Doors width={width} height={height} />}
          onRoomSelect={(room) => {
            console.log('selected room:', room?.id, room?.placeId);
          }}
        />
      </Animated.View>

      {/* 엘리베이터 버튼처럼 세로로 쌓은 층 스위처. 위로 갈수록 높은 층. */}
      <View style={styles.floorSwitcher} pointerEvents="box-none">
        {FLOORS_BY_BUILDING[building].map((id) => (
          <Pressable
            key={id}
            onPress={() => setFloorId(id)}
            style={[styles.floorButton, id === floorId && styles.floorButtonActive]}
          >
            <Text style={[styles.floorButtonText, id === floorId && styles.floorButtonTextActive]}>
              {parseFloorId(id).label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBarWrapper: { paddingHorizontal: 16, paddingVertical: 8 },
  mapArea: { flex: 1, overflow: 'hidden' },
  buildingSwitcher: { flexDirection: 'row', gap: 8 },
  buildingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EEE',
  },
  buildingButtonActive: { backgroundColor: '#1D2056' },
  buildingButtonText: { color: '#333', fontWeight: '600' },
  buildingButtonTextActive: { color: '#fff' },
  floorSwitcher: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -100 }],
    gap: 8,
  },
  floorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  floorButtonActive: { backgroundColor: '#1D2056' },
  floorButtonText: { color: '#333', fontWeight: '600' },
  floorButtonTextActive: { color: '#fff' },
});
