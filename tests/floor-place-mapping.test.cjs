const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { createMatcher, syncFloors } = require('../scripts/sync-floor-place-ids.cjs');

const id = '087a6e5c-4b50-4e64-8255-12aea1c06542';
const otherId = '886c0b62-4e0e-496b-8313-a105b259c770';
function fixture(building = 'C', floor = '5', number = '501') {
  return {
    diagnostics: {
      roomCandidates: [{
        building_node_id: 789, floor, room_number: number,
        node_ids: [820, 821], place_ids: [id], needs_review: false,
      }],
      crossFloorRoomCandidates: [], invalidMemberships: [],
    },
    places: [{
      placeId: id, kind: 'ROOM', status: 'ACTIVE', searchable: true, floor, roomNumber: number,
      entrances: [{ nodeId: 820, floor }, { nodeId: 821, floor }], accessFloors: [{ floor }],
      placeInfo: { placeId: id, building: { nodeId: 789, code: building }, floor, roomNumber: number },
    }],
  };
}

test('one verified place with multiple doors maps both explicitly labelled shape pieces', () => {
  const match = createMatcher(fixture());
  assert.equal(match('C_5', { id: '501' }).placeId, id);
  assert.equal(match('C_5', { id: '501_2', label: '501' }).placeId, id);
  assert.equal(match('C_5', { id: '501_2' }).placeId, null);
  assert.equal(match('C_5', { id: '501', label: '502' }).placeId, null);
});

test('building, floor, hyphens, leading zeros and basement prefixes remain distinct', () => {
  const match = createMatcher(fixture('R', 'L', 'B106'));
  assert.equal(match('R_L', { id: 'B106' }).placeId, id);
  for (const [floorId, roomId] of [['R_B1', 'B106'], ['C_L', 'B106'], ['R_L', '106'], ['R_L', 'B106-1']]) {
    assert.equal(match(floorId, { id: roomId }).placeId, null);
  }
  assert.equal(createMatcher(fixture('K', 'B1', '018'))('K_B1', { id: '18' }).placeId, null);
  assert.equal(createMatcher(fixture('L', '5', '101'))('L_5', { id: 'J101' }).placeId, null);
  assert.equal(createMatcher(fixture())('C_5', { id: '501-1' }).placeId, null);
});

test('only verified H-building label convention permits H prefix removal', () => {
  assert.equal(createMatcher(fixture('H', '3', '314'))('H_3', { id: 'H314' }).placeId, id);
  assert.equal(createMatcher(fixture('B', 'B1', '101'))('B_B1', { id: 'B101' }).placeId, null);
});

test('different UUIDs and partially unmapped server groups never auto-select', () => {
  const catalog = fixture();
  catalog.places.push({ ...structuredClone(catalog.places[0]), placeId: otherId });
  catalog.diagnostics.roomCandidates[0].place_ids.push(otherId);
  assert.equal(createMatcher(catalog)('C_5', { id: '501' }).reason, 'server_mapping_needs_review');
  catalog.diagnostics.roomCandidates[0].place_ids = [id, null];
  assert.equal(createMatcher(catalog)('C_5', { id: '501' }).placeId, null);
});

test('cross-floor memberships and differing public location block a match', () => {
  const catalog = fixture();
  catalog.diagnostics.crossFloorRoomCandidates = [{ place_ids: [id] }];
  assert.equal(createMatcher(catalog)('C_5', { id: '501' }).reason, 'cross_floor_membership');
  catalog.diagnostics.crossFloorRoomCandidates = [];
  catalog.places[0].placeInfo.floor = '6';
  assert.equal(createMatcher(catalog)('C_5', { id: '501' }).reason, 'detail_location_mismatch');
  catalog.places[0].placeInfo.floor = '5';
  catalog.places[0].entrances[1].floor = '6';
  assert.equal(createMatcher(catalog)('C_5', { id: '501' }).reason, 'cross_floor_membership');
});

test('inactive places, missing doors and incomplete catalogues cannot produce a mapping', () => {
  const catalog = fixture();
  catalog.places[0].status = 'ARCHIVED';
  assert.equal(createMatcher(catalog)('C_5', { id: '501' }).placeId, null);
  catalog.places[0].status = 'ACTIVE';
  catalog.places[0].entrances.pop();
  assert.equal(createMatcher(catalog)('C_5', { id: '501' }).reason, 'entrance_membership_mismatch');
  catalog.places = [];
  catalog.buildings = [{ nodeId: 789, code: 'C' }];
  assert.throws(() => createMatcher(catalog), /incomplete catalogue/);
});

test('dry-run preserves files; write changes only placeId and is idempotent', () => {
  const directory = mkdtempSync(join(tmpdir(), 'floor-place-mapping-'));
  try {
    const file = join(directory, 'C_5.json');
    const data = { floorId: 'C_5', width: 42, rooms: [
      { id: '501', placeId: null, points: [[1, 2], [3, 4]], path: 'M1,2 L3,4 Z' },
      { id: '502', placeId: otherId, labelAnchor: [5, 6] },
    ] };
    writeFileSync(file, JSON.stringify(data, null, 2));
    assert.equal(syncFloors(fixture(), directory).changedFiles, 1);
    assert.deepEqual(JSON.parse(readFileSync(file)), data);
    const { report } = syncFloors(fixture(), directory, true);
    const expected = structuredClone(data);
    expected.rooms[0].placeId = id;
    expected.rooms[1].placeId = null;
    assert.deepEqual(JSON.parse(readFileSync(file)), expected);
    assert.equal(report.totals.mapped, 1);
    assert.equal(report.totals.unresolved, 1);
    assert.equal(syncFloors(fixture(), directory).changedFiles, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
