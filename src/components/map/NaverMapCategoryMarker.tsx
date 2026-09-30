import React from 'react';
import { View } from 'react-native';
import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { SvgProps } from 'react-native-svg';
import { CategoryMarker, CATEGORY_MARKER_BOX_SIZE } from '@components/common/CategoryMarker';

interface Props {
  latitude: number;
  longitude: number;
  icon: React.FC<SvgProps>;
  iconWidth: number;
  iconHeight: number;
  iconOffsetY?: number;
  favorite?: boolean;
  count?: number;
  /** true면 지금 탭해서 시설 카드가 열려있는 마커 — 원을 채운 진한 파란색으로 강조한다. */
  active?: boolean;
  /** CategoryMarker의 scale과 동일 — 커지거나 작아진 만큼 래스터화 박스도 같이 맞춰준다. */
  scale?: number;
  onPress?: () => void;
}

// 배지가 원 밖으로 살짝 삐져나오는 만큼(-2~-3px)의 여유. Marker.tsx의 PIN_BOX_BUFFER와 같은 이유.
const BOX_BUFFER = 4;
const SIZE = CATEGORY_MARKER_BOX_SIZE + BOX_BUFFER;

/**
 * <CategoryMarker />를 네이버 지도 위 커스텀 마커로 올려주는 어댑터.
 * NaverMapMarker.tsx와 동일한 "Custom React View" + 하단 중앙 anchor 패턴을 쓴다.
 */
export function NaverMapCategoryMarker({
  latitude,
  longitude,
  icon,
  iconWidth,
  iconHeight,
  iconOffsetY,
  favorite,
  count,
  active,
  scale = 1,
  onPress,
}: Props) {
  // NaverMapMarker.tsx와 같은 이유로, 박스는 1배보다 작게 줄이지 않는다(축소는 CategoryMarker의
  // CSS transform으로만 처리) — 그래야 박스가 실제 내용보다 작아져서 위쪽이 잘리는 일이 없다.
  const scaledSize = SIZE * Math.max(scale, 1);
  return (
    <NaverMapMarkerOverlay
      latitude={latitude}
      longitude={longitude}
      width={scaledSize}
      height={scaledSize}
      anchor={{ x: 0.5, y: 1 }}
      onTap={onPress}
    >
      {/* 마커 생김새를 바꾸는 값은 key로도 전달해야 리렌더 시 캐시가 꼬이지 않는다. */}
      <View
        key={`${icon.displayName ?? icon.name}/${favorite}/${count}/${active}/${scale}`}
        collapsable={false}
        style={{ width: scaledSize, height: scaledSize, alignItems: 'center', justifyContent: 'flex-end' }}
      >
        <CategoryMarker
          icon={icon}
          iconWidth={iconWidth}
          iconHeight={iconHeight}
          iconOffsetY={iconOffsetY}
          favorite={favorite}
          count={count}
          active={active}
          scale={scale}
        />
      </View>
    </NaverMapMarkerOverlay>
  );
}
