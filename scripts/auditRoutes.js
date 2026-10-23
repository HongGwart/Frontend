#!/usr/bin/env node
/**
 * 길찾기 경로 검사. dev 서버(GET /api/route)에 실제 경로를 요청하고, 앱의 toRouteView로 바꾼 경로 카드 구간 목록에
 * "→만 남은 줄", "건물 밖 → 건물 밖", "구간 거리 합 ≠ 총거리" 같은 문제가 있는지 찾는다.
 *
 * 서버가 경로를 요청마다 실시간으로 계산해서 한 번에 몰아 보내지 않는다. 하루 한도(기본 50건, 2초 간격)만큼 돌리고
 * 멈추며, 어디까지 했는지는 scripts/routeAudit/state.json에 남겨 다음 실행이 이어서 한다. 요청 한 건이 세 모드
 * (최단/실내 위주/계단 회피) 경로를 다 돌려줘서 경로는 그 3배를 본다.
 *
 * 사용법:
 *   node scripts/auditRoutes.js               # 오늘 분(50건) 실행 후 누적 결과 요약
 *   node scripts/auditRoutes.js --limit 20    # 한도 지정
 *   node scripts/auditRoutes.js --report      # 요청 없이 누적 결과만 다시 출력
 *   node scripts/auditRoutes.js --reinspect   # 요청 없이 저장해 둔 응답(routeAudit/responses/)을 지금 앱 코드로 다시 검사
 *   node scripts/auditRoutes.js --recheck     # 문제가 나왔던 경로만 서버에 다시 요청(서버가 고친 뒤 확인용, 한도 적용)
 *
 * 테스트 순서(scripts/routeAudit/places.json의 장소로 만든다. 장소 목록은 자동완성으로 모은 것):
 *   1. building   건물 ↔ 건물 전체 조합
 *   2. same-bldg  같은 건물의 최저층 호실 ↔ 최고층 호실
 *   3. room       다른 건물 호실 ↔ 호실 (건물 쌍마다 하나)
 *
 * 검사 항목:
 *   - http-error          서버 에러 응답·네트워크 실패
 *   - no-route            경로를 못 찾음(status ≠ ROUTES_FOUND 또는 routes 비어 있음)
 *   - unrenderable        toRouteView가 null (경로선 2점 미만)
 *   - no-steps            구간 목록이 비어 있음
 *   - empty-label         구간 출발/도착 이름이 빔 (화면에 "→"만 남음)
 *   - unknown-floor       층 정보를 몰라서 "계단으로 층 이동" 문구로 대체됨
 *   - same-from-to        구간 출발 = 도착 ("건물 밖 → 건물 밖", "L동 4층 → 4층")
 *   - distance-mismatch   구간 거리 합과 서버 총거리 차이가 반올림 오차(구간당 0.5m, 최소 2m)보다 큼
 *   - indoor-exit         실내 공용 통로로 나가는 EXIT_BUILDING(context.indoor=true)인데 화면엔 "건물 밖"으로 나옴
 *   - stairs-in-avoidance 계단 회피 경로에 계단(실내 계단 구간 또는 야외 계단 포함)
 *   - unknown-step-type   toRouteView가 따로 처리하지 않는 step 종류
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(__dirname, 'routeAudit');
const STATE_FILE = path.join(DIR, 'state.json');
// 응답 원본. 앱 코드를 고친 뒤 서버에 다시 묻지 않고 --reinspect로 재검사할 때 쓴다(용량이 커서 커밋하지 않는다).
const RESPONSES_DIR = path.join(DIR, 'responses');
const PLACES = JSON.parse(fs.readFileSync(path.join(DIR, 'places.json'), 'utf8'));
const API = 'https://dev-api.honggwart.com';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const LIMIT = Number(args[args.indexOf('--limit') + 1]) || 50;
const DELAY_MS = 2000;

const KNOWN_STEP_TYPES = new Set([
  'DEPART', 'WALK', 'TURN_LEFT', 'TURN_RIGHT', 'EXIT_BUILDING', 'ENTER_BUILDING', 'FLOOR_CHANGE', 'ARRIVE',
]);

// 앱 코드(toRouteView.ts)를 그대로 쓰려고 TS를 CommonJS로 바꿔 불러온다. 경로 별칭은 이 파일이 쓰는 것만 푼다.
function loadToRouteView() {
  const compile = (file) =>
    ts.transpileModule(fs.readFileSync(path.join(ROOT, file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
  const load = (code, deps) => {
    const module = { exports: {} };
    new Function('require', 'module', 'exports', code)((name) => deps[name], module, module.exports);
    return module.exports;
  };
  const routePath = load(compile('src/utils/routePath.ts'), {});
  return load(compile('src/api/route/toRouteView.ts'), { '@utils/routePath': routePath }).toRouteView;
}

/** 장소 목록 → 테스트할 [출발, 도착] 목록. 순서가 고정이라 state.json의 진행 위치가 그대로 이어진다. */
function buildCases() {
  const codes = Object.keys(PLACES).filter((code) => PLACES[code].building);
  const cases = [];
  for (const a of codes)
    for (const b of codes)
      if (a !== b) cases.push({ group: 'building', from: place(a), to: place(b) });

  const floorOf = (name) => {
    const number = name.match(/동 (B?)(\d+)/);
    if (!number) return 0;
    const floor = Math.floor(Number(number[2]) / 100);
    return number[1] ? -floor : floor;
  };
  for (const code of codes) {
    const rooms = [...PLACES[code].rooms].sort((x, y) => floorOf(x.name) - floorOf(y.name));
    if (rooms.length < 2 || floorOf(rooms[0].name) === floorOf(rooms[rooms.length - 1].name)) continue;
    const low = rooms[0];
    const high = rooms[rooms.length - 1];
    cases.push({ group: 'same-bldg', from: low, to: high }, { group: 'same-bldg', from: high, to: low });
  }

  const withRooms = codes.filter((code) => PLACES[code].rooms.length);
  withRooms.forEach((a, i) =>
    withRooms.forEach((b, j) => {
      if (a === b) return;
      // 건물 쌍마다 다른 호실이 골고루 뽑히게 순번으로 고른다.
      const pick = (code, n) => PLACES[code].rooms[n % PLACES[code].rooms.length];
      cases.push({ group: 'room', from: pick(a, i * 7 + j), to: pick(b, j * 11 + i) });
    })
  );
  return cases.map((c) => ({ ...c, key: `${c.from.nodeId}->${c.to.nodeId}` }));

  function place(code) {
    return { nodeId: PLACES[code].building, name: `${code}동` };
  }
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { done: {}, runs: [] };
  }
}

/** 응답 하나(세 모드)를 검사해서 문제 목록을 돌려준다. */
function inspect(body, toRouteView) {
  const problems = [];
  const add = (mode, type, detail) => problems.push({ mode, type, detail });
  if (body.status !== 'ROUTES_FOUND' || !body.routes?.length) {
    add('-', 'no-route', body.status ?? JSON.stringify(body.error ?? body).slice(0, 120));
    return problems;
  }
  for (const route of body.routes) {
    const mode = route.mode;
    const unknownTypes = [...new Set((route.steps ?? []).map((s) => s.type).filter((t) => !KNOWN_STEP_TYPES.has(t)))];
    if (unknownTypes.length) add(mode, 'unknown-step-type', unknownTypes.join(', '));
    for (const step of route.steps ?? [])
      if (step.type === 'EXIT_BUILDING' && step.context?.indoor) add(mode, 'indoor-exit', step.instruction ?? '');

    const view = toRouteView(route);
    if (!view) {
      add(mode, 'unrenderable', `polyline ${route.polyline?.length ?? 0}점`);
      continue;
    }
    const legs = view.result.steps;
    if (!legs.length) add(mode, 'no-steps', '');
    for (const leg of legs) {
      const text = `${leg.label}: ${leg.from}${leg.to ? ` → ${leg.to}` : ''}`;
      if (leg.from.endsWith('층 이동') && !leg.to) add(mode, 'unknown-floor', text);
      else if (!leg.from || !leg.to) add(mode, 'empty-label', text);
      // 층 이동은 "L동 4층 → 4층"처럼 도착 쪽에 건물 이름이 없어서 끝부분만 비교한다.
      const sameFloorChange = (leg.type === 'elevator' || leg.type === 'stairs') && leg.to && leg.from.endsWith(` ${leg.to}`);
      if (leg.from && leg.from === leg.to) add(mode, 'same-from-to', text);
      else if (sameFloorChange) add(mode, 'same-from-to', text);
    }
    const sum = legs.reduce((total, leg) => total + leg.distanceMeters, 0);
    const total = route.summary?.distanceMeters ?? 0;
    if (Math.abs(sum - total) > Math.max(2, legs.length * 0.5)) add(mode, 'distance-mismatch', `구간 합 ${sum}m, 총거리 ${Math.round(total)}m`);
    if (mode === 'STAIR_AVOIDANCE') {
      const stairs = legs.filter((leg) => leg.type === 'stairs' || leg.label.includes('계단'));
      if (stairs.length) add(mode, 'stairs-in-avoidance', stairs.map((leg) => `${leg.label}: ${leg.from} → ${leg.to}`).join(' / '));
    }
  }
  return problems;
}

async function fetchRoute(from, to) {
  try {
    const res = await fetch(`${API}/api/route?fromNodeId=${from}&toNodeId=${to}`);
    const body = await res.json().catch(() => ({}));
    // 경로가 없으면 404 ROUTE_NOT_FOUND로 온다 — 서버 에러가 아니라 "경로 없음"으로 본다.
    if (res.status === 404 && body.error?.code === 'ROUTE_NOT_FOUND') return { body: { status: 'ROUTE_NOT_FOUND' } };
    return res.ok ? { body } : { error: `HTTP ${res.status} ${JSON.stringify(body.error ?? body).slice(0, 120)}` };
  } catch (error) {
    return { error: String(error.message ?? error) };
  }
}

function report(state, cases) {
  const results = cases.map((c) => ({ ...c, result: state.done[c.key] })).filter((c) => c.result);
  const byType = {};
  for (const c of results)
    for (const p of c.result.problems) (byType[p.type] ??= []).push({ ...p, route: `${c.from.name} → ${c.to.name}`, key: c.key });

  const groups = ['building', 'same-bldg', 'room'].map((g) => {
    const all = cases.filter((c) => c.group === g).length;
    const done = results.filter((c) => c.group === g).length;
    return `${g} ${done}/${all}`;
  });
  console.log(`\n진행: ${results.length}/${cases.length}건 (${groups.join(', ')})`);
  const failed = results.filter((c) => c.result.problems.length).length;
  console.log(`문제 있는 요청: ${failed}건\n`);
  for (const [type, items] of Object.entries(byType).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`■ ${type} — ${items.length}건`);
    for (const item of items.slice(0, 8)) console.log(`   [${item.key}] ${item.route} (${item.mode}) ${item.detail}`);
    if (items.length > 8) console.log(`   … 외 ${items.length - 8}건`);
  }
}

(async () => {
  const cases = buildCases();
  const state = readState();
  if (flag('--report')) return report(state, cases);

  const toRouteView = loadToRouteView();
  const responseFile = (key) => path.join(RESPONSES_DIR, `${key.replace('->', '_')}.json`);
  if (flag('--reinspect')) {
    let count = 0;
    for (const c of cases) {
      if (!fs.existsSync(responseFile(c.key))) continue;
      state.done[c.key] = { ...state.done[c.key], problems: inspect(JSON.parse(fs.readFileSync(responseFile(c.key), 'utf8')), toRouteView) };
      count++;
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 1));
    console.log(`저장된 응답 ${count}건을 지금 코드로 다시 검사했어요.`);
    return report(state, cases);
  }
  const queue = flag('--recheck')
    ? cases.filter((c) => state.done[c.key]?.problems.length)
    : cases.filter((c) => !state.done[c.key]);
  const today = queue.slice(0, LIMIT);
  console.log(`오늘 ${today.length}건 요청 (남은 ${queue.length}건, ${DELAY_MS / 1000}초 간격)`);

  for (const [i, c] of today.entries()) {
    const { body, error } = await fetchRoute(c.from.nodeId, c.to.nodeId);
    if (body) {
      fs.mkdirSync(RESPONSES_DIR, { recursive: true });
      fs.writeFileSync(responseFile(c.key), JSON.stringify(body));
    }
    const problems = error ? [{ mode: '-', type: 'http-error', detail: error }] : inspect(body, toRouteView);
    state.done[c.key] = { at: new Date().toISOString(), problems };
    // 중간에 끊겨도 진행이 남게 매 요청마다 저장한다.
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 1));
    const mark = problems.length ? `✗ ${[...new Set(problems.map((p) => p.type))].join(', ')}` : '✓';
    console.log(`${String(i + 1).padStart(3)} ${c.group.padEnd(9)} ${c.from.name} → ${c.to.name}  ${mark}`);
    if (i < today.length - 1) await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  state.runs.push({ at: new Date().toISOString(), count: today.length, recheck: flag('--recheck') });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 1));
  report(state, cases);
})();
