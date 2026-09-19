import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, LayoutChangeEvent } from 'react-native';
import { NaverMapViewRef } from '@mj-studio/react-native-naver-map';

interface FocusTarget {
  latitude: number;
  longitude: number;
  zoom?: number;
}

const DEFAULT_ZOOM = 16;

// 카드 안 이미지가 로드되면서 레이아웃이 한 번에 안정되지 않고 여러 번(placeholder ->
// 실제 크기) 바뀔 수 있는데, 그때마다 바로 animateCameraTo를 쏘면 애니메이션이 매번
// 끊기고 새로 시작해서 뚝뚝 끊겨 보인다. 짧게 모아뒀다가(디바운스) 레이아웃이 잠잠해진
// 뒤 마지막 값으로 딱 한 번만 움직인다.
const LAYOUT_SETTLE_DELAY_MS = 80;

/**
 * 마커를 탭해 시설 정보 카드가 올라올 때, 마커가 카드에 가리지 않도록 검색창+카테고리
 * 칩 아래쪽 끝과 카드 위쪽 끝 사이의 세로 중앙으로 카메라를 옮긴다. 검색 화면(SearchScreen)의
 * 지도 모드에서 쓰던 로직을 그대로 재사용할 수 있게 뽑아낸 것 — 메인홈 지도(MapScreen)도
 * 동일하게 쓴다.
 *
 * NaverMapView는 target이 바뀌어도 언마운트되지 않고 그대로 유지되므로, initialCamera
 * (최초 마운트에만 적용됨)만으로는 다른 마커를 선택했을 때 카메라가 안 옮겨간다. 그래서
 * target/칩 영역/카드 높이가 바뀔 때마다 명시적으로 mapViewRef.animateCameraTo를 호출한다.
 */
export function useFacilityCardCameraFocus(
  mapViewRef: RefObject<NaverMapViewRef | null>,
  target: FocusTarget | null,
) {
  const [chipsBottomY, setChipsBottomY] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);

  const handleChipsAreaLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setChipsBottomY(y + height);
  }, []);

  const handleFacilityCardLayout = useCallback((event: LayoutChangeEvent) => {
    setCardHeight(event.nativeEvent.layout.height);
  }, []);

  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(settleTimerRef.current);
    if (!target || chipsBottomY === 0 || cardHeight === 0) return;

    settleTimerRef.current = setTimeout(() => {
      const windowHeight = Dimensions.get('window').height;
      const cardTopY = windowHeight - cardHeight;
      const pivotY = (chipsBottomY + cardTopY) / 2 / windowHeight;
      mapViewRef.current?.animateCameraTo({
        latitude: target.latitude,
        longitude: target.longitude,
        zoom: target.zoom ?? DEFAULT_ZOOM,
        pivot: { x: 0.5, y: pivotY },
      });
    }, LAYOUT_SETTLE_DELAY_MS);

    return () => clearTimeout(settleTimerRef.current);
  }, [target, chipsBottomY, cardHeight, mapViewRef]);

  return { chipsBottomY, handleChipsAreaLayout, handleFacilityCardLayout };
}
