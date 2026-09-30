import { FloorGeoAnchors } from '@utils/floorGeoTransform';

/**
 * 층 평면도를 네이버 지도 위에 얹기 위한 기준점. 개발용 평면도 앉히기 모드(DevFloorOverlayPicker)로
 * 도면 네 모서리를 지도에서 직접 탭해 모은 값으로, Metro에 찍힌 "[FLOOR_ANCHORS]" 로그 JSON을
 * floorGeoAnchors.json에 그대로 붙여넣는다(renderFloorOverlay.js도 같은 JSON을 읽는다).
 * 순서는 도면 기준 [좌상단, 우상단, 우하단, 좌하단]. 추후 실내 길찾기에서 도면 좌표 ↔ 위경도 변환에 쓴다.
 */
export const FLOOR_GEO_ANCHORS = require('./floorGeoAnchors.json') as Record<string, FloorGeoAnchors>;
