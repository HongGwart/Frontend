import { FloorGeoAnchors } from '@utils/floorGeoTransform';

/**
 * 층 평면도를 네이버 지도 위에 얹기 위한 기준점. 개발용 평면도 앉히기 모드(DevFloorOverlayPicker)에서
 * 도면을 지도 위에 옮기고 돌리고 크기를 맞춘 뒤 저장하면, 도면 네 모서리의 위경도가 개발 서버를 통해
 * floorGeoAnchors.json에 바로 저장된다(renderFloorOverlay.js도 같은 JSON을 읽는다).
 * 순서는 도면 기준 [좌상단, 우상단, 우하단, 좌하단]. 추후 실내 길찾기에서 도면 좌표 ↔ 위경도 변환에 쓴다.
 */
export const FLOOR_GEO_ANCHORS = require('./floorGeoAnchors.json') as Record<string, FloorGeoAnchors>;
