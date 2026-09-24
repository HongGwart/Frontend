import React from 'react';
import { View } from 'react-native';
import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { StartPointMarker } from '@components/common/StartPointMarker';

interface Props {
  latitude: number;
  longitude: number;
  label: string;
  active?: boolean;
  onPress?: () => void;
}

// StartPointMarker(라벨 필 4px+21px 높이 + gap 8px + 점 44px 원본 크기)를 그대로 담을 오버레이 크기.
const LABEL_PILL_HEIGHT = 4 * 2 + 21;
const GAP = 8;
const DOT_SIZE = 44;
const WIDTH = 88;
const HEIGHT = LABEL_PILL_HEIGHT + GAP + DOT_SIZE;

/**
 * 길찾기 경로 보기 화면의 출발지 마커(StartPointMarker)를 네이버 지도 위 커스텀 마커로
 * 올려주는 어댑터. NaverMapMarker.tsx와 같은 방식(Custom React View 이미지 타입)을 쓴다.
 */
export function NaverMapStartPointMarker({ latitude, longitude, label, active, onPress }: Props) {
  return (
    <NaverMapMarkerOverlay
      latitude={latitude}
      longitude={longitude}
      width={WIDTH}
      height={HEIGHT}
      // 점의 중심이 좌표 기준점이어야 하므로, 오버레이 전체 높이가 아니라 점 반지름만큼
      // 위로 올라간 지점(라벨+gap+점 절반)에 앵커를 맞춘다.
      anchor={{ x: 0.5, y: (LABEL_PILL_HEIGHT + GAP + DOT_SIZE / 2) / HEIGHT }}
      onTap={onPress}
    >
      <View
        key={`${label}/${active}`}
        collapsable={false}
        style={{ width: WIDTH, height: HEIGHT, alignItems: 'center', justifyContent: 'flex-start' }}
      >
        <StartPointMarker label={label} active={active} />
      </View>
    </NaverMapMarkerOverlay>
  );
}
