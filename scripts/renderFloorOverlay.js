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
 *   node scripts/renderFloorOverlay.js --anchors=src/constant/floorPlanAnchors.json R_L
 *                                                 # 서버 기준점으로 계산한 네 모서리(buildFloorPlanAnchors.js)로 굽기
 *
 * 앱 용량을 줄이려고 PNG는 256색으로 줄여(upng-js) 저장한다. 평면도는 색 수가 적어서 눈으로는 차이가 거의 없다.
 *
 * 기준점은 앱에서 도면을 이동·회전·균일 확대로만 맞춘 것이라 직사각형 그대로여서 affine으로 정확히 맞는다
 * (로그의 "최대 오차"가 0에 가까워야 정상). 모양이 찌그러지지 않는다.
 */

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const UPNG = require('upng-js');
const { extractTopLevelChildren } = require('./splitVisualLayers');

const ROOT = path.join(__dirname, '..');
const FLOORS_DIR = path.join(ROOT, 'src/assets/svgs/floors');
const DEFAULT_ANCHORS_PATH = path.join(ROOT, 'src/constant/floorGeoAnchors.json');
const OUT_DIR = path.join(ROOT, 'src/assets/floorOverlays');
const INDEX_PATH = path.join(ROOT, 'src/constant/floorOverlayImages.ts');

// 외곽 벽 stroke가 contentBounds 밖으로 살짝 삐져나오는 만큼 여유 (도면 px)
const MARGIN = 8;
// 도면 1px당 PNG 픽셀 수, 그리고 PNG 한 변 최대 길이 (모바일 텍스처 한도 고려)
const PX_PER_SVG_PX = 1;
const MAX_SIDE = 4096;
// PNG 색 수(0이면 무손실). 256색이면 원본 대비 대략 1/3 크기.
const PNG_COLORS = 256;
// 방 번호 라벨 path(id="103", "102-2", "B110", "106_2"). stripLabelPaths.js와 같은 패턴.
// PNG에 구우면 건물 기울기만큼 글자가 같이 돌아가므로 빼고, 앱(FloorPlanOverlay)이 마커로 똑바로 그린다.
const LABEL_PATH_REGEX = /<path id="[A-Za-z]?\d+(?:-\d+)?(?:_\d+)?"[^>]*\/>\s*/g;
// "Hall", "국제회의장"처럼 글자로 된 방 이름 라벨은 위 패턴에 안 걸리므로, id가 그 층 방 이름과 같은 path도 뺀다.
// Figma가 한글 id를 UTF-8 바이트 단위 문자 참조(&#234;&#179;...)로 내보내서 풀어서 비교한다.
const SELF_CLOSING_PATH_REGEX = /<path id="([^"]*)"[^>]*\/>\s*/g;
const decodeSvgId = id =>
  Buffer.from(id.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code))), 'latin1')
    .toString('utf8')
    .replace(/_\d+$/, '');

// 엘리베이터/계단/화장실 아이콘 그룹. 라벨처럼 PNG에 구우면 같이 기울어지므로 빼고, 위치만 기록해 앱이 마커로 그린다.
const ICON_GROUP_OPEN_REGEX = /<g id="map_(elevator|stairs|toilet_female|toilet_male)(?:_\d+)?"[^>]*>/g;

/**
 * 조각에서 아이콘 그룹(<g id="map_…">…</g>)을 빼고, 뺀 그룹들을 돌려준다. 그룹 안에 <g>가 더 있을 수 있어
 * 여는/닫는 g 태그 수를 세어 짝이 맞는 </g>까지 잘라낸다.
 */
function extractIconGroups(svgFragment) {
  const groups = [];
  let rest = '';
  let cursor = 0;
  ICON_GROUP_OPEN_REGEX.lastIndex = 0;
  let open;
  while ((open = ICON_GROUP_OPEN_REGEX.exec(svgFragment)) !== null) {
    const gTag = /<(\/)?g\b[^>]*?(\/)?>/g;
    gTag.lastIndex = open.index + open[0].length;
    let depth = 1;
    let tag;
    while (depth > 0 && (tag = gTag.exec(svgFragment)) !== null) {
      if (tag[1]) depth--;
      else if (!tag[2]) depth++;
    }
    const end = depth === 0 ? gTag.lastIndex : svgFragment.length;
    rest += svgFragment.slice(cursor, open.index);
    groups.push({ type: open[1], svg: svgFragment.slice(open.index, end) });
    cursor = end;
    ICON_GROUP_OPEN_REGEX.lastIndex = end;
  }
  return { rest: rest + svgFragment.slice(cursor), groups };
}

/** 아이콘 그룹이 도면에서 차지하는 영역의 중심(도면 좌표). 클립 경로 등 defs가 필요해서 같이 넘긴다. */
function iconCenter(groupSvg, viewBox, defs) {
  const bbox = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${defs}${groupSvg}</svg>`).getBBox();
  if (!bbox) return null;
  const round = v => Math.round(v * 10) / 10;
  return [round(bbox.x + bbox.width / 2), round(bbox.y + bbox.height / 2)];
}

/** Visual 레이어 조각에서 방 번호·이름 라벨 path를 뺀다. */
function stripLabels(svgFragment, roomLabels) {
  return svgFragment
    .replace(LABEL_PATH_REGEX, '')
    .replace(SELF_CLOSING_PATH_REGEX, (match, id) => (roomLabels.has(decodeSvgId(id)) ? '' : match));
}

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
  const { contentBounds, rooms } = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const roomLabels = new Set(rooms.map(room => room.label ?? room.id));
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

  // 기준점과 affine 결과의 차이 (m 단위, 위도 1도 ≈ 111,320m)
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

  const defsMatch = svgText.match(/<defs>[\s\S]*?<\/defs>/);
  const viewBox = (svgText.match(/viewBox="([^"]+)"/) || [])[1];
  const icons = [];
  const visual = extractTopLevelChildren(svgText, 'Visual').map(child => {
    const { rest, groups } = extractIconGroups(stripLabels(child, roomLabels));
    for (const group of groups) {
      const center = iconCenter(group.svg, viewBox, defsMatch ? defsMatch[0] : '');
      if (center) icons.push({ type: group.type, center });
    }
    return rest;
  });
  if (visual.length === 0) throw new Error(`${floorId}: id="Visual" 그룹을 찾지 못했습니다`);
  const out = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">`,
    `<g transform="matrix(${matrix.join(' ')})">`,
    ...visual,
    '</g>',
    defsMatch ? defsMatch[0] : '',
    '</svg>',
  ].join('\n');

  const rendered = new Resvg(out, { background: 'rgba(0,0,0,0)' }).render();
  const png = Buffer.from(
    UPNG.encode([new Uint8Array(rendered.pixels).buffer], rendered.width, rendered.height, PNG_COLORS),
  );
  fs.writeFileSync(path.join(OUT_DIR, `${floorId}.png`), png);

  const region = {
    latitude: vMin,
    longitude: uMin / cosLat,
    latitudeDelta: vMax - vMin,
    longitudeDelta: (uMax - uMin) / cosLat,
  };
  console.log(
    `✓ ${floorId}: ${W}x${H}px, ${Math.round(png.length / 1024)}KB, 모서리 최대 오차 ${maxErr.toFixed(2)}m, 아이콘 ${icons.length}개 → src/assets/floorOverlays/${floorId}.png`,
  );
  return { region, anchors, icons };
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
      const { region, anchors, icons = [] } = entries[id];
      return [
        `  ${id}: {`,
        `    image: require('@assets/floorOverlays/${id}.png'),`,
        `    region: ${JSON.stringify(region)},`,
        `    anchors: ${JSON.stringify(anchors)} as FloorGeoAnchors,`,
        `    icons: ${JSON.stringify(icons)} as FloorOverlayIcon[],`,
        '  },',
      ].join('\n');
    })
    .join('\n');
  const text = `// scripts/renderFloorOverlay.js가 생성하는 파일 — 직접 고치지 말고 스크립트를 다시 돌린다.
import { ImageRequireSource } from 'react-native';
import { Region } from '@mj-studio/react-native-naver-map';
import { FloorGeoAnchors } from '@utils/floorGeoTransform';

export type FloorOverlayIconType = 'elevator' | 'stairs' | 'toilet_female' | 'toilet_male';

export interface FloorOverlayIcon {
  type: FloorOverlayIconType;
  /** 아이콘 중심(원본 도면 좌표) */
  center: [number, number];
}

export interface FloorOverlayImage {
  /** 건물 기울기만큼 미리 돌려 구운 투명 배경 평면도 PNG */
  image: ImageRequireSource;
  /** PNG를 펴 붙일 남북 정렬 사각형 */
  region: Region;
  /** PNG를 구울 때 쓴 기준점. 지금 기준점과 다르면 PNG가 낡은 것이다 */
  anchors: FloorGeoAnchors;
  /** PNG에서 뺀 엘리베이터/계단/화장실 아이콘. 기울어지지 않게 앱이 마커로 그린다 */
  icons: FloorOverlayIcon[];
}

/* DATA ${JSON.stringify(entries)} DATA */
export const FLOOR_OVERLAY_IMAGES: Record<string, FloorOverlayImage> = {
${body}
};
`;
  fs.writeFileSync(INDEX_PATH, text);
}

function main() {
  const args = process.argv.slice(2);
  const anchorsArg = args.find(arg => arg.startsWith('--anchors='));
  const anchorsPath = anchorsArg ? path.resolve(ROOT, anchorsArg.slice('--anchors='.length)) : DEFAULT_ANCHORS_PATH;
  const allAnchors = JSON.parse(fs.readFileSync(anchorsPath, 'utf8'));
  const requested = args.filter(arg => !arg.startsWith('--'));
  const targets = requested.length > 0 ? requested : Object.keys(allAnchors);
  if (targets.length === 0) {
    console.error('[에러] floorGeoAnchors.json이 비어 있습니다. [FLOOR_ANCHORS] 로그를 먼저 붙여넣으세요.');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const entries = readExistingIndex();
  for (const id of targets) {
    if (!allAnchors[id]) {
      console.error(`[건너뜀] ${id}: ${path.basename(anchorsPath)}에 기준점이 없습니다`);
      continue;
    }
    entries[id] = renderFloor(id, allAnchors[id]);
  }
  writeIndex(entries);
  console.log(`\n→ src/constant/floorOverlayImages.ts 갱신 (${Object.keys(entries).length}개 층)`);
}

main();
