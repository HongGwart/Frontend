#!/usr/bin/env node
/**
 * 서버 평면도 기준 꼭짓점(GET /api/layers/{layerId}/floor-plan-corners, 공개 API)과 Figma 도면 기준점
 * (src/constant/floorPlanReferencePoints.json)으로 층마다 평면도 네 모서리 위경도를 계산해
 * src/constant/floorPlanAnchors.json에 쓴다. 앱의 useFloorGeoAnchors와 같은 계산이다(utils/floorGeoTransform의
 * anchorsFromReferencePoints) — 앱은 서버 응답 전에도 이 값으로 평면도를 바로 깔고, renderFloorOverlay.js는
 * 이 값으로 평면도 PNG를 굽는다.
 *
 * 사용법:
 *   node scripts/buildFloorPlanAnchors.js           # 기준점이 있는 층 전부
 *   node scripts/buildFloorPlanAnchors.js R_L R_1   # 지정한 층만 (나머지 기존 값은 유지)
 * 그다음 PNG 굽기:
 *   node scripts/renderFloorOverlay.js --anchors=src/constant/floorPlanAnchors.json R_L R_1
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REFERENCES_PATH = path.join(ROOT, 'src/constant/floorPlanReferencePoints.json');
const OUT_PATH = path.join(ROOT, 'src/constant/floorPlanAnchors.json');
const FLOORS_DIR = path.join(ROOT, 'src/assets/svgs/floors');
const API_URL = layerId => `https://dev-api.honggwart.com/api/layers/${layerId}/floor-plan-corners`;
const METERS_PER_DEGREE = 111320;

/** utils/floorGeoTransform.ts의 getContentBounds와 같다. */
function getContentBounds(data) {
  if (data.contentBounds) return data.contentBounds;
  const xs = data.rooms.flatMap(r => r.points.map(p => p[0]));
  const ys = data.rooms.flatMap(r => r.points.map(p => p[1]));
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

/** utils/floorGeoTransform.ts의 anchorsFromReferencePoints와 같다(두 점 닮음 변환 → 네 모서리). */
function anchorsFromReferencePoints(bounds, floorPoints, geoPoints) {
  const lngScale = METERS_PER_DEGREE * Math.cos((geoPoints[0].latitude * Math.PI) / 180);
  const geo = geoPoints.map(p => [p.longitude * lngScale, p.latitude * METERS_PER_DEGREE]);
  const floor = floorPoints.map(([x, y]) => [x, -y]);
  const [dx, dy] = [floor[1][0] - floor[0][0], floor[1][1] - floor[0][1]];
  const [gx, gy] = [geo[1][0] - geo[0][0], geo[1][1] - geo[0][1]];
  const denominator = dx * dx + dy * dy;
  const sRe = (gx * dx + gy * dy) / denominator;
  const sIm = (gy * dx - gx * dy) / denominator;
  const tRe = geo[0][0] - (sRe * floor[0][0] - sIm * floor[0][1]);
  const tIm = geo[0][1] - (sRe * floor[0][1] + sIm * floor[0][0]);
  const toGeo = (x, y) => {
    const fy = -y;
    return {
      latitude: (sRe * fy + sIm * x + tIm) / METERS_PER_DEGREE,
      longitude: (sRe * x - sIm * fy + tRe) / lngScale,
    };
  };
  const { minX, minY, width, height } = bounds;
  return [toGeo(minX, minY), toGeo(minX + width, minY), toGeo(minX + width, minY + height), toGeo(minX, minY + height)];
}

async function main() {
  const references = JSON.parse(fs.readFileSync(REFERENCES_PATH, 'utf8'));
  const requested = process.argv.slice(2);
  const targets = requested.length > 0 ? requested : Object.keys(references);
  const result = fs.existsSync(OUT_PATH) ? JSON.parse(fs.readFileSync(OUT_PATH, 'utf8')) : {};
  const skipped = [];

  for (const floorId of targets) {
    const reference = references[floorId];
    const jsonPath = path.join(FLOORS_DIR, `${floorId}.json`);
    if (!reference || !fs.existsSync(jsonPath)) {
      skipped.push(`${floorId}(기준점/도면 없음)`);
      continue;
    }
    const response = await fetch(API_URL(reference.layerId));
    const corners = response.ok ? await response.json() : null;
    if (!corners?.points || corners.points.length < 2) {
      skipped.push(`${floorId}(서버 꼭짓점 없음)`);
      continue;
    }
    const bounds = getContentBounds(JSON.parse(fs.readFileSync(jsonPath, 'utf8')));
    result[floorId] = anchorsFromReferencePoints(bounds, reference.points, corners.points.slice(0, 2));
  }

  const sorted = Object.fromEntries(Object.keys(result).sort().map(key => [key, result[key]]));
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`✓ ${targets.length - skipped.length}개 층 → src/constant/floorPlanAnchors.json`);
  if (skipped.length) console.log(`건너뜀: ${skipped.join(', ')}`);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
