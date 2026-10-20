const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const script = path.resolve(__dirname, '../scripts/svgToRoomShapes.js');
const PLACE = '1c0f787e-3380-4240-8474-f3ca97700f75';
const OTHER_PLACE = 'f7c5b29f-2638-4190-a35d-3aa3de674b10';

function fixture(t, rooms = [{ id: '501', x: 10 }]) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'honggwart-floor-regeneration-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const svgPath = path.join(dir, 'T_5.svg');
  const jsonPath = path.join(dir, 'T_5.json');
  const writeSvg = (shapes) => writeFileSync(svgPath,
    `<svg width="100" height="100"><g id="Visual"></g><g id="Hitbox">` +
    shapes.map(({ id, x = 10 }) =>
      `<rect id="room_${id}" x="${x}" y="10" width="20" height="30"/>`).join('') +
    `</g></svg>`);
  const read = () => JSON.parse(readFileSync(jsonPath, 'utf8'));
  const run = () => {
    const result = spawnSync(process.execPath, [script, svgPath, jsonPath], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return { data: read(), log: result.stdout + result.stderr };
  };
  const update = (change) => {
    const data = read();
    change(data);
    writeFileSync(jsonPath, JSON.stringify(data));
  };
  writeSvg(rooms);
  run();
  return { run, writeSvg, update };
}

test('identical raw shape preserves UUID and node ID; unmapped shapes stay unmapped', t => {
  const f = fixture(t, [{ id: '501', x: 10 }, { id: '502', x: 40 }]);
  f.update(data => Object.assign(data.rooms[0], { placeId: PLACE, nodeId: 635, labelAnchor: [12, 13] }));
  const { data } = f.run();
  assert.equal(data.rooms[0].placeId, PLACE);
  assert.equal(data.rooms[0].nodeId, 635);
  assert.deepEqual(data.rooms[0].labelAnchor, [12, 13]);
  assert.equal(data.rooms[1].placeId, null);
  assert.equal(data.rooms[1].nodeId, undefined);
});

test('verified numeric-only identity is preserved independently of a UUID', t => {
  const f = fixture(t);
  f.update(data => { data.rooms[0].nodeId = 635; });
  const { data } = f.run();
  assert.equal(data.rooms[0].placeId, null);
  assert.equal(data.rooms[0].nodeId, 635);
});

test('changed points clear both identifiers and warn', t => {
  const f = fixture(t);
  f.update(data => Object.assign(data.rooms[0], { placeId: PLACE, nodeId: 635 }));
  f.writeSvg([{ id: '501', x: 11 }]);
  const { data, log } = f.run();
  assert.equal(data.rooms[0].placeId, null);
  assert.equal(data.rooms[0].nodeId, undefined);
  assert.match(log, /points 변경/);
});

test('manual label overrides do not transfer identity to the generated label', t => {
  const f = fixture(t, [{ id: '105-6', x: 10 }, { id: '105-6_2', x: 40 }]);
  f.update(data => Object.assign(data.rooms[1], { label: '105-8', placeId: PLACE, nodeId: 635 }));
  const { data, log } = f.run();
  assert.equal(data.rooms[1].label, '105-6');
  assert.equal(data.rooms[1].placeId, null);
  assert.equal(data.rooms[1].nodeId, undefined);
  assert.match(log, /표시 라벨 변경/);
});

test('legacy B-prefix carryover cannot attach a server identity to a different raw ID', t => {
  const f = fixture(t);
  f.update(data => Object.assign(data.rooms[0], { id: 'B501', placeId: PLACE, nodeId: 635 }));
  const { data, log } = f.run();
  assert.equal(data.rooms[0].id, 'B501');
  assert.equal(data.rooms[0].placeId, null);
  assert.equal(data.rooms[0].nodeId, undefined);
  assert.match(log, /원본 도형 id가 없거나 변경됨/);
});

test('same-label pieces preserve only their own exact verified mapping', t => {
  const f = fixture(t, [{ id: '501', x: 10 }, { id: '501_2', x: 40 }]);
  f.update(data => {
    data.rooms[0].placeId = PLACE;
    data.rooms[1].placeId = OTHER_PLACE;
  });
  const { data } = f.run();
  assert.equal(data.rooms[0].placeId, PLACE);
  assert.equal(data.rooms[1].placeId, OTHER_PLACE);
});

test('an exact raw ID is not renamed by a colliding B-prefix compatibility key', t => {
  const f = fixture(t);
  f.update(data => {
    data.rooms[0].placeId = PLACE;
    data.rooms.push({ ...data.rooms[0], id: 'B501', placeId: OTHER_PLACE });
  });
  const { data } = f.run();
  assert.equal(data.rooms[0].id, '501');
  assert.equal(data.rooms[0].placeId, PLACE);
});

test('duplicate generated IDs leave every ambiguous shape unmapped', t => {
  const f = fixture(t);
  f.update(data => { data.rooms[0].placeId = PLACE; });
  f.writeSvg([{ id: '501', x: 10 }, { id: '501', x: 10 }]);
  const { data, log } = f.run();
  assert.ok(data.rooms.every(room => room.placeId === null));
  assert.match(log, /도형 id 중복/);
});

test('duplicate previous IDs cannot choose one of conflicting UUIDs', t => {
  const f = fixture(t);
  f.update(data => {
    data.rooms[0].placeId = PLACE;
    data.rooms.push({ ...data.rooms[0], placeId: OTHER_PLACE });
  });
  const { data, log } = f.run();
  assert.equal(data.rooms[0].placeId, null);
  assert.match(log, /도형 id 중복/);
});

test('a different previous floor cannot transfer identity', t => {
  const f = fixture(t);
  f.update(data => {
    data.floorId = 'T_6';
    data.rooms[0].placeId = PLACE;
  });
  const { data, log } = f.run();
  assert.equal(data.rooms[0].placeId, null);
  assert.match(log, /층 식별자가 달라/);
});

test('malformed UUID or unsafe node ID is not propagated', t => {
  const f = fixture(t, [{ id: '501', x: 10 }, { id: '502', x: 40 }]);
  f.update(data => {
    data.rooms[0].placeId = 'not-a-uuid';
    Object.assign(data.rooms[1], { placeId: PLACE, nodeId: Number.MAX_SAFE_INTEGER + 1 });
  });
  const { data, log } = f.run();
  assert.ok(data.rooms.every(room => room.placeId === null && room.nodeId === undefined));
  assert.match(log, /잘못된 장소 UUID/);
  assert.match(log, /잘못된 노드 ID/);
});

test('removed mapped shapes produce a mapping warning', t => {
  const f = fixture(t, [{ id: '501', x: 10 }, { id: '502', x: 40 }]);
  f.update(data => { data.rooms[0].placeId = PLACE; });
  f.writeSvg([{ id: '502', x: 40 }]);
  const { data, log } = f.run();
  assert.deepEqual(data.rooms.map(room => room.id), ['502']);
  assert.equal(data.rooms[0].placeId, null);
  assert.match(log, /"501" 서버 매핑을 보존하지 않음/);
});
