import React from 'react';
import { View } from 'react-native';
import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { StartPointMarker } from '@components/common/StartPointMarker';
import { getMarkerLabelWidth } from '@components/common/Marker';

interface Props {
  latitude: number;
  longitude: number;
  label: string;
  active?: boolean;
  onPress?: () => void;
  /**
   * true면 지도에서 숨긴다(오버레이는 그대로 두고 isHidden만 켬). 언마운트했다 다시 그리면 커스텀 뷰를 새로
   * 래스터화하느라 늦게 나타나서, 층을 오갈 때마다 숨겼다 보였다 하는 길 안내 화면은 이걸로 켜고 끈다.
   */
  hidden?: boolean;
}

// StartPointMarker(라벨 필 4px+21px 높이 + gap 8px + 점 44px 원본 크기)를 그대로 담을 오버레이 크기.
const LABEL_PILL_HEIGHT = 4 * 2 + 21;
const GAP = 8;
const DOT_SIZE = 44;
// 폭은 라벨 길이에 맞춘다. 고정 폭이면 "J동 100-1" 같은 긴 라벨이 "…"로 잘린다.
const MIN_WIDTH = 88;
const HEIGHT = LABEL_PILL_HEIGHT + GAP + DOT_SIZE;

/**
 * 길찾기 경로 보기 화면의 출발지 마커(StartPointMarker)를 네이버 지도 위 커스텀 마커로
 * 올려주는 어댑터. NaverMapMarker.tsx와 같은 방식(Custom React View 이미지 타입)을 쓴다.
 */
export function NaverMapStartPointMarker({ latitude, longitude, label, active, onPress, hidden = false }: Props) {
  const width = Math.max(MIN_WIDTH, getMarkerLabelWidth(label));
  return (
    <NaverMapMarkerOverlay
      latitude={latitude}
      longitude={longitude}
      width={width}
      height={HEIGHT}
      // 점의 중심이 좌표 기준점이어야 하므로, 오버레이 전체 높이가 아니라 점 반지름만큼
      // 위로 올라간 지점(라벨+gap+점 절반)에 앵커를 맞춘다.
      anchor={{ x: 0.5, y: (LABEL_PILL_HEIGHT + GAP + DOT_SIZE / 2) / HEIGHT }}
      isHidden={hidden}
      onTap={onPress}
    >
      <View
        key={`${label}/${active}`}
        collapsable={false}
        style={{ width, height: HEIGHT, alignItems: 'center', justifyContent: 'flex-start' }}
      >
        <StartPointMarker label={label} active={active} />
      </View>
    </NaverMapMarkerOverlay>
  );
}
