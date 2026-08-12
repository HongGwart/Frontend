#!/usr/bin/env node
/**
 *
 * Figma에서 export한 평면도 SVG를 읽어서 `room_{이름}` 그룹 안의 <rect>를
 * 4개 모서리 좌표 + RN-SVG용 path 문자열로 변환한 JSON을 만든다.
 *
 * "Hitbox" 레이어 지원: Visual 레이어의 배경 도형(rect)만으로는 대각선/복잡한 벽 모양이나
 * 여러 조각으로 나뉜 방을 정확히 못 잡는 경우가 많아서, Figma에 `Visual`과 나란히
 * `Hitbox`라는 최상위 레이어를 두고 그 안에 `<path id="room_{방번호}" d="...">` 형태로
 * 방마다 정확한 hitbox 도형을 직접 그려두면(M/L/H/V/Z만 사용, 곡선 불가) 그걸 최우선으로
 * 사용한다 — 같은 방번호가 Visual 쪽에서 이미 추출됐으면 덮어쓰고, 없으면 새로 추가한다.
 * (도형에 fill/stroke가 전혀 없으면 Figma가 export 시 통째로 생략해버리니, 아주 옅은
 * fill-opacity라도 넣어둬야 한다.)
 *
 * 사용법:
 *   node svgToRoomShapes.js <입력.svg> [출력.json]
 *
 * 결과 JSON 구조:
 * {
 *   "floorId": "A_1",
 *   "width": 1920,
 *   "height": 1080,
 *   "rooms": [
 *     { "id": "506-1", "placeId": null, "points": [[x,y],...], "path": "M.. L.. Z" }
 *   ]
 * }
 */

const fs = require('fs');
const path = require('path');

/** 태그 문자열에서 attr="value" 쌍을 전부 뽑아낸다 (속성 순서에 의존하지 않음) */
/** Figma에서 room_멀티미디어실 처럼 한글 id를 쓰면 export 시 "&#235;&#169;..." 같은
 *  숫자 HTML 엔티티(UTF-8 바이트 단위)로 깨져 나오는 경우가 있다. id에서 그런 엔티티를
 *  발견하면 원래 문자로 복원한다. */
function decodeHtmlEntities(str) {
  if (!str || !str.includes('&#')) return str;
  const withoutEntities = str.replace(/&#(\d+);/g, '');
  if (withoutEntities !== '') return str; // 엔티티 외 다른 문자가 섞여있으면 손대지 않는다
  const bytes = [...str.matchAll(/&#(\d+);/g)].map((m) => Number(m[1]));
  try {
    return Buffer.from(bytes).toString('utf8');
  } catch {
    return str;
  }
}

function parseAttrs(tag) {
  const attrs = {};
  const attrRegex = /([\w:-]+)="([^"]*)"/g;
  let m;
  while ((m = attrRegex.exec(tag)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

/** `<g id="room_...">...</g>` 그룹들을 전부 찾는다 (중첩 <g> 없이 얕은 매칭)
 *  Figma가 레이어를 복제하면 이름을 "room", "room_2", "room_3"... 식으로 자동으로 매기는데,
 *  이 경우 그룹 안의 숫자 라벨(extractLabelId)로 방 이름을 대체한다. 라벨도 없으면 경고. */
function extractRoomGroups(svgText) {
  const groups = [];
  const groupRegex = /<g id="(room(?:_[^"]+)?)"[^>]*>([\s\S]*?)<\/g>/g;
  let match;
  while ((match = groupRegex.exec(svgText)) !== null) {
    groups.push({ id: match[1], inner: match[2] });
  }
  return groups;
}

/** 그룹 안에서 첫 번째 <rect>의 x/y/width/height(+transform)를 뽑는다.
 *  transform="rotate(...)" / "matrix(...)" 로 기울어진 방(사선 벽)도 지원하기 위해
 *  원본 attrs를 그대로 들고 있다가 rectToRoomShape에서 makeTransformFn으로 4모서리를 계산한다. */
function extractFirstRect(inner) {
  const rectTagMatch = inner.match(/<rect\b[^>]*\/?>/);
  if (!rectTagMatch) return null;
  const attrs = parseAttrs(rectTagMatch[0]);
  if (attrs.width === undefined || attrs.height === undefined) return null;

  return {
    x: attrs.x !== undefined ? parseFloat(attrs.x) : 0,
    y: attrs.y !== undefined ? parseFloat(attrs.y) : 0,
    width: parseFloat(attrs.width),
    height: parseFloat(attrs.height),
    transform: attrs.transform,
  };
}

/** 그룹 안에서 방 번호 라벨(<path id="103">, <path id="102-1"> 같은 숫자/하이픈 id)을 찾는다.
 *  hitbox 그룹 이름을 Figma에서 일일이 안 바꿔도, 화면에 보이는 번호 텍스트의 id를 그대로
 *  방 이름으로 재활용하기 위함. Union/Rectangle/stair/door 같은 다른 path id는 걸러진다. */
function extractLabelId(inner) {
  // 대부분은 순수 숫자("103", "402-1")지만 G동처럼 "B110"같이 건물 접두 알파벳 하나가
  // 붙는 번호 체계도 있어서 앞에 알파벳 한 글자를 선택적으로 허용한다.
  const labelRegex = /<path id="([A-Za-z]?\d+(?:-\d+)?)"/g;
  const ids = [];
  let m;
  while ((m = labelRegex.exec(inner)) !== null) {
    ids.push(m[1]);
  }
  if (ids.length === 0) return null;
  if (ids.length > 1) {
    console.warn(`[경고] 방 라벨 후보가 여러 개(${ids.join(', ')}) 발견됨 — 첫 번째 값 사용`);
  }
  return ids[0];
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

/** `<g id="Hitbox" ...>` 안의 `<path id="room_XXX">` / `<rect id="room_XXX">` 들을 방 도형으로 뽑는다.
 *  Visual 레이어의 배경 조각들을 짜맞춰 추정하는 것보다 훨씬 정확한 소스이므로,
 *  같은 방 id가 있으면 이 값으로 덮어쓰고, 없으면 새로 추가한다. */
function extractHitboxRooms(svgText) {
  const hitboxMatch = svgText.match(/<g id="Hitbox"[^>]*>([\s\S]*?)<\/g>/);
  if (!hitboxMatch) return [];
  const inner = hitboxMatch[1];
  const elRegex = /<(path|rect) id="room_([^"]+)"([^>]*)\/?>/g;
  const rooms = [];
  let m;
  while ((m = elRegex.exec(inner)) !== null) {
    const [, tag, rawRoomId, attrsStr] = m;
    const roomId = decodeHtmlEntities(rawRoomId);
    const attrs = parseAttrs(`<${tag}${attrsStr}>`);
    const points = tag === 'rect' ? rectElementToPoints(attrs) : parsePathToPoints(attrs.d || '');
    if (!points) {
      console.warn(`[경고] Hitbox "room_${roomId}" (${tag})를 파싱하지 못해 건너뜀`);
      continue;
    }
    const path = 'M' + points.map(([x, y]) => `${x},${y}`).join(' L') + ' Z';
    rooms.push({ id: roomId, placeId: null, points, path });
  }
  return rooms;
}

function rectToRoomShape(groupId, rect, labelId) {
  const { x, y, width, height, transform } = rect;
  const tf = makeTransformFn(transform);
  const points = [
    tf([x, y]),
    tf([x + width, y]),
    tf([x + width, y + height]),
    tf([x, y + height]),
  ];
  const path = `M${points[0][0]},${points[0][1]} L${points[1][0]},${points[1][1]} L${points[2][0]},${points[2][1]} L${points[3][0]},${points[3][1]} Z`;

  const isAutoNumbered = /^room(_\d+)?$/.test(groupId);
  let roomName;
  if (!isAutoNumbered) {
    // Figma에서 이미 손으로 room_506-1 처럼 바꿔둔 경우 -> 그걸 그대로 우선 사용
    roomName = groupId.replace(/^room_/, '');
  } else if (labelId) {
    // 자동 이름인데 안에 숫자 라벨이 있으면 그걸 방 이름으로 사용
    roomName = labelId;
  } else {
    // 라벨도 없으면 어쩔 수 없이 그룹 이름 그대로 (나중에 수동 매핑 필요)
    roomName = groupId;
  }

  return { id: roomName, placeId: null, points, path };
}

function main() {
  const [, , inputPath, outputPathArg] = process.argv;
  if (!inputPath) {
    console.error('사용법: node svgToRoomShapes.js <입력.svg> [출력.json]');
    process.exit(1);
  }

  const svgText = fs.readFileSync(inputPath, 'utf8');
  const widthMatch = svgText.match(/<svg[^>]*\bwidth="([\d.]+)"/);
  const heightMatch = svgText.match(/<svg[^>]*\bheight="([\d.]+)"/);

  const groups = extractRoomGroups(svgText);
  const rooms = [];
  const seen = new Set();

  for (const group of groups) {
    const rect = extractFirstRect(group.inner);
    if (!rect) {
      console.warn(`[경고] "${group.id}" 그룹 안에서 <rect>를 찾지 못해 건너뜀`);
      continue;
    }
    const labelId = extractLabelId(group.inner);
    const shape = rectToRoomShape(group.id, rect, labelId);

    const isAutoNumbered = /^room(_\d+)?$/.test(group.id);
    if (isAutoNumbered && !labelId) {
      console.warn(
        `[경고] "${group.id}" 는 자동 생성 이름이고 안에 숫자 라벨도 없어서 방 이름을 못 정했습니다. ` +
          `Figma에서 "room_506-1" 처럼 직접 이름을 바꿔주세요.`
      );
      // 이름을 못 정한 자동 생성 방은 대개 Hitbox 레이어에 진짜 번호가 붙은 정밀한
      // 버전이 따로 존재한다(같은 자리를 거의 그대로 덮음). 화면에 "room_7" 같은
      // 이상한 텍스트가 중복으로 뜨는 걸 막기 위해 라벨을 비워둔다(도형은 유지).
      shape.label = '';
    }
    if (seen.has(shape.id)) {
      console.warn(`[경고] 방 id "${shape.id}" 중복 — 나중 것이 앞의 것을 덮어씀`);
    }
    seen.add(shape.id);
    rooms.push(shape);
  }

  // Hitbox 레이어(<g id="Hitbox"><path id="room_XXX" d="..."/></g>)가 있으면 그 정밀한
  // 도형으로 같은 id의 방을 덮어쓰고, 없던 방이면 새로 추가한다.
  const hitboxRooms = extractHitboxRooms(svgText);
  if (hitboxRooms.length > 0) {
    const byId = new Map(rooms.map((r, idx) => [r.id, idx]));
    let overwritten = 0;
    let added = 0;
    for (const hitboxRoom of hitboxRooms) {
      const existingIdx = byId.get(hitboxRoom.id);
      if (existingIdx !== undefined) {
        rooms[existingIdx] = hitboxRoom;
        overwritten += 1;
      } else {
        rooms.push(hitboxRoom);
        byId.set(hitboxRoom.id, rooms.length - 1);
        added += 1;
      }
    }
    console.log(`✓ Hitbox 레이어에서 방 ${hitboxRooms.length}개 반영 (덮어씀 ${overwritten} / 새로 추가 ${added})`);
  }

  // Figma에서 레이어 이름이 겹치면 exporter가 "_2", "_3" 처럼 접미사를 붙인다.
  // room_101 / room_101_2 처럼 원본 id가 그대로 남아있는 방이 있으면, 화면에
  // 같은 번호(또는 "101_2" 같은 이상한) 텍스트가 중복으로 뜨는 걸 막기 위해
  // 접미사가 붙은 쪽은 라벨을 비워서 텍스트만 숨긴다(도형/클릭 영역은 유지).
  // 실제로는 서로 다른 두 개의 방일 수도 있으므로 삭제하지 않고 경고만 남긴다 —
  // Figma에서 진짜 방 번호를 확인해서 나중에 수동으로 바로잡아야 한다.
  {
    const idSet = new Set(rooms.map((r) => r.id));
    let suppressed = 0;
    for (const room of rooms) {
      const m = room.id.match(/^(.+)_(\d+)$/);
      if (!m) continue;
      const baseId = m[1];
      if (!idSet.has(baseId)) continue;
      if (room.label === undefined || room.label !== '') {
        room.label = '';
        suppressed += 1;
        console.warn(
          `[경고] "${room.id}"가 "${baseId}"와 이름이 겹쳐서(Figma 레이어 중복) 자동 생성된 것으로 보여 ` +
            `라벨을 숨겼습니다. 실제로 다른 방이라면 Figma에서 정확한 번호를 확인해 수동으로 고쳐주세요.`
        );
      }
    }
    if (suppressed > 0) {
      console.log(`✓ 이름 충돌로 의심되는 방 ${suppressed}개의 중복 텍스트를 자동으로 숨겼습니다.`);
    }
  }

  if (rooms.length === 0) {
    console.warn(
      '[경고] room_ 로 시작하는 그룹을 하나도 찾지 못했습니다. Figma에서 hitbox 레이어 이름이 ' +
        '"room_방이름" 형식인지, export 시 "Include id attribute" 옵션을 켰는지 확인하세요.'
    );
  }

  const data = {
    floorId: path.basename(inputPath, path.extname(inputPath)),
    width: widthMatch ? parseFloat(widthMatch[1]) : null,
    height: heightMatch ? parseFloat(heightMatch[1]) : null,
    rooms,
  };

  const outputPath = outputPathArg || inputPath.replace(/\.svg$/, '.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`✓ 방 ${rooms.length}개 추출 완료 → ${outputPath}`);
}

main();