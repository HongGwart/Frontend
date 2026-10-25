import { useCallback, useState } from 'react';
import type { Camera, Region } from '@mj-studio/react-native-naver-map';

/** 네이버 지도 카메라가 멈췄을 때의 줌과 화면에 보이는 영역 */
export interface MapViewport {
  zoom: number;
  region: Region;
}

/**
 * 네이버 지도 카메라가 멈출 때마다 줌·보이는 영역을 기억한다. 반환한 handleCameraIdle을 NaverMapView의
 * onCameraIdle에 넘긴다. 움직이는 동안이 아니라 멈췄을 때만 바뀌어서, 확대용 평면도 조각(FloorPlanOverlay)처럼
 * 보이는 영역에 따라 무거운 걸 다시 얹는 곳이 매 프레임 다시 그려지지 않는다. 아직 한 번도 멈추지 않았으면 null.
 */
export function useSettledMapViewport() {
  const [viewport, setViewport] = useState<MapViewport | null>(null);
  const handleCameraIdle = useCallback(({ zoom, region }: Camera & { region: Region }) => {
    if (zoom === undefined) return;
    setViewport({ zoom, region });
  }, []);
  return { viewport, handleCameraIdle };
}
