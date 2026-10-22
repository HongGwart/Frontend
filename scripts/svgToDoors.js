#!/usr/bin/env node
/**
 *
 * 문 전용 SVG(splitVisualLayers.js가 만든 *_doors.svg)를 읽어서 "door" 계열 top-level 그룹을 문 데이터(JSON)로 뽑아낸다.
 *
 * Figma의 문은 전부 같은 모양(반지름 16인 여닫이 문)을 돌리거나 뒤집어서 놓은 것이라, 층마다 문 SVG를 통째로
 * 앱에 넣는 대신 "기준 문 하나를 어디에 어떻게 놓는지"만 기록한다. 앱은 공용 문 도형(FloorDoors) 하나를 이 값으로
 * 옮겨 그린다 — 계단·엘리베이터 아이콘(svgToIcons.js)과 같은 방식.
 *
 * 기준 문(로컬 좌표): 경첩 (0,0), 닫힌 문 끝 (-16,0) — 벽 위, 열린 문 끝 (0,-16).
 *   - 문짝 선: 경첩 → 열린 문 끝,  호: 열린 문 끝 → 닫힌 문 끝,  안쪽은 흰색 부채꼴
 *   - 벽 틈: 경첩과 닫힌 문 끝 사이 벽선을 흰 사각형으로 지우고, 양 끝에 벽색 1px 마감
 *
 * 사용법:
 *   node svgToDoors.js <입력_doors.svg> [출력.json]
 *
 * 출력.json이 이미 있으면(svgToRoomShapes.js가 만든 방 JSON) "doors" 필드만 덮어쓴다.
 *
 * 결과 데이터 구조:
 *   { "m": [a, b, c, d, e, f] }               // 기준 문 → 원본 SVG 좌표 affine 변환 (SVG matrix 순서)
 *   { "m": [...], "kind": "opening" }          // 문짝·호 없이 벽 틈만 있는 출입구 (드물다)
 */

const fs = require('fs');
const path = require('path');

const DOOR_RADIUS = 16;
const round = (value) => Math.round(value * 1000) / 1000;

/** 태그 문자열에서 attr="value" 쌍을 전부 뽑아낸다 */
function parseAttrs(tag) {
  const attrs = {};
  for (const m of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[m[1]] = m[2];
  return attrs;
}

/** transform 속성 → 점 변환 함수 (matrix / rotate / 없음) */
function makeTransformFn(transformValue) {
  if (!transformValue) return ([x, y]) => [x, y];
  let m = transformValue.match(/matrix\(([^)]*)\)/);
  if (m) {
    const [a, b, c, d, e, f] = m[1].trim().split(/[ ,]+/).map(Number);
    return ([x, y]) => [a * x + c * y + e, b * x + d * y + f];
  }
  m = transformValue.match(/rotate\(\s*([-\d.e]+)(?:[ ,]+([-\d.e]+)[ ,]+([-\d.e]+))?\s*\)/);
  if (m) {
    const angle = (Number(m[1]) * Math.PI) / 180;
    const cx = Number(m[2] || 0);
    const cy = Number(m[3] || 0);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return ([x, y]) => [cx + (x - cx) * cos - (y - cy) * sin, cy + (x - cx) * sin + (y - cy) * cos];
  }
  return null;
}

/** 절대 좌표 path(M/L/H/V/C/Z)를 직선·곡선 구간 목록으로 */
function pathSegments(d) {
  const segments = [];
  let command = '';
  let current = [0, 0];
  let start = [0, 0];
  let numbers = [];
  const flush = () => {
    if (command === 'M' && numbers.length >= 2) {
      current = start = numbers.slice(0, 2);
    } else if (command === 'L' && numbers.length >= 2) {
      segments.push({ type: 'line', from: current, to: numbers.slice(0, 2) });
      current = numbers.slice(0, 2);
    } else if (command === 'H' && numbers.length >= 1) {
      const to = [numbers[0], current[1]];
      segments.push({ type: 'line', from: current, to });
      current = to;
    } else if (command === 'V' && numbers.length >= 1) {
      const to = [current[0], numbers[0]];
      segments.push({ type: 'line', from: current, to });
      current = to;
    } else if (command === 'C' && numbers.length >= 6) {
      segments.push({ type: 'arc', from: current, to: numbers.slice(4, 6) });
      current = numbers.slice(4, 6);
    } else if (command === 'Z') {
      if (Math.hypot(current[0] - start[0], current[1] - start[1]) > 0.01) {
        segments.push({ type: 'line', from: current, to: start });
      }
      current = start;
    } else {
      return false;
    }
    return true;
  };
  for (const token of d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? []) {
    if (/[A-Za-z]/.test(token)) {
      if (command && !flush()) return null;
      command = token.toUpperCase();
      numbers = [];
    } else {
      numbers.push(Number(token));
    }
  }
  if (command && !flush()) return null;
  return segments;
}

const samePoint = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.05;

/**
 * 문 그룹에서 경첩·닫힌 끝·열린 끝을 찾는다.
 * 테두리 path(stroke)는 "문짝 선 + 호"라 직선과 곡선이 만나는 점이 열린 끝, 직선의 다른 끝이 경첩이다.
 * 테두리가 없는 문은 흰 부채꼴(fill)에서 경첩(곡선에 안 닿는 꼭짓점)을 찾고, 벽 틈(흰 사각형)에 가까운 쪽을 닫힌 끝으로 본다.
 */
function doorPoints(inner) {
  const paths = [...inner.matchAll(/<path\b[^>]*>/g)].map((m) => parseAttrs(m[0]));
  const strokePath = paths.find((attrs) => attrs.stroke);
  if (strokePath) {
    const segments = pathSegments(strokePath.d);
    const line = segments?.find((s) => s.type === 'line');
    const arc = segments?.find((s) => s.type === 'arc');
    if (!line || !arc) return null;
    const leaf = [line.from, line.to].find((p) => samePoint(p, arc.from) || samePoint(p, arc.to));
    if (!leaf) return null;
    const hinge = samePoint(line.from, leaf) ? line.to : line.from;
    const closed = samePoint(arc.from, leaf) ? arc.to : arc.from;
    return { hinge, closed, leaf, kind: 'door' };
  }

  const fillPath = paths.find((attrs) => attrs.fill === 'white');
  const gapCenter = whiteRectCenter(inner);
  if (!fillPath || !gapCenter) return null;
  const arc = pathSegments(fillPath.d)?.find((s) => s.type === 'arc');
  if (!arc) return null;
  const hinge = pathSegments(fillPath.d)
    .flatMap((s) => [s.from, s.to])
    .find((p) => !samePoint(p, arc.from) && !samePoint(p, arc.to));
  if (!hinge) return null;
  const distance = (p) => Math.hypot(p[0] - gapCenter[0], p[1] - gapCenter[1]);
  const [closed, leaf] = distance(arc.from) < distance(arc.to) ? [arc.from, arc.to] : [arc.to, arc.from];
  return { hinge, closed, leaf, kind: 'opening' };
}

/** 벽 틈을 지우는 흰 사각형(15×0.5)의 중심 (원본 좌표) */
function whiteRectCenter(inner) {
  const rect = [...inner.matchAll(/<rect\b[^>]*>/g)].map((m) => parseAttrs(m[0])).find((a) => a.fill === 'white');
  if (!rect) return null;
  const transform = makeTransformFn(rect.transform);
  if (!transform) return null;
  const x = Number(rect.x || 0) + Number(rect.width) / 2;
  const y = Number(rect.y || 0) + Number(rect.height) / 2;
  return transform([x, y]);
}

/** 경첩·닫힌 끝·열린 끝 → 기준 문을 그 자리에 놓는 affine. 로컬 x축 = 닫힌 끝→경첩, y축 = 열린 끝→경첩 방향. */
function toMatrix({ hinge, closed, leaf }) {
  const a = (hinge[0] - closed[0]) / DOOR_RADIUS;
  const b = (hinge[1] - closed[1]) / DOOR_RADIUS;
  const c = (hinge[0] - leaf[0]) / DOOR_RADIUS;
  const d = (hinge[1] - leaf[1]) / DOOR_RADIUS;
  return [a, b, c, d, hinge[0], hinge[1]].map(round);
}

/** 흰 사각형 하나로만 된 벽 틈(문짝·부채꼴 없음)은 사각형 변환으로 바로 놓는다. 기준 문의 벽 틈은 x -15.5 ~ -0.5. */
function gapOnlyMatrix(inner) {
  const rect = [...inner.matchAll(/<rect\b[^>]*>/g)].map((m) => parseAttrs(m[0])).find((a) => a.fill === 'white');
  if (!rect || Number(rect.width) !== 15) return null;
  const transform = makeTransformFn(rect.transform);
  if (!transform) return null;
  const origin = transform([Number(rect.x || 0), Number(rect.y || 0)]);
  const unitX = transform([Number(rect.x || 0) + 1, Number(rect.y || 0)]);
  const unitY = transform([Number(rect.x || 0), Number(rect.y || 0) + 1]);
  const [a, b] = [unitX[0] - origin[0], unitX[1] - origin[1]];
  const [c, d] = [unitY[0] - origin[0], unitY[1] - origin[1]];
  return [a, b, c, d, origin[0] + 15.5 * a, origin[1] + 15.5 * b].map(round);
}

function extractDoors(svgText) {
  const doors = [];
  for (const [, id, inner] of svgText.matchAll(/<g id="(door[^"]*)"[^>]*>([\s\S]*?)<\/g>/g)) {
    const points = doorPoints(inner);
    if (points) {
      const radius = Math.hypot(points.hinge[0] - points.closed[0], points.hinge[1] - points.closed[1]);
      if (Math.abs(radius - DOOR_RADIUS) > 0.1) {
        console.warn(`[경고] ${id}: 문 반지름이 ${radius.toFixed(2)}라 기준 문(16)과 달라 건너뜀`);
        continue;
      }
      doors.push(points.kind === 'door' ? { m: toMatrix(points) } : { m: toMatrix(points), kind: 'opening' });
      continue;
    }
    const gap = gapOnlyMatrix(inner);
    if (gap) {
      doors.push({ m: gap, kind: 'opening' });
      continue;
    }
    // 벽색 마감 사각형만 있는 그룹은 벽선 위에 같은 색이 겹친 것뿐이라 화면에 차이가 없다.
    if (!/fill="white"/.test(inner)) continue;
    console.warn(`[경고] ${id}: 문 모양을 해석하지 못해 건너뜀`);
  }
  return doors;
}

function main() {
  const [inputPath, outputArg] = process.argv.slice(2);
  if (!inputPath) {
    console.error('사용법: node svgToDoors.js <입력_doors.svg> [출력.json]');
    process.exit(1);
  }
  const outputPath = outputArg || inputPath.replace(/\.svg$/, '.doors.json');
  const doors = extractDoors(fs.readFileSync(inputPath, 'utf8'));

  const existing = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, 'utf8')) : null;
  if (existing) existing.doors = doors;
  // 문은 층마다 수십 개라 변환값 배열을 한 줄로 둔다(숫자마다 줄을 바꾸면 JSON이 몇 배로 길어진다).
  const json = JSON.stringify(existing ?? doors, null, 2).replace(
    /"m": \[([^\]]*)\]/g,
    (_, numbers) => `"m": [${numbers.trim().split(/\s*,\s*/).join(', ')}]`
  );
  fs.writeFileSync(outputPath, json);
  const openings = doors.filter((door) => door.kind === 'opening').length;
  console.log(`✓ 문 ${doors.length}개 추출 완료${openings ? ` (벽 틈만 있는 출입구 ${openings}개)` : ''} → ${path.relative(process.cwd(), outputPath)}`);
}

if (require.main === module) main();

module.exports = { extractDoors };
