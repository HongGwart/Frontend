import type { Region } from '@mj-studio/react-native-naver-map';

/**
 * 네이버 지도 Region(남서쪽 모서리 + 위경도 폭)끼리의 계산. 카메라가 보고 있는 영역(onCameraIdle의 region)과
 * GroundOverlay를 펴 붙일 영역(region)이 같은 모양이다.
 */

/** 가운데를 그대로 두고 각 변을 폭의 ratio만큼 넓힌 영역. 화면 바로 밖까지 미리 올려 둘 때 쓴다. */
export function expandRegion(region: Region, ratio: number): Region {
  const latPad = region.latitudeDelta * ratio;
  const lngPad = region.longitudeDelta * ratio;
  return {
    latitude: region.latitude - latPad,
    longitude: region.longitude - lngPad,
    latitudeDelta: region.latitudeDelta + latPad * 2,
    longitudeDelta: region.longitudeDelta + lngPad * 2,
  };
}

/** 두 영역이 겹치는지(변이 맞닿기만 한 건 겹치지 않는 것으로 본다). */
export function regionsOverlap(a: Region, b: Region): boolean {
  return (
    a.latitude < b.latitude + b.latitudeDelta &&
    b.latitude < a.latitude + a.latitudeDelta &&
    a.longitude < b.longitude + b.longitudeDelta &&
    b.longitude < a.longitude + a.longitudeDelta
  );
}
