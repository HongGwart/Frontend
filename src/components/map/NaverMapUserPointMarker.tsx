import React from 'react';
import { View } from 'react-native';
import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import UserPointMarkerIcon from '@assets/svgs/icons/userPointMarker.svg';

interface Props {
  latitude: number;
  longitude: number;
}

// Figma "marker_user point"(784:4023) — 옅은 원(반경 28) 안에 흰 테두리 파란 점.
const SIZE = 56;

/**
 * 길 안내 중 현재 위치 마커. NaverMapStartPointMarker와 같은 방식(Custom React View)으로
 * 지도에 올리고, 점의 중심이 좌표에 오도록 앵커를 가운데로 둔다.
 */
export function NaverMapUserPointMarker({ latitude, longitude }: Props) {
  return (
    <NaverMapMarkerOverlay
      latitude={latitude}
      longitude={longitude}
      width={SIZE}
      height={SIZE}
      anchor={{ x: 0.5, y: 0.5 }}
      // 경로선·출발/도착 마커보다 위에 그려서 현재 위치가 가려지지 않게 한다.
      zIndex={2}
    >
      <View collapsable={false} style={{ width: SIZE, height: SIZE }}>
        <UserPointMarkerIcon width={SIZE} height={SIZE} />
      </View>
    </NaverMapMarkerOverlay>
  );
}
