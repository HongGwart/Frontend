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
  /** true면 지금 탭해서 시설 카드가 열려있는 마커 — Marker.tsx가 색을 진하게+살짝 키워서 강조한다. */
  active?: boolean;
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
  active = false,
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
          active={active}
        />
        <SeparateLabelOverlay
          latitude={latitude}
          longitude={longitude}
          label={label}
          opacity={labelOpacity}
          onPress={onPress}
          zIndex={zIndex}
          active={active}
        />
      </>
    );
  }
  const { width, height } = getOverlaySize(hasLabel, label);
  // 래스터화 박스는 "원래 크기(1배)보다 작아지면 절대 안 된다" — NaverMapMarkerOverlay는 이
  // 박스를 정확히 그 크기로 스냅샷 떠서 박기 때문에, 박스를 content보다 작게 줄이면 <Marker />
  // 안의 CSS transform(scale)은 그대로 적용되지만 레이아웃 높이(transform 적용 전 크기)는 안
  // 줄어들어서 박스 위로 삐져나온 부분이 그대로 잘린다(예: 라벨 필 윗부분). 반대로 키우는
  // 쪽(active 강조 등)은 여유 공간만 늘어날 뿐이라 안전하다. 그래서 1배 밑으로는 절대
  // 줄이지 않고, 실제 축소는 <Marker />에 넘기는 scale(시각적 transform)만으로 처리한다.
  const contentScale = active ? scale * 1.12 : scale;
  const overlayScale = Math.max(contentScale, 1);
  const scaledWidth = width * overlayScale;
  const scaledHeight = height * overlayScale;

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
        key={`${label}/${favorite}/${count}/${scale}/${active}`}
        collapsable={false}
        style={{ width: scaledWidth, height: scaledHeight, alignItems: 'center', justifyContent: 'flex-end' }}
      >
        <Marker label={label} favorite={favorite} count={count} scale={scale} active={active} />
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
  active = false,
}: {
  latitude: number;
  longitude: number;
  label: string;
  opacity: number;
  onPress?: () => void;
  zIndex?: number;
  active?: boolean;
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
      <View key={`${label}/${active}`} collapsable={false} style={{ width, height, alignItems: 'center' }}>
        {/* 기본 오버레이에선 36px 핀 박스가 40px 오버레이 바닥에 붙어서 라벨 위에 4px 여백이 생긴다. */}
        <View style={{ marginTop: PIN_BOX_BUFFER }}>
          <MarkerLabel label={label} active={active} />
        </View>
      </View>
    </NaverMapMarkerOverlay>
  );
}
