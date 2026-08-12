#!/usr/bin/env node
/**
 *
 * Figma에서 export한 평면도 SVG를 읽어서 `room_{이름}` 그룹 안의 <rect>를
 * 4개 모서리 좌표 + RN-SVG용 path 문자열로 변환한 JSON을 만든다.
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

/** "translate(a b)" 형태의 transform 값을 [dx, dy]로 파싱 (Figma가 x/y 대신 이 형태로 내보내는 경우 대응) */
function parseTranslate(transformValue) {
  if (!transformValue) return [0, 0];
  const m = transformValue.match(/translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/);
  if (!m) return [0, 0];
  return [parseFloat(m[1]), parseFloat(m[2])];
}

/** 그룹 안에서 첫 번째 <rect>의 x/y/width/height를 뽑는다 (hitbox 사각형)
 *  x/y가 없고 transform="translate(dx dy)"만 있는 rect도 지원 */
function extractFirstRect(inner) {
  const rectTagMatch = inner.match(/<rect\b[^>]*\/?>/);
  if (!rectTagMatch) return null;
  const attrs = parseAttrs(rectTagMatch[0]);
  if (attrs.width === undefined || attrs.height === undefined) return null;

  const [dx, dy] = parseTranslate(attrs.transform);
  const x = attrs.x !== undefined ? parseFloat(attrs.x) : 0;
  const y = attrs.y !== undefined ? parseFloat(attrs.y) : 0;

  return {
    x: x + dx,
    y: y + dy,
    width: parseFloat(attrs.width),
    height: parseFloat(attrs.height),
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

function rectToRoomShape(groupId, rect, labelId) {
  const { x, y, width, height } = rect;
  const points = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
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
    }
    if (seen.has(shape.id)) {
      console.warn(`[경고] 방 id "${shape.id}" 중복 — 나중 것이 앞의 것을 덮어씀`);
    }
    seen.add(shape.id);
    rooms.push(shape);
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