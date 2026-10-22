#!/usr/bin/env node
/**
 * 평면도 데이터 검사. 원본 SVG(Visual에 그려진 번호 글자)와 층 JSON(Hitbox로 만든 방)을 비교해서,
 * 앱에서 "방이 없는데 번호가 뜬다", "번호가 틀리다", "글자가 겹친다", "눌러도 반응이 없다" 같은 문제가 될
 * 곳을 찾는다. processFloor.js가 층을 처리한 뒤 그 층에 대해 자동으로 돌린다.
 *
 * 사용법:
 *   node scripts/auditFloors.js             # 전 층
 *   node scripts/auditFloors.js L_3 C_7     # 지정한 층만 (층 키 또는 원본 SVG 경로)
 *   node scripts/auditFloors.js --json      # 사람이 읽는 출력 대신 JSON
 *
 * 경고를 찾았다고 실패하지는 않는다(종료 코드 0). 이미 알고 있는 경고는 docs/floor-plans/known-issues.md에 적혀 있다.
 *
 * 검사 항목:
 *   - name-mismatch        히트박스 이름 ≠ 그 방 안에 그려진 번호 (다른 층 히트박스를 복사했거나 오타)
 *   - label-without-hitbox 번호는 그려져 있는데 히트박스가 없음 (눌러도 반응 없음)
 *   - hitbox-without-label 히트박스는 있는데 그려진 번호가 없음 (도면에 번호를 빠뜨렸거나 엉뚱한 자리의 히트박스)
 *   - hitbox-overlap       히트박스끼리 겹침 (겹친 곳을 누르면 엉뚱한 방이 잡힘)
 *   - split-room-far-apart 같은 이름 조각이 멀리 떨어짐 (다른 방에 같은 번호를 붙였을 가능성)
 *   - bg-text-label        배경 SVG에 글자 이름이 남아 앱 라벨과 겹침 (stripLabelPaths.js --rooms 누락)
 *   - floor-number-mismatch 층과 번호가 안 맞음 (예: 1층에 2xx)
 *
 * Figma 번호 레이어 이름은 실제 글자와 다를 때가 많다("106", "106_29"처럼 복사한 이름). 그래서 "_숫자" 꼬리가
 * 붙었거나 층이 안 맞는 이름은 실제 글자로 믿지 않고 이름 비교에서 뺀다.
 */

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.join(__dirname, '..');
const FLOORS_DIR = path.join(ROOT, 'src/assets/svgs/floors');
const HOSTED_FLOORS = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/constant/hostedFloors.json'), 'utf8'));

// Figma가 한글 id를 UTF-8 바이트 단위 문자 참조(&#234;&#179;...)로 내보내서 풀어서 비교한다.
const decode = (id) =>
  id.replace(/(?:&#\d+;)+/g, (run) =>
    Buffer.from([...run.matchAll(/&#(\d+);/g)].map((m) => Number(m[1]))).toString('utf8')
  );
const normalize = (name) => decode(name).replace(/_\d+$/, '').replace(/\s+/g, '');
const NUMERIC_LABEL = /^[A-Za-z]?\d+(?:-\d+)?(?:_\d+)?$/;

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const polygonArea = (points) =>
  Math.abs(points.reduce((sum, [x, y], i) => {
    const [x2, y2] = points[(i + 1) % points.length];
    return sum + x * y2 - x2 * y;
  }, 0)) / 2;
const boundsOf = (points) => {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};

/** 층 키("R_B3") → 이 층 방 번호가 시작해야 하는 글자("B3"). 층 키 모양이 다르면(R_L) null. */
function expectedFloorPrefix(floorId) {
  const m = floorId.match(/_(B)?(\d+)$/);
  return m ? `${m[1] ? 'B' : ''}${m[2]}` : null;
}

/**
 * 번호가 이 층 번호로 시작하는지. 동 글자("H317"), 다른 동 접두("J101"), 0으로 시작하는 지하 번호 체계
 * ("0105", "018")는 판단하지 않는다(true).
 */
function matchesFloor(label, building, expected) {
  if (!expected || !/^[A-Z]*\d{3,}/.test(label) || /^0/.test(label)) return true;
  let body = label;
  if (body.startsWith(building) && /\d/.test(body[building.length] ?? '')) body = body.slice(building.length);
  if (/^[A-Z]/.test(body) && !/^B\d/.test(body)) return true;
  return body.startsWith(expected);
}

/** 다른 동이 함께 그려진 부분(hostedFloors.json) 안의 방인지. 그 방은 다른 동 층 번호를 쓴다. */
function inHostedArea(floorId, points) {
  return Object.values(HOSTED_FLOORS).some(
    (hosted) =>
      hosted.floorId === floorId &&
      points.every(([, y]) => (hosted.minY === undefined || y >= hosted.minY) && (hosted.maxY === undefined || y <= hosted.maxY))
  );
}

function visualPart(svg) {
  const start = svg.indexOf('<g id="Visual"');
  const hitbox = svg.indexOf('<g id="Hitbox"');
  if (start < 0) return svg;
  return hitbox > start ? svg.slice(start, hitbox) : svg.slice(start);
}

function auditFloor(floorId, dir) {
  const svg = fs.readFileSync(path.join(dir, `${floorId}.svg`), 'utf8');
  const data = JSON.parse(fs.readFileSync(path.join(dir, `${floorId}.json`), 'utf8'));
  const bgPath = path.join(dir, `${floorId}_bg.svg`);
  const bg = fs.existsSync(bgPath) ? fs.readFileSync(bgPath, 'utf8') : '';
  const viewBox = (svg.match(/viewBox="([^"]+)"/) || [])[1];
  const building = floorId.replace(/_[^_]+$/, '');
  const expected = expectedFloorPrefix(floorId);
  const rooms = data.rooms.map((room) => ({ id: room.id, label: room.label ?? room.id, points: room.points }));
  const roomNames = new Set(rooms.map((room) => normalize(room.label)).filter(Boolean));
  const issues = [];
  const add = (type, message) => issues.push({ type, message });

  // 원본 Visual에 그려진 번호 글자: 숫자형 id 또는 방 이름과 같은 id인 path 하나가 글자 한 덩어리다.
  const labelPaths = [...visualPart(svg).matchAll(/<path id="([^"]+)"[^>]*?\/>/g)];
  // "106"을 복사해 "106_2", "106_3"…을 만든 층이면 원본 "106"도 복사용 이름이다.
  const copiedBases = new Set(
    labelPaths.map((m) => decode(m[1]).match(/^(.+)_\d+$/)?.[1]).filter(Boolean)
  );
  const drawn = [];
  for (const m of labelPaths) {
    const id = decode(m[1]);
    if (!NUMERIC_LABEL.test(id) && !roomNames.has(normalize(id))) continue;
    const box = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${m[0]}</svg>`).getBBox();
    if (!box) continue;
    // "_숫자" 꼬리, 복사 원본, 층이 안 맞는 이름은 Figma가 복사한 레이어 이름일 가능성이 커서 글자로 믿지 않는다.
    const trusted = !/_\d+$/.test(id) && !copiedBases.has(id) && matchesFloor(id, building, expected);
    drawn.push({ id, name: normalize(id), trusted, x: box.x + box.width / 2, y: box.y + box.height / 2 });
  }

  const drawnInRoom = new Map(rooms.map((room) => [room, []]));
  for (const label of drawn) {
    const hits = rooms.filter((room) => pointInPolygon(label.x, label.y, room.points));
    if (hits.length === 0) {
      add('label-without-hitbox', `번호 "${label.id}"가 그려져 있는데 히트박스가 없음 (도면 좌표 ${Math.round(label.x)}, ${Math.round(label.y)})`);
    }
    hits.forEach((room) => drawnInRoom.get(room).push(label));
  }
  for (const [room, labels] of drawnInRoom) {
    if (labels.length === 0) {
      if (room.label) add('hitbox-without-label', `히트박스 "${room.label}" 안에 그려진 번호가 없음`);
      continue;
    }
    const own = normalize(room.label);
    const trusted = labels.filter((label) => label.trusted);
    const same = (name) => name === own || name.replace(/^[A-Z]/, '') === own || own.replace(/^[A-Z]/, '') === name;
    if (room.label && trusted.length > 0 && !labels.some((label) => same(label.name))) {
      add('name-mismatch', `히트박스 "${room.label}" ↔ 도면 번호 "${[...new Set(trusted.map((l) => l.id))].join(', ')}"`);
    }
  }

  // 히트박스끼리 겹침: 겹친 넓이가 작은 쪽의 3%를 넘으면 (격자 표본으로 어림)
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i];
      const b = rooms[j];
      const [ax1, ay1, ax2, ay2] = boundsOf(a.points);
      const [bx1, by1, bx2, by2] = boundsOf(b.points);
      const x1 = Math.max(ax1, bx1), y1 = Math.max(ay1, by1), x2 = Math.min(ax2, bx2), y2 = Math.min(ay2, by2);
      if (x2 <= x1 || y2 <= y1) continue;
      const step = Math.max(2, Math.min(x2 - x1, y2 - y1) / 30);
      let both = 0;
      for (let x = x1 + step / 2; x < x2; x += step) {
        for (let y = y1 + step / 2; y < y2; y += step) {
          if (pointInPolygon(x, y, a.points) && pointInPolygon(x, y, b.points)) both++;
        }
      }
      const ratio = (both * step * step) / Math.min(polygonArea(a.points), polygonArea(b.points));
      if (ratio > 0.03) add('hitbox-overlap', `히트박스 "${a.id}"와 "${b.id}"가 겹침 (작은 쪽의 ${Math.round(ratio * 100)}%)`);
    }
  }

  // 같은 이름 조각이 서로 닿지 않음
  const pieces = {};
  rooms.forEach((room) => (pieces[normalize(room.label)] = pieces[normalize(room.label)] || []).push(room));
  for (const [name, group] of Object.entries(pieces)) {
    if (!name || group.length < 2) continue;
    const boxes = group.map((room) => boundsOf(room.points));
    const touches = (a, b) => a[0] <= b[2] + 15 && b[0] <= a[2] + 15 && a[1] <= b[3] + 15 && b[1] <= a[3] + 15;
    const linked = new Set([0]);
    for (let grew = true; grew; ) {
      grew = false;
      boxes.forEach((box, i) => {
        if (!linked.has(i) && [...linked].some((j) => touches(boxes[j], box))) {
          linked.add(i);
          grew = true;
        }
      });
    }
    if (linked.size < boxes.length) add('split-room-far-apart', `"${name}" 조각(${group.map((r) => r.id).join(', ')})이 서로 떨어져 있음`);
  }

  // 배경에 남은 글자 이름
  for (const m of bg.matchAll(/<path id="([^"]+)"/g)) {
    const id = decode(m[1]);
    if (roomNames.has(normalize(id)) && !NUMERIC_LABEL.test(id)) add('bg-text-label', `배경 SVG에 글자 이름 "${id}"가 남아 앱 라벨과 겹침`);
  }

  // 층과 번호
  const odd = rooms
    .filter((room) => !inHostedArea(floorId, room.points))
    .map((room) => room.label)
    .filter((label) => !matchesFloor(label, building, expected));
  if (odd.length) add('floor-number-mismatch', `${expected}층인데 번호가 다름: ${[...new Set(odd)].join(', ')}`);

  return { floorId, rooms: rooms.length, drawn: drawn.length, issues };
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const requested = args.filter((arg) => !arg.startsWith('--'));
  const targets =
    requested.length > 0
      ? requested.map((arg) =>
          arg.endsWith('.svg')
            ? { floorId: path.basename(arg, '.svg'), dir: path.dirname(path.resolve(arg)) }
            : { floorId: arg, dir: FLOORS_DIR }
        )
      : fs
          .readdirSync(FLOORS_DIR)
          .filter((file) => /^[A-Z0-9]+_[A-Z0-9]+\.json$/.test(file))
          .map((file) => ({ floorId: file.replace('.json', ''), dir: FLOORS_DIR }));

  const reports = targets.map(({ floorId, dir }) => auditFloor(floorId, dir));
  if (asJson) {
    console.log(JSON.stringify(reports, null, 1));
    return;
  }
  const withIssues = reports.filter((report) => report.issues.length > 0);
  for (const report of withIssues) {
    console.log(`⚠ ${report.floorId} (방 ${report.rooms}개, 그려진 번호 ${report.drawn}개)`);
    report.issues.forEach((issue) => console.log(`   - [${issue.type}] ${issue.message}`));
  }
  console.log(
    withIssues.length === 0
      ? `✓ 평면도 검사: ${reports.length}개 층 이상 없음`
      : `\n평면도 검사: ${reports.length}개 층 중 ${withIssues.length}개 층에 경고 — 이미 아는 것은 docs/floor-plans/known-issues.md 참고`
  );
}

main();
