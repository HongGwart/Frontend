#!/usr/bin/env node
/**
 *
 * 문(door)을 뺀 아이콘 전용 SVG(splitVisualLayers.js가 만든 *_icons.svg 등)를 읽어서
 * "map_elevator"/"map_stairs" 계열 top-level 그룹을 아이콘 마커 데이터(JSON)로 뽑아낸다.
 *
 * 지도를 확대/축소해도 아이콘은 화면상 크기가 고정된 "마커"로 그려야 하므로(네이버지도 핀 느낌),
 * 아이콘을 SVG에 그려진 그림이 아니라 좌표 데이터로 다뤄야 한다 — 이 스크립트가 그 데이터를 만든다.
 *
 * 사용법:
 *   node svgToIcons.js <입력_icons.svg> [출력.json]
 *
 * 출력.json을 생략하면 <입력>.icons.json으로 저장한다.
 * 출력.json이 이미 존재하는 파일(예: svgToRoomShapes.js가 만든 방 JSON)이면, 그 파일을 읽어서
 * "icons" 필드만 덮어쓰고 나머지(rooms 등)는 그대로 둔 채 저장한다 — 방 JSON에 아이콘을 합칠 때 사용.
 *
 * 결과 데이터 구조:
 *   {
 *     "id": "map_elevator",
 *     "type": "elevator",
 *     "center": [x, y],   // 원본 SVG 좌표계 기준 아이콘 중심점
 *     "size": 32           // 원본 SVG상 아이콘 한 변 길이(참고용, 렌더링은 고정 픽셀 크기 사용)
 *   }
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

/** `<g id="map_elevator" ...>...</g>` 같은 top-level 그룹을 전부 찾는다 (얕은 매칭) */
function extractIconGroups(svgText) {
  const groups = [];
  const groupRegex = /<g id="(map_(?:elevator|stairs)(?:_\d+)?)"[^>]*>([\s\S]*?)<\/g>/g;
  let match;
  while ((match = groupRegex.exec(svgText)) !== null) {
    groups.push({ id: match[1], inner: match[2] });
  }
  return groups;
}

function classifyType(groupId) {
  if (/^map_elevator/.test(groupId)) return 'elevator';
  if (/^map_stairs/.test(groupId)) return 'stairs';
  return null;
}

/** 그룹 안에서 첫 번째 <rect>의 x/y/width/height를 뽑는다 (아이콘 배경 사각형 = hitbox) */
function extractFirstRect(inner) {
  const rectTagMatch = inner.match(/<rect\b[^>]*\/?>/);
  if (!rectTagMatch) return null;
  const attrs = parseAttrs(rectTagMatch[0]);
  if (attrs.x === undefined || attrs.y === undefined || attrs.width === undefined || attrs.height === undefined) {
    return null;
  }
  return {
    x: parseFloat(attrs.x),
    y: parseFloat(attrs.y),
    width: parseFloat(attrs.width),
    height: parseFloat(attrs.height),
  };
}

function main() {
  const [, , inputPath, outputPathArg] = process.argv;
  if (!inputPath) {
    console.error('사용법: node svgToIcons.js <입력_icons.svg> [출력.json]');
    process.exit(1);
  }

  const svgText = fs.readFileSync(inputPath, 'utf8');
  const widthMatch = svgText.match(/<svg[^>]*\bwidth="([\d.]+)"/);
  const heightMatch = svgText.match(/<svg[^>]*\bheight="([\d.]+)"/);

  const groups = extractIconGroups(svgText);
  const icons = [];
  const seen = new Set();

  for (const group of groups) {
    const type = classifyType(group.id);
    if (!type) continue; // 이론상 정규식이 이미 걸러주지만 방어적으로 한 번 더 체크

    const rect = extractFirstRect(group.inner);
    if (!rect) {
      console.warn(`[경고] "${group.id}" 그룹 안에서 <rect>를 찾지 못해 건너뜀`);
      continue;
    }
    if (rect.width !== rect.height) {
      console.warn(`[경고] "${group.id}" 아이콘이 정사각형이 아님 (${rect.width}x${rect.height}) — size는 width 기준`);
    }
    if (seen.has(group.id)) {
      console.warn(`[경고] 아이콘 id "${group.id}" 중복 — 나중 것이 앞의 것을 덮어씀`);
    }
    seen.add(group.id);

    icons.push({
      id: group.id,
      type,
      center: [rect.x + rect.width / 2, rect.y + rect.height / 2],
      size: rect.width,
    });
  }

  if (icons.length === 0) {
    console.warn(
      '[경고] map_elevator / map_stairs 로 시작하는 그룹을 하나도 찾지 못했습니다. ' +
        'splitVisualLayers.js로 나눈 *_icons.svg를 입력했는지 확인하세요.'
    );
  }

  const outputPath = outputPathArg || inputPath.replace(/\.svg$/, '.icons.json');

  if (fs.existsSync(outputPath)) {
    // 이미 있는 JSON(예: 방 데이터)이면 icons 필드만 병합해서 저장
    const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    const merged = { ...existing, icons };
    fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));
    console.log(`✓ 아이콘 ${icons.length}개 추출 완료 → ${outputPath} (기존 파일에 "icons" 필드 병합)`);
    return;
  }

  const data = {
    floorId: path.basename(inputPath, path.extname(inputPath)).replace(/_icons$/, ''),
    width: widthMatch ? parseFloat(widthMatch[1]) : null,
    height: heightMatch ? parseFloat(heightMatch[1]) : null,
    icons,
  };
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`✓ 아이콘 ${icons.length}개 추출 완료 → ${outputPath}`);
}

main();
