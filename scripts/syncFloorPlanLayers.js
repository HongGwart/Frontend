#!/usr/bin/env node
/**
 * src/constant/floorPlanReferencePoints.json의 층별 layerId를 서버 레이어 목록으로 다시 맞춘다.
 * 레이어 목록(GET /api/admin/layers)은 관리자 API라 관리자 키가 필요하다 — 키는 저장소 루트의 .admin-key
 * (gitignore됨)에서 읽어 요청 헤더에만 쓴다. 앱 코드/번들에는 절대 넣지 않는다(앱은 공개 API만 쓴다).
 *
 * 사용법:
 *   printf '%s' '<관리자 키>' > .admin-key
 *   node scripts/syncFloorPlanLayers.js
 *
 * 도면 기준점 좌표(points)는 Figma "홍그와트 평면도" 파일의 "평면도 기준점 · API" 그룹(기준점 1·2 · {층} · (x, y))에서
 * 옮긴 값이라 이 스크립트가 건드리지 않는다. 새 층이 생기면 Figma 좌표를 먼저 JSON에 추가한 뒤 실행한다.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'src/constant/floorPlanReferencePoints.json');
const KEY_PATH = path.join(ROOT, '.admin-key');
const API_URL = 'https://dev-api.honggwart.com/api/admin/layers?protocolVersion=2';

async function main() {
  if (!fs.existsSync(KEY_PATH)) throw new Error('.admin-key 파일이 없습니다(관리자 키를 저장소 루트에 저장).');
  const key = fs.readFileSync(KEY_PATH, 'utf8').trim();

  const response = await fetch(API_URL, { headers: { 'X-Honggwart-Admin-Key': key } });
  if (!response.ok) throw new Error(`레이어 목록 요청 실패: HTTP ${response.status}`);
  const layers = await response.json();

  // 층 키("C_1") → layerId. 한 레이어가 여러 층을 담으면(locations) 각 층에 같은 레이어를 쓴다.
  const layerIdByFloor = {};
  layers
    .filter(layer => layer.kind === 'FLOOR_PLAN')
    .forEach(layer => {
      const locations = layer.locations?.length ? layer.locations : [layer.defaultLocation];
      locations.forEach(location => {
        const floorId = `${location.buildingCode ?? layer.buildingCode}_${location.floor}`;
        layerIdByFloor[floorId] ??= layer.id;
      });
    });

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const changed = [];
  const missing = [];
  Object.entries(data).forEach(([floorId, entry]) => {
    const layerId = layerIdByFloor[floorId];
    if (layerId === undefined) missing.push(floorId);
    else if (layerId !== entry.layerId) {
      changed.push(`${floorId}: ${entry.layerId} → ${layerId}`);
      entry.layerId = layerId;
    }
  });
  const unlisted = Object.keys(layerIdByFloor).filter(floorId => !data[floorId]);

  const lines = Object.entries(data).map(([floorId, entry]) => `  ${JSON.stringify(floorId)}: ${JSON.stringify(entry).replace(/,/g, ', ').replace(/:/g, ': ')}`);
  fs.writeFileSync(DATA_PATH, `{\n${lines.join(',\n')}\n}\n`);

  console.log(`layerId 변경 ${changed.length}건${changed.length ? `\n  ${changed.join('\n  ')}` : ''}`);
  if (missing.length) console.log(`서버에 레이어가 없는 층: ${missing.join(', ')}`);
  if (unlisted.length) console.log(`서버엔 있지만 Figma 기준점이 없는 층: ${unlisted.join(', ')}`);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
