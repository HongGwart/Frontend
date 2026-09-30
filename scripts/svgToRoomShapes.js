#!/usr/bin/env node
/**
 *
 * Figma에서 export한 평면도 SVG의 `Hitbox` 레이어를 읽어서, 방마다 탭 판정(points)과
 * 하이라이트(path)에 쓰는 도형 JSON을 만든다.
 *
 * 방 도형은 Hitbox 레이어 하나만 기준으로 한다. 예전에는 Visual 레이어의 강의실 사각형을
 * 기본으로 쓰고 Hitbox가 있는 방만 덮어썼는데, 두 방식이 섞여 층·방마다 정확도가 달랐다(#24).
 *
 * Figma Hitbox 레이어 규칙:
 *   - `Visual`과 나란한 최상위 레이어 `Hitbox` 안에 방마다 도형 하나
 *   - 이름은 `room_{방번호}` (예: room_506-1, room_열람실). 한 강의실이 여러 조각이면
 *     room_623 / room_623_2 처럼 두면 같은 강의실로 묶여 함께 선택되고 번호는 한 번만 보인다.
 *   - rect(회전 가능) / path / circle 지원. path 곡선은 몇 개 점으로 근사한다.
 *   - fill이 전혀 없으면 Figma가 export 시 도형을 통째로 생략하니, 아주 옅은 fill-opacity를 넣는다.
 *   - export 시 "Include id attribute"를 켠다.
 *
 * 출력 JSON이 이미 있으면 거기서 손으로 넣어둔 `labelAnchor`를 같은 방에 이어받고, 예전엔
 * 있었는데 Hitbox에 없는 방 목록을 경고로 알려준다(Figma 누락 확인용).
 *
 * 사용법:
 *   node svgToRoomShapes.js <입력.svg> [출력.json] [--allow-empty]
 *
 * --allow-empty: 강의실이 없는 층(예: R_16)처럼 Hitbox 레이어가 없어도 되는 경우에만 붙인다.
 *   rooms가 빈 JSON을 만든다. 없으면 Hitbox 누락을 export 실수로 보고 에러로 멈춘다.
 *
 * 결과 JSON 구조:
 * {
 *   "floorId": "A_1",
 *   "width": 1920,
 *   "height": 1080,
 *   "contentBounds": { "minX": 212, "minY": 300, "width": 1520, "height": 640 },  // 도면 외곽 영역
 *   "rooms": [
 *     { "id": "506-1", "placeId": null, "points": [[x,y],...], "path": "M.. L.. Z" }
 *   ]
 * }
 */

const fs = require('fs');
const path = require('path');

/** Figma에서 room_열람실 처럼 한글 이름을 쓰면 export 시 "&#236;&#151;&#180;" 같은 숫자 HTML
 *  엔티티(UTF-8 바이트 단위)로 깨져 나온다. "(Green)"이나 "제1" 처럼 일반 문자가 섞여 있어도
 *  연속된 엔티티 묶음만 골라 UTF-8로 복원한다. */
function decodeHtmlEntities(str) {
  if (!str || !str.includes('&#')) return str;
  return str.replace(/(?:&#\d+;)+/g, (run) => {
    const bytes = [...run.matchAll(/&#(\d+);/g)].map((m) => Number(m[1]));
    return Buffer.from(bytes).toString('utf8');
  });
}

/** 태그 문자열에서 attr="value" 쌍을 전부 뽑아낸다 (속성 순서에 의존하지 않음) */
function parseAttrs(tag) {
  const attrs = {};
  const attrRegex = /([\w:-]+)="([^"]*)"/g;
  let m;
  while ((m = attrRegex.exec(tag)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

/** "rotate(9.96 1872.24 392.779)" / "translate(dx dy)" / "matrix(a b c d e f)" 를 파싱해서
 *  점 (x,y) -> 변환된 (x,y)로 바꾸는 함수를 돌려준다. 여러 transform이 공백으로 나열된 경우
 *  Figma는 거의 항상 하나만 쓰므로 첫 번째 것만 지원한다. */
function makeTransformFn(transformValue) {
  if (!transformValue) return ([x, y]) => [x, y];
  let m = transformValue.match(
    /rotate\(\s*([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)\s*\)/
  );
  if (m) {
    const deg = parseFloat(m[1]);
    const cx = parseFloat(m[2]);
    const cy = parseFloat(m[3]);
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return ([x, y]) => {
      const dx = x - cx;
      const dy = y - cy;
      return [
        Math.round((cx + dx * cos - dy * sin) * 1000) / 1000,
        Math.round((cy + dx * sin + dy * cos) * 1000) / 1000,
      ];
    };
  }
  m = transformValue.match(/translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/);
  if (m) {
    const dx = parseFloat(m[1]);
    const dy = parseFloat(m[2]);
    return ([x, y]) => [x + dx, y + dy];
  }
  m = transformValue.match(
    /matrix\(\s*([-\d.e]+)[ ,]+([-\d.e]+)[ ,]+([-\d.e]+)[ ,]+([-\d.e]+)[ ,]+([-\d.e]+)[ ,]+([-\d.e]+)\s*\)/
  );
  if (m) {
    const [a, b, c, d, e, f] = m.slice(1).map(Number);
    return ([x, y]) => [a * x + c * y + e, b * x + d * y + f];
  }
  return ([x, y]) => [x, y];
}

/** 두 점을 잇는 3차/2차 베지어 곡선을 t=0.25/0.5/0.75 세 점으로 근사해서 points에 밀어넣는다.
 *  완벽한 곡선은 아니지만 사각형 하이라이팅보다는 훨씬 실제 벽 모양에 가깝다. */
function pushCubicSamples(points, x0, y0, x1, y1, x2, y2, x3, y3) {
  for (const t of [0.25, 0.5, 0.75]) {
    const mt = 1 - t;
    const x =
      mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
    const y =
      mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
    points.push([Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
  }
  points.push([x3, y3]);
}
function pushQuadSamples(points, x0, y0, x1, y1, x2, y2) {
  for (const t of [0.33, 0.66]) {
    const mt = 1 - t;
    const x = mt * mt * x0 + 2 * mt * t * x1 + t * t * x2;
    const y = mt * mt * y0 + 2 * mt * t * y1 + t * t * y2;
    points.push([Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
  }
  points.push([x2, y2]);
}

/** SVG path의 `d` 속성(M/L/H/V/Z 및 곡선 C/S/Q/T/A, 전부 절대좌표 대문자 기준)을
 *  [[x,y],...] 점 배열로 바꾼다. 곡선은 몇 개 점으로 샘플링해서 근사한다.
 *  Figma가 상대좌표(소문자 명령)로 내보내는 경우는 아직 지원하지 않는다. */
function parsePathToPoints(d) {
  const tokens = d.match(/[MLHVZCSQTA]|-?\d+(?:\.\d+)?(?:e-?\d+)?/gi);
  if (!tokens) return null;
  const points = [];
  let cx = 0;
  let cy = 0;
  let i = 0;
  let sawLowercase = /[mlhvzcsqta]/.test(d.replace(/e-?\d+/gi, ''));
  while (i < tokens.length) {
    const cmd = tokens[i].toUpperCase();
    const num = (k) => parseFloat(tokens[i + k]);
    if (cmd === 'M' || cmd === 'L') {
      cx = num(1);
      cy = num(2);
      points.push([cx, cy]);
      i += 3;
    } else if (cmd === 'H') {
      cx = num(1);
      points.push([cx, cy]);
      i += 2;
    } else if (cmd === 'V') {
      cy = num(1);
      points.push([cx, cy]);
      i += 2;
    } else if (cmd === 'C') {
      pushCubicSamples(points, cx, cy, num(1), num(2), num(3), num(4), num(5), num(6));
      cx = num(5);
      cy = num(6);
      i += 7;
    } else if (cmd === 'S' || cmd === 'Q') {
      // S(smooth cubic)/Q(quadratic) 둘 다 좌표 4개. 이전 제어점 반사는 생략하고
      // 주어진 좌표를 그대로 제어점처럼 써서 근사한다.
      pushQuadSamples(points, cx, cy, num(1), num(2), num(3), num(4));
      cx = num(3);
      cy = num(4);
      i += 5;
    } else if (cmd === 'T') {
      cx = num(1);
      cy = num(2);
      points.push([cx, cy]);
      i += 3;
    } else if (cmd === 'A') {
      // 호(arc)는 곡률을 무시하고 끝점까지 직선으로 근사한다.
      cx = num(6);
      cy = num(7);
      points.push([cx, cy]);
      i += 8;
    } else if (cmd === 'Z') {
      i += 1;
    } else {
      i += 1;
    }
  }
  if (sawLowercase) {
    console.warn('[경고] Hitbox path에 상대좌표(소문자) 명령이 섞여 있어 좌표가 틀어질 수 있습니다.');
  }
  // 시작점과 끝점이 같으면(자동 닫힘) 중복 제거
  if (points.length > 1) {
    const [fx, fy] = points[0];
    const [lx, ly] = points[points.length - 1];
    if (fx === lx && fy === ly) points.pop();
  }
  return points.length >= 3 ? points : null;
}

/** `<rect id="room_XXX" x= y= width= height= transform=.../>` 를 (회전 포함) 점 배열로 바꾼다. */
function rectElementToPoints(attrs) {
  const x = parseFloat(attrs.x || 0);
  const y = parseFloat(attrs.y || 0);
  const width = parseFloat(attrs.width);
  const height = parseFloat(attrs.height);
  if (Number.isNaN(width) || Number.isNaN(height)) return null;
  const tf = makeTransformFn(attrs.transform);
  return [
    tf([x, y]),
    tf([x + width, y]),
    tf([x + width, y + height]),
    tf([x, y + height]),
  ];
}

/** 원형 방(<circle id="room_XXX">)은 정다각형으로 근사한다. 탭 판정/하이라이트에는 이 정도면 충분하다. */
const CIRCLE_SEGMENTS = 24;
function circleElementToPoints(attrs) {
  const cx = parseFloat(attrs.cx || 0);
  const cy = parseFloat(attrs.cy || 0);
  const r = parseFloat(attrs.r);
  if (Number.isNaN(r)) return null;
  const tf = makeTransformFn(attrs.transform);
  const points = [];
  for (let i = 0; i < CIRCLE_SEGMENTS; i += 1) {
    const angle = (i / CIRCLE_SEGMENTS) * Math.PI * 2;
    points.push(
      tf([Math.round((cx + r * Math.cos(angle)) * 1000) / 1000, Math.round((cy + r * Math.sin(angle)) * 1000) / 1000])
    );
  }
  return points;
}

/** circleElementToPoints와 같지만 rx/ry가 다를 수 있는 <ellipse>용. */
function ellipseElementToPoints(attrs) {
  const cx = parseFloat(attrs.cx || 0);
  const cy = parseFloat(attrs.cy || 0);
  const rx = parseFloat(attrs.rx);
  const ry = parseFloat(attrs.ry);
  if (Number.isNaN(rx) || Number.isNaN(ry)) return null;
  const tf = makeTransformFn(attrs.transform);
  const points = [];
  for (let i = 0; i < CIRCLE_SEGMENTS; i += 1) {
    const angle = (i / CIRCLE_SEGMENTS) * Math.PI * 2;
    points.push(
      tf([
        Math.round((cx + rx * Math.cos(angle)) * 1000) / 1000,
        Math.round((cy + ry * Math.sin(angle)) * 1000) / 1000,
      ])
    );
  }
  return points;
}

/** `<g id="{groupId}">`의 안쪽 문자열. 중첩 <g>가 있어도 짝이 맞는 </g>까지 잘라낸다. 그룹이 없으면 null. */
function extractGroupInner(svgText, groupId) {
  const openMatch = svgText.match(new RegExp(`<g id="${groupId}"[^>]*>`));
  if (!openMatch) return null;
  const start = openMatch.index + openMatch[0].length;
  const tagRegex = /<g\b[^>]*?(\/?)>|<\/g>/g;
  tagRegex.lastIndex = start;
  let depth = 1;
  let m;
  while ((m = tagRegex.exec(svgText)) !== null) {
    if (m[0] === '</g>') {
      depth -= 1;
      if (depth === 0) return svgText.slice(start, m.index);
    } else if (!m[1]) {
      depth += 1;
    }
  }
  return null;
}

/** Hitbox 레이어 안의 rect/path/circle 중 id가 room_ 으로 시작하는 것들을 방 도형으로 뽑는다. */
function extractHitboxRooms(hitboxInner) {
  const rooms = [];
  const elRegex = /<(rect|path|circle|ellipse|polygon|line|polyline)\b([^>]*?)\/?>/g;
  let m;
  while ((m = elRegex.exec(hitboxInner)) !== null) {
    const [, tag, attrsStr] = m;
    const attrs = parseAttrs(attrsStr);
    const rawId = attrs.id;
    if (!rawId || !rawId.startsWith('room_')) {
      console.warn(`[경고] Hitbox 안의 <${tag} id="${rawId ?? ''}">는 room_ 이름이 아니라 건너뜀`);
      continue;
    }
    const roomId = decodeHtmlEntities(rawId.slice('room_'.length));
    let points = null;
    if (tag === 'rect') points = rectElementToPoints(attrs);
    else if (tag === 'path') points = parsePathToPoints(attrs.d || '');
    else if (tag === 'circle') points = circleElementToPoints(attrs);
    else if (tag === 'ellipse') points = ellipseElementToPoints(attrs);
    if (!points) {
      console.warn(`[경고] Hitbox "room_${roomId}" (<${tag}>)를 도형으로 바꾸지 못해 건너뜀`);
      continue;
    }
    const pathStr = 'M' + points.map(([x, y]) => `${x},${y}`).join(' L') + ' Z';
    rooms.push({ id: roomId, placeId: null, points, path: pathStr });
  }
  return rooms;
}

/**
 * Figma는 이름이 겹치는 레이어에 "_2", "_3"을 붙여서 export한다. Hitbox에서는 한 강의실을 여러
 * 조각으로 나눠 그린 경우라, 라벨을 원래 번호로 맞춰 둔다 — IndoorMapView가 같은 라벨끼리 함께
 * 선택하고, RoomLabelsLayer가 같은 라벨은 한 번만 그린다. id는 서로 달라야 하니 그대로 둔다.
 */
function labelSplitPieces(rooms) {
  const ids = new Set(rooms.map((r) => r.id));
  for (const room of rooms) {
    const m = room.id.match(/^(.+)_(\d+)$/);
    if (!m) continue;
    room.label = m[1];
    if (!ids.has(m[1])) {
      console.warn(`[경고] "${room.id}"는 조각 이름인데 원래 방 "${m[1]}"이 Hitbox에 없음 — 라벨은 "${m[1]}"로 표시`);
    }
  }
}

/**
 * 첫 화면 맞춤(IndoorMapView fitToContainer)에 쓸 도면 영역. Hitbox에는 강의실만 있어서 방 좌표만으로
 * 잡으면 화장실·계단처럼 가장자리에 있던 공간이 잘려 나간다. 대신 Visual 레이어의 외곽선을 쓴다 —
 * Figma는 바깥쪽 stroke가 있는 도형마다 그 도형을 감싸는 <mask x y width height>를 같이 export하므로,
 * 그 사각형들과 방 도형을 합친 바운딩 박스를 도면 영역으로 본다. mask가 없으면 null(앱이 방 좌표로 계산).
 */
function computeContentBounds(visualInner, rooms) {
  if (!visualInner) return null;
  const maskRegex = /<mask\b[^>]*\bx="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"/g;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const include = (x, y) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  let masks = 0;
  let m;
  while ((m = maskRegex.exec(visualInner)) !== null) {
    const [x, y, width, height] = m.slice(1).map(Number);
    include(x, y);
    include(x + width, y + height);
    masks += 1;
  }
  if (masks === 0) return null;
  for (const room of rooms) {
    for (const [x, y] of room.points) include(x, y);
  }
  const round = (v) => Math.round(v * 1000) / 1000;
  return { minX: round(minX), minY: round(minY), width: round(maxX - minX), height: round(maxY - minY) };
}

/** 지하층 번호는 Figma 레이어에 "B"가 붙기도 하고(B404) 안 붙기도 해서(404), 기존 JSON과 맞출 때 무시한다. */
const withoutBasementPrefix = (id) => id.replace(/^B(?=\d)/, '');

/**
 * 기존 JSON에서 이어받을 값을 반영하고, 예전엔 있었는데 Hitbox에 없는 방을 알려준다.
 * - labelAnchor: 수동 보정값이라 같은 방이면 그대로 이어받는다.
 * - id: "B" 접두만 다르면 예전 표시 번호(B404 등)를 유지한다.
 * 예전 JSON의 수동 label은 이어받지 않는다 — Figma Hitbox 이름을 바로잡으면서 만든 보정이라
 * 새 Hitbox 이름이 기준이다.
 */
function carryOverFromPrevious(rooms, outputPath) {
  if (!fs.existsSync(outputPath)) return;
  let previousRooms;
  try {
    previousRooms = JSON.parse(fs.readFileSync(outputPath, 'utf8')).rooms ?? [];
  } catch {
    console.warn(`[경고] 기존 ${outputPath}를 읽지 못해 이어받기를 건너뜀`);
    return;
  }
  const previousByKey = new Map(previousRooms.map((r) => [withoutBasementPrefix(r.id), r]));
  const matchedKeys = new Set();
  let anchors = 0;
  for (const room of rooms) {
    const key = withoutBasementPrefix(room.id);
    const previous = previousByKey.get(key);
    if (!previous) continue;
    matchedKeys.add(key);
    if (previous.id !== room.id) {
      console.log(`  · "${room.id}" → 기존 표시 번호 "${previous.id}" 유지`);
      room.id = previous.id;
    }
    if (previous.labelAnchor) {
      room.labelAnchor = previous.labelAnchor;
      anchors += 1;
    }
  }
  // 라벨이 보이던 방만 알린다. label ""(화장실 등)이나 "room_7" 같은 자동 이름은 원래 탭 대상이 아니었다.
  const missing = previousRooms.filter(
    (r) => !matchedKeys.has(withoutBasementPrefix(r.id)) && r.label !== '' && !/^room(_\d+)?$/.test(r.id)
  );
  if (anchors > 0) console.log(`✓ 기존 labelAnchor ${anchors}개 이어받음`);
  if (missing.length > 0) {
    console.warn(
      `[경고] 기존에 있던 방 ${missing.length}개가 Hitbox에 없음: ${missing.map((r) => r.id).join(', ')} ` +
        `— Figma에서 빠진 건지 확인하세요.`
    );
  }
}

function main() {
  const args = process.argv.slice(2);
  const allowEmpty = args.includes('--allow-empty');
  const [inputPath, outputPathArg] = args.filter((arg) => !arg.startsWith('--'));
  if (!inputPath) {
    console.error('사용법: node svgToRoomShapes.js <입력.svg> [출력.json] [--allow-empty]');
    process.exit(1);
  }

  const svgText = fs.readFileSync(inputPath, 'utf8');
  const widthMatch = svgText.match(/<svg[^>]*\bwidth="([\d.]+)"/);
  const heightMatch = svgText.match(/<svg[^>]*\bheight="([\d.]+)"/);
  const outputPath = outputPathArg || inputPath.replace(/\.svg$/, '.json');

  const hitboxInner = extractGroupInner(svgText, 'Hitbox');
  if (hitboxInner === null && allowEmpty) {
    console.warn('[경고] Hitbox 레이어가 없어 방 없는 층으로 처리함 (--allow-empty)');
  } else if (hitboxInner === null) {
    console.error(
      `[에러] ${inputPath}에 Hitbox 레이어가 없습니다. Figma에서 최상위 "Hitbox" 레이어를 만들고, ` +
        'export 시 "Include id attribute"를 켰는지 확인하세요. (JSON은 만들지 않음)'
    );
    process.exit(1);
  }

  const rooms = hitboxInner === null ? [] : extractHitboxRooms(hitboxInner);
  if (rooms.length === 0 && !allowEmpty) {
    console.error(`[에러] ${inputPath}의 Hitbox 레이어에 room_ 도형이 하나도 없습니다. (JSON은 만들지 않음)`);
    process.exit(1);
  }

  const seen = new Set();
  for (const room of rooms) {
    if (seen.has(room.id)) console.warn(`[경고] 방 id "${room.id}" 중복 — Figma 레이어 이름을 확인하세요`);
    seen.add(room.id);
  }

  labelSplitPieces(rooms);
  carryOverFromPrevious(rooms, outputPath);

  const contentBounds = computeContentBounds(extractGroupInner(svgText, 'Visual'), rooms);
  if (!contentBounds) {
    console.warn('[경고] Visual 레이어에서 외곽선을 찾지 못해 contentBounds를 생략함 — 앱이 방 좌표로 도면 영역을 계산합니다');
  }

  const data = {
    floorId: path.basename(inputPath, path.extname(inputPath)),
    width: widthMatch ? parseFloat(widthMatch[1]) : null,
    height: heightMatch ? parseFloat(heightMatch[1]) : null,
    ...(contentBounds && { contentBounds }),
    rooms,
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`✓ Hitbox에서 방 ${rooms.length}개 추출 완료 → ${outputPath}`);
}

main();
