import React from 'react';
import { View } from 'react-native';
import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { Marker, MARKER_PIN_BOX_SIZE, MARKER_LABEL_GAP, MARKER_LABEL_PILL_HEIGHT } from '@components/common/Marker';

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
export function NaverMapMarker({ latitude, longitude, label, favorite, count, onPress }: Props) {
  const hasLabel = count === undefined && Boolean(label);
  const { width, height } = getOverlaySize(hasLabel, label);

  return (
    <NaverMapMarkerOverlay
      latitude={latitude}
      longitude={longitude}
      width={width}
      height={height}
      // 마커의 좌표 기준점은 핀 끝(뾰족한 부분)이어야 하므로, 오버레이 전체 높이가 아니라
      // 항상 하단 정렬 + 가로 중앙 정렬로 앵커를 맞춘다.
      anchor={{ x: 0.5, y: 1 }}
      onTap={onPress}
    >
      {/* 마커 생김새를 바꾸는 값(label/favorite/count)은 key로도 전달해야 리렌더 시 캐시가 꼬이지 않는다. */}
      <View
        key={`${label}/${favorite}/${count}`}
        collapsable={false}
        style={{ width, height, alignItems: 'center', justifyContent: 'flex-end' }}
      >
        <Marker label={label} favorite={favorite} count={count} />
      </View>
    </NaverMapMarkerOverlay>
  );
}
