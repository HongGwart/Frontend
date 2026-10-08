import type { FloorGeoAnchors } from '@utils/floorGeoTransform';

/** 층 평면도를 지도에 앉히는 기준 정보 — 서버 레이어 id + 도면 위 기준점 두 개 */
export interface FloorPlanReference {
  /** 평면도 기준 꼭짓점 API(GET /api/layers/{layerId}/floor-plan-corners)의 레이어 id */
  layerId: number;
  /** 서버 꼭짓점 points[0], points[1]에 대응하는 도면 좌표(SVG px, 층 JSON과 같은 좌표계) */
  points: [[number, number], [number, number]];
}

/**
 * 층 키("C_1") → 기준 정보. 도면 좌표는 Figma "홍그와트 평면도"의 "평면도 기준점 · API"(기준점 1·2 · {층} · (x, y))에서,
 * layerId는 서버 레이어 목록에서 가져왔다(scripts/syncFloorPlanLayers.js로 다시 맞춘다).
 */
export const FLOOR_PLAN_REFERENCES = require('./floorPlanReferencePoints.json') as Record<string, FloorPlanReference>;

/**
 * 서버 기준 꼭짓점 + 위 도면 기준점으로 미리 계산해 둔 층별 네 모서리(scripts/buildFloorPlanAnchors.js가 생성).
 * 평면도 PNG도 이 값으로 굽는다. 앱은 서버 응답 전에도 이 값으로 평면도를 바로 깐다.
 */
export const FLOOR_PLAN_ANCHORS = require('./floorPlanAnchors.json') as Record<string, FloorGeoAnchors>;
