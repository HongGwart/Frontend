#!/usr/bin/env node
/**
 * 층 평면도를 네이버 지도 GroundOverlay용 PNG로 굽는다. NaverMapGroundOverlay는 SVG를 못 받고
 * 남북으로 반듯한 사각형(region)에만 이미지를 펴 붙이기 때문에, 건물이 기운 만큼 도면을 미리
 * 돌려서 투명 배경 PNG로 만들고 그 PNG가 딱 맞는 region을 같이 계산해 둔다.
 *
 *   1. src/constant/floorGeoAnchors.json에서 층의 네 모서리 위경도(DevFloorOverlayPicker로 찍은 값)를 읽고
 *   2. 도면 contentBounds 네 모서리 → 위경도 affine 변환을 최소제곱으로 맞춘 뒤
 *   3. 원본 SVG의 Visual 레이어(벽/방/문/아이콘/방 번호)만 그 변환으로 돌려서 PNG로 렌더링하고
 *   4. src/assets/floorOverlays/{층}.png + src/constant/floorOverlayImages.ts(require/region 목록)를 쓴다.
 *
 * 사용법:
 *   node scripts/renderFloorOverlay.js            # floorGeoAnchors.json에 있는 층 전부
 *   node scripts/renderFloorOverlay.js R_L C_1    # 지정한 층만 (나머지 기존 PNG는 유지)
 *
 * 네 점을 네 모서리에 억지로 맞추는 앱 쪽 투영 변환(createFloorToGeo)과 달리 여기선 affine이라,
 * 찍은 점이 평행사변형에서 살짝 벗어난 만큼은 오차로 남는다(로그의 "최대 오차"로 확인).
 */

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const { extractTopLevelChildren } = require('./splitVisualLayers');

const ROOT = path.join(__dirname, '..');
const FLOORS_DIR = path.join(ROOT, 'src/assets/svgs/floors');
const ANCHORS_PATH = path.join(ROOT, 'src/constant/floorGeoAnchors.json');
const OUT_DIR = path.join(ROOT, 'src/assets/floorOverlays');
const INDEX_PATH = path.join(ROOT, 'src/constant/floorOverlayImages.ts');

// 외곽 벽 stroke가 contentBounds 밖으로 살짝 삐져나오는 만큼 여유 (도면 px)
const MARGIN = 8;
// 도면 1px당 PNG 픽셀 수, 그리고 PNG 한 변 최대 길이 (모바일 텍스처 한도 고려)
const PX_PER_SVG_PX = 1;
const MAX_SIDE = 4096;

/** (x, y) → (u, v) affine을 최소제곱으로 푼다. 반환: [a, b, c, d, e, f] (u = ax+by+c, v = dx+ey+f) */
function fitAffine(src, dst) {
  // 정규방정식 (MᵀM)p = Mᵀt 를 u/v 각각 3x3으로 푼다
  const solve3 = (A, b) => {
    const m = A.map((row, i) => [...row, b[i]]);
    for (let c = 0; c < 3; c++) {
      let p = c;
      for (let r = c + 1; r < 3; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
      [m[c], m[p]] = [m[p], m[c]];
      for (let r = 0; r < 3; r++) {
        if (r === c) continue;
        const f = m[r][c] / m[c][c];
        for (let k = c; k < 4; k++) m[r][k] -= f * m[c][k];
      }
    }
    return m.map((row, i) => row[3] / row[i]);
  };
  const MtM = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const Mtu = [0, 0, 0];
  const Mtv = [0, 0, 0];
  src.forEach(([x, y], i) => {
    const row = [x, y, 1];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) MtM[r][c] += row[r] * row[c];
      Mtu[r] += row[r] * dst[i][0];
      Mtv[r] += row[r] * dst[i][1];
    }
  });
  return [...solve3(MtM, Mtu), ...solve3(MtM, Mtv)];
}

function renderFloor(floorId, anchors) {
  const svgPath = path.join(FLOORS_DIR, `${floorId}.svg`);
  const jsonPath = path.join(FLOORS_DIR, `${floorId}.json`);
  if (!fs.existsSync(svgPath) || !fs.existsSync(jsonPath)) {
    throw new Error(`${floorId}: 원본 SVG/JSON이 없습니다 (${svgPath})`);
  }
  const svgText = fs.readFileSync(svgPath, 'utf8');
  const { contentBounds } = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (!contentBounds) throw new Error(`${floorId}: JSON에 contentBounds가 없습니다`);

  // 경도는 cos(위도)를 곱해 위도와 같은 길이 단위로 맞춘다 → PNG 픽셀이 정사각형이 되게
  const lat0 = anchors.reduce((s, a) => s + a.latitude, 0) / anchors.length;
  const cosLat = Math.cos((lat0 * Math.PI) / 180);
  const toUV = ({ latitude, longitude }) => [longitude * cosLat, latitude];

  const { minX, minY, width, height } = contentBounds;
  const corners = [
    [minX, minY],
    [minX + width, minY],
    [minX + width, minY + height],
    [minX, minY + height],
  ];
  const [a, b, c, d, e, f] = fitAffine(corners, anchors.map(toUV));
  const apply = ([x, y]) => [a * x + b * y + c, d * x + e * y + f];

  // 찍은 점과 affine 결과의 차이 (m 단위, 위도 1도 ≈ 111,320m)
  const maxErr = Math.max(
    ...corners.map((pt, i) => {
      const [u, v] = apply(pt);
      const [tu, tv] = toUV(anchors[i]);
      return Math.hypot(u - tu, v - tv) * 111320;
    }),
  );

  // 여유를 둔 도면 사각형이 돌아간 뒤의 바운딩 박스
  const padded = [
    [minX - MARGIN, minY - MARGIN],
    [minX + width + MARGIN, minY - MARGIN],
    [minX + width + MARGIN, minY + height + MARGIN],
    [minX - MARGIN, minY + height + MARGIN],
  ].map(apply);
  const uMin = Math.min(...padded.map(p => p[0]));
  const uMax = Math.max(...padded.map(p => p[0]));
  const vMin = Math.min(...padded.map(p => p[1]));
  const vMax = Math.max(...padded.map(p => p[1]));

  // 도면 1px이 u/v 단위로 얼마인지(= affine의 평균 배율)로 PNG 해상도를 정한다
  const unitsPerSvgPx = Math.sqrt(Math.abs(a * e - b * d));
  let k = PX_PER_SVG_PX / unitsPerSvgPx;
  k = Math.min(k, MAX_SIDE / (uMax - uMin), MAX_SIDE / (vMax - vMin));
  const W = Math.round((uMax - uMin) * k);
  const H = Math.round((vMax - vMin) * k);

  // 도면 (x, y) → PNG (px, py). py는 북쪽이 위라 v를 뒤집는다.
  const matrix = [k * a, -k * d, k * b, -k * e, k * (c - uMin), k * (vMax - f)];

  const visual = extractTopLevelChildren(svgText, 'Visual');
  if (visual.length === 0) throw new Error(`${floorId}: id="Visual" 그룹을 찾지 못했습니다`);
  const defsMatch = svgText.match(/<defs>[\s\S]*?<\/defs>/);
  const out = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">`,
    `<g transform="matrix(${matrix.join(' ')})">`,
    ...visual,
    '</g>',
    defsMatch ? defsMatch[0] : '',
    '</svg>',
  ].join('\n');

  const png = new Resvg(out, { background: 'rgba(0,0,0,0)' }).render().asPng();
  fs.writeFileSync(path.join(OUT_DIR, `${floorId}.png`), png);

  const region = {
    latitude: vMin,
    longitude: uMin / cosLat,
    latitudeDelta: vMax - vMin,
    longitudeDelta: (uMax - uMin) / cosLat,
  };
  console.log(`✓ ${floorId}: ${W}x${H}px, 모서리 최대 오차 ${maxErr.toFixed(2)}m → src/assets/floorOverlays/${floorId}.png`);
  return { region, anchors };
}

/** 이미 만들어둔 floorOverlayImages.ts에서 층별 region/anchors를 다시 읽는다 (지정 층만 다시 구울 때 유지용). */
function readExistingIndex() {
  if (!fs.existsSync(INDEX_PATH)) return {};
  const m = fs.readFileSync(INDEX_PATH, 'utf8').match(/\/\* DATA ([\s\S]*?) DATA \*\//);
  return m ? JSON.parse(m[1]) : {};
}

function writeIndex(entries) {
  const ids = Object.keys(entries).sort();
  const body = ids
    .map(id => {
      const { region, anchors } = entries[id];
      return [
        `  ${id}: {`,
        `    image: require('@assets/floorOverlays/${id}.png'),`,
        `    region: ${JSON.stringify(region)},`,
        `    anchors: ${JSON.stringify(anchors)} as FloorGeoAnchors,`,
        '  },',
      ].join('\n');
    })
    .join('\n');
  const text = `// scripts/renderFloorOverlay.js가 생성하는 파일 — 직접 고치지 말고 스크립트를 다시 돌린다.
import { ImageRequireSource } from 'react-native';
import { Region } from '@mj-studio/react-native-naver-map';
import { FloorGeoAnchors } from '@utils/floorGeoTransform';

export interface FloorOverlayImage {
  /** 건물 기울기만큼 미리 돌려 구운 투명 배경 평면도 PNG */
  image: ImageRequireSource;
  /** PNG를 펴 붙일 남북 정렬 사각형 */
  region: Region;
  /** PNG를 구울 때 쓴 기준점. 지금 기준점과 다르면 PNG가 낡은 것이다 */
  anchors: FloorGeoAnchors;
}

/* DATA ${JSON.stringify(entries)} DATA */
export const FLOOR_OVERLAY_IMAGES: Record<string, FloorOverlayImage> = {
${body}
};
`;
  fs.writeFileSync(INDEX_PATH, text);
}

function main() {
  const allAnchors = JSON.parse(fs.readFileSync(ANCHORS_PATH, 'utf8'));
  const requested = process.argv.slice(2);
  const targets = requested.length > 0 ? requested : Object.keys(allAnchors);
  if (targets.length === 0) {
    console.error('[에러] floorGeoAnchors.json이 비어 있습니다. [FLOOR_ANCHORS] 로그를 먼저 붙여넣으세요.');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const entries = readExistingIndex();
  for (const id of targets) {
    if (!allAnchors[id]) {
      console.error(`[건너뜀] ${id}: floorGeoAnchors.json에 기준점이 없습니다`);
      continue;
    }
    entries[id] = renderFloor(id, allAnchors[id]);
  }
  writeIndex(entries);
  console.log(`\n→ src/constant/floorOverlayImages.ts 갱신 (${Object.keys(entries).length}개 층)`);
}

main();
