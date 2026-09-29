import React from 'react';
import { View } from 'react-native';
import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import {
  Marker,
  MarkerLabel,
  MARKER_PIN_BOX_SIZE,
  MARKER_LABEL_GAP,
  MARKER_LABEL_PILL_HEIGHT,
} from '@components/common/Marker';

interface Props {
  latitude: number;
  longitude: number;
  /** 마커 위에 뜨는 라벨 텍스트 (예: "G동"). count가 있으면 표시되지 않는다. */
  label?: string;
  /** 즐겨찾기로 등록된 위치인지. true면 별 모양 마커로 바뀐다. */
  favorite?: boolean;
  /** 마커에 표시할 숫자 배지 (군집된 개수 등) */
  count?: number;
  onPress?: () => void;
  /** 경로선 같은 다른 오버레이보다 위에 그려지게 하고 싶을 때 (기본 0) */
  zIndex?: number;
  /** Marker의 scale과 동일 — 커진 만큼 래스터화 박스(width/height)도 같이 키워줘야 안 잘린다. */
  scale?: number;
  /**
   * 넘기면 라벨을 핀과 별도의 오버레이로 분리하고 이 값(0~1)을 라벨의 투명도로 쓴다. 핀+라벨이
   * 한 장의 이미지로 래스터화되는 기본 방식에선 라벨만 흐리게 할 수 없어서, 줌에 따라 라벨을
   * 페이드로 숨기는 지도(MapScreen)에서만 쓴다. 0이면 라벨 오버레이를 아예 숨긴다.
   */
  labelOpacity?: number;
}

// NaverMapMarkerOverlay는 커스텀 뷰를 이 크기 그대로의 "고정 크기 이미지"로 래스터화해서
// 박는다. 즉 여기서 계산한 width/height가 실제 <Marker />의 렌더링 크기보다 조금이라도
// 작으면 내용 전체(핀까지 포함해서)가 그 박스에 맞춰 눌려서 축소돼 버린다. 그래서 라벨
// 필/gap 관련 수치는 매직넘버로 다시 적지 않고 Marker.tsx에서 그대로 가져와 쓴다.
// 핀 자체(36x36)엔 배지가 살짝 삐져나오는 만큼(-2px) 여유를 좀 준다.
const PIN_BOX_BUFFER = 4;
const PIN_SIZE = {
  width: MARKER_PIN_BOX_SIZE + PIN_BOX_BUFFER,
  height: MARKER_PIN_BOX_SIZE + PIN_BOX_BUFFER,
};

function getOverlaySize(hasLabel: boolean, label?: string) {
  if (!hasLabel || !label) return PIN_SIZE;
  // 한글 기준 글자당 대략 15px + 좌우 패딩(10px*2) + 여유값.
  const labelWidth = Math.max(PIN_SIZE.width, label.length * 15 + 20 + 10);
  return {
    width: labelWidth,
    height: MARKER_LABEL_PILL_HEIGHT + MARKER_LABEL_GAP + PIN_SIZE.height,
  };
}

/**
 * 우리 디자인의 <Marker />를 네이버 지도 위 커스텀 마커로 올려주는 어댑터.
 * NaverMapMarkerOverlay의 "Custom React View" 이미지 타입을 사용한다.
 */
export function NaverMapMarker({
  latitude,
  longitude,
  label,
  favorite,
  count,
  onPress,
  zIndex,
  scale = 1,
  labelOpacity,
}: Props) {
  const hasLabel = count === undefined && Boolean(label);
  if (labelOpacity !== undefined && hasLabel && label && scale === 1) {
    return (
      <>
        <NaverMapMarker
          latitude={latitude}
          longitude={longitude}
          favorite={favorite}
          onPress={onPress}
          zIndex={zIndex}
        />
        <SeparateLabelOverlay
          latitude={latitude}
          longitude={longitude}
          label={label}
          opacity={labelOpacity}
          onPress={onPress}
          zIndex={zIndex}
        />
      </>
    );
  }
  const { width, height } = getOverlaySize(hasLabel, label);
  // scale만큼 시각적으로 커지는 만큼, 래스터화 박스도 같이 키워야 위쪽이 안 잘린다. 핀 끝은
  // Marker.tsx가 transform-origin: bottom으로 고정해서 커져도 이 박스의 바닥(=anchor y:1,
  // 즉 실제 좌표)에 그대로 붙어있으니 가로/세로 모두 단순히 scale배만큼 키우면 된다.
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  return (
    <NaverMapMarkerOverlay
      latitude={latitude}
      longitude={longitude}
      width={scaledWidth}
      height={scaledHeight}
      zIndex={zIndex}
      // 마커의 좌표 기준점은 핀 끝(뾰족한 부분)이어야 하므로, 오버레이 전체 높이가 아니라
      // 항상 하단 정렬 + 가로 중앙 정렬로 앵커를 맞춘다.
      anchor={{ x: 0.5, y: 1 }}
      onTap={onPress}
    >
      {/* 마커 생김새를 바꾸는 값(label/favorite/count)은 key로도 전달해야 리렌더 시 캐시가 꼬이지 않는다. */}
      <View
        key={`${label}/${favorite}/${count}/${scale}`}
        collapsable={false}
        style={{ width: scaledWidth, height: scaledHeight, alignItems: 'center', justifyContent: 'flex-end' }}
      >
        <Marker label={label} favorite={favorite} count={count} scale={scale} />
      </View>
    </NaverMapMarkerOverlay>
  );
}

/**
 * 라벨 필만 담은 오버레이. 핀+라벨을 한 장으로 그리는 기본 오버레이와 같은 박스 크기/앵커를 쓰고
 * 라벨을 같은 위치(박스 위쪽, 핀 박스 여유분만큼 아래)에 둬서, 따로 그려도 핀과 딱 맞게 겹친다.
 * 라벨을 눌러도 마커를 누른 것과 같게 onPress를 그대로 건다.
 */
function SeparateLabelOverlay({
  latitude,
  longitude,
  label,
  opacity,
  onPress,
  zIndex,
}: {
  latitude: number;
  longitude: number;
  label: string;
  opacity: number;
  onPress?: () => void;
  zIndex?: number;
}) {
  const { width, height } = getOverlaySize(true, label);
  return (
    <NaverMapMarkerOverlay
      latitude={latitude}
      longitude={longitude}
      width={width}
      height={height}
      zIndex={zIndex}
      anchor={{ x: 0.5, y: 1 }}
      alpha={opacity}
      isHidden={opacity <= 0}
      onTap={onPress}
    >
      <View key={label} collapsable={false} style={{ width, height, alignItems: 'center' }}>
        {/* 기본 오버레이에선 36px 핀 박스가 40px 오버레이 바닥에 붙어서 라벨 위에 4px 여백이 생긴다. */}
        <View style={{ marginTop: PIN_BOX_BUFFER }}>
          <MarkerLabel label={label} />
        </View>
      </View>
    </NaverMapMarkerOverlay>
  );
}
