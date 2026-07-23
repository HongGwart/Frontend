#!/usr/bin/env node
/**
 *
 * 하나의 SVG에 Visual(벽/방/라벨), 문, 계단·엘리베이터 아이콘이 다 섞여있을 때
 * id 패턴으로 top-level 그룹을 분류해서 3개의 완전한 SVG 파일로 쪼갠다.
 *
 *  - id가 "door"로 시작            -> *_doors.svg
 *  - id가 "map_elevator"/"map_stairs"로 시작 -> *_icons.svg
 *  - 나머지 전부 (Union, room_*, Frame*, Rectangle* 등) -> *_bg.svg
 *
 * 사용법:
 *   node splitVisualLayers.js <입력.svg> [--group=Visual] [출력 접두사]
 *
 * 예:
 *   node splitVisualLayers.js assets/svgs/floors/A_1_test.svg
 *   -> A_1_test_bg.svg / A_1_test_doors.svg / A_1_test_icons.svg
 */

const fs = require('fs');
const path = require('path');

/** SVG 전체를 태그 단위로 훑으면서, id === groupId 인 요소의 "바로 아래" 자식들의
 *  [start, end) 텍스트 범위를 순서대로 뽑아낸다. (재귀적으로 깊이 들어가지 않음) */
function extractTopLevelChildren(svgText, groupId) {
  const tagRegex = /<(\/)?([\w:-]+)([^>]*?)(\/?)>/g;
  const stack = []; // 각 원소는 열린 태그 이름
  let targetDepth = null; // groupId 요소를 연 "직후"의 stack.length
  let currentChildStart = null;
  const children = [];
  let match;

  while ((match = tagRegex.exec(svgText)) !== null) {
    const [full, closing, tagName, attrsStr, selfCloseMark] = match;
    const isClosing = closing === '/';
    const isSelfClosing = selfCloseMark === '/' || /\/\s*$/.test(attrsStr);
    const start = match.index;
    const end = tagRegex.lastIndex;

    if (isClosing) {
      stack.pop();
      if (targetDepth !== null && stack.length === targetDepth && currentChildStart !== null) {
        children.push(svgText.slice(currentChildStart, end));
        currentChildStart = null;
      }
      if (targetDepth !== null && stack.length < targetDepth) {
        // groupId 요소 자체가 닫힘 -> 더 볼 필요 없음
        break;
      }
      continue;
    }

    const idMatch = attrsStr.match(/\bid="([^"]*)"/);
    const id = idMatch ? idMatch[1] : null;

    if (!isSelfClosing) stack.push(tagName);

    if (targetDepth === null) {
      if (id === groupId) {
        targetDepth = stack.length; // groupId를 연 직후 깊이
      }
      continue;
    }

    // targetDepth 확정된 이후
    if (!isSelfClosing && stack.length === targetDepth + 1 && currentChildStart === null) {
      currentChildStart = start; // top-level 자식이 새로 열림
    } else if (isSelfClosing && stack.length === targetDepth && currentChildStart === null) {
      children.push(svgText.slice(start, end)); // top-level 자식이 self-closing 태그 하나로 끝남
    }
  }

  return children;
}

function classify(childSvg) {
  const idMatch = childSvg.match(/\bid="([^"]*)"/);
  const id = idMatch ? idMatch[1] : '';
  if (/^door/i.test(id)) return 'doors';
  if (/^map_(elevator|stairs)/i.test(id)) return 'icons';
  return 'bg';
}

function wrapSvg(header, defsBlock, innerElements) {
  return `${header}\n<g>\n${innerElements.join('\n')}\n</g>\n${defsBlock}\n</svg>\n`;
}

function main() {
  const args = process.argv.slice(2);
  const inputPath = args.find((a) => !a.startsWith('--'));
  const groupOpt = args.find((a) => a.startsWith('--group='));
  const groupId = groupOpt ? groupOpt.split('=')[1] : 'Visual';

  if (!inputPath) {
    console.error('사용법: node splitVisualLayers.js <입력.svg> [--group=Visual]');
    process.exit(1);
  }

  const svgText = fs.readFileSync(inputPath, 'utf8');

  const openTagMatch = svgText.match(/<svg\b[^>]*>/);
  const header = openTagMatch ? openTagMatch[0] : '<svg xmlns="http://www.w3.org/2000/svg">';

  const defsMatch = svgText.match(/<defs>[\s\S]*?<\/defs>/);
  const defsBlock = defsMatch ? defsMatch[0] : '';

  const children = extractTopLevelChildren(svgText, groupId);
  if (children.length === 0) {
    console.error(`[에러] id="${groupId}" 그룹을 찾지 못했거나 자식이 없습니다.`);
    process.exit(1);
  }

  const buckets = { bg: [], doors: [], icons: [] };
  for (const child of children) {
    buckets[classify(child)].push(child);
  }

  const base = inputPath.replace(/\.svg$/, '');
  const outputs = {
    bg: `${base}_bg.svg`,
    doors: `${base}_doors.svg`,
    icons: `${base}_icons.svg`,
  };

  for (const key of ['bg', 'doors', 'icons']) {
    const out = wrapSvg(header, defsBlock, buckets[key]);
    fs.writeFileSync(outputs[key], out);
    console.log(`✓ ${key}: 요소 ${buckets[key].length}개 → ${outputs[key]}`);
  }

  console.log(`\n총 top-level 자식 ${children.length}개 분류 완료 (bg ${buckets.bg.length} / doors ${buckets.doors.length} / icons ${buckets.icons.length})`);
}

main();