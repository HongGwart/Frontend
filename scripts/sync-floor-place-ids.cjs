#!/usr/bin/env node
// Join floor-plan labels to a verified, read-only backend room catalogue.
// No substring search, numeric coercion, nearest-door matching or UUID creation.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const normalize = value => String(value ?? '').normalize('NFC').trim().toUpperCase();
const key = (building, floor, room) => JSON.stringify([normalize(building), normalize(floor), normalize(room)]);

function createMatcher(catalog) {
  const diagnostics = catalog.diagnostics;
  if (!Array.isArray(diagnostics?.roomCandidates) || !Array.isArray(catalog.places)) {
    throw new Error('A diagnostics snapshot and public place details are required.');
  }
  const buildings = new Map();
  const addBuilding = (nodeId, code) => {
    if (!Number.isSafeInteger(nodeId) || !normalize(code)) return;
    const previous = buildings.get(nodeId);
    if (previous && previous !== normalize(code)) throw new Error(`Conflicting building ${nodeId}`);
    buildings.set(nodeId, normalize(code));
  };
  for (const building of catalog.buildings ?? []) addBuilding(building.nodeId, building.code);
  for (const layer of catalog.layers ?? []) {
    addBuilding(layer.buildingNodeId, layer.buildingCode);
    for (const location of layer.locations ?? []) addBuilding(location.buildingNodeId, location.buildingCode);
  }
  const places = new Map();
  for (const place of catalog.places) {
    if (!uuid.test(place.placeId) || places.has(place.placeId)) throw new Error('Invalid/duplicate catalogue UUID');
    places.set(place.placeId, place);
    addBuilding(place.placeInfo?.building?.nodeId, place.placeInfo?.building?.code);
  }
  const groups = new Map();
  for (const group of diagnostics.roomCandidates) {
    const code = buildings.get(group.building_node_id);
    if (!code) throw new Error(`Unknown building ${group.building_node_id}`);
    const groupKey = key(code, group.floor, group.room_number);
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), group]);
    for (const id of group.place_ids.filter(Boolean)) {
      if (!places.has(id)) throw new Error(`Missing public detail for ${id}; incomplete catalogue`);
    }
  }
  const crossFloorIds = new Set((diagnostics.crossFloorRoomCandidates ?? [])
    .flatMap(group => group.place_ids).filter(Boolean));
  if ((diagnostics.invalidMemberships ?? []).length) {
    throw new Error('Server reports invalid memberships; resolve them before mapping.');
  }

  return (floorId, room) => {
    const separator = floorId.lastIndexOf('_');
    if (separator < 1) throw new Error(`Invalid floorId: ${floorId}`);
    const building = normalize(floorId.slice(0, separator));
    const floor = normalize(floorId.slice(separator + 1));
    const label = normalize(room.label ?? room.id);
    const labels = new Set([label]);
    // Existing H floor plans use H314 etc.; the server's roomNumber is 314.
    // Do not strip B (basement), J in L-building plans, hyphens or leading zeros.
    if (building === 'H' && /^H\d/.test(label)) labels.add(label.slice(1));
    const candidates = [...labels].flatMap(value => groups.get(key(building, floor, value)) ?? []);
    const candidatePlaceIds = [...new Set(candidates.flatMap(group => group.place_ids).filter(Boolean))].sort();
    const fail = reason => ({ placeId: null, reason, candidatePlaceIds });
    if (!candidates.length) return fail('server_room_not_found');
    if (candidates.length !== 1) return fail('multiple_server_room_groups');
    const group = candidates[0];
    if (group.needs_review || candidatePlaceIds.length > 1) return fail('server_mapping_needs_review');
    if (!candidatePlaceIds.length || group.place_ids.some(id => !id)) return fail('server_place_unmapped');
    const placeId = candidatePlaceIds[0];
    const detail = places.get(placeId);
    const info = detail.placeInfo;
    if (crossFloorIds.has(placeId)
      || (detail.accessFloors ?? []).some(access => normalize(access.floor) !== floor)
      || (detail.entrances ?? []).some(entrance => normalize(entrance.floor) !== floor)) {
      return fail('cross_floor_membership');
    }
    if (detail.status !== 'ACTIVE' || detail.searchable !== true
      || !['ROOM', 'FACILITY'].includes(detail.kind)) return fail('inactive_or_non_room_place');
    if (info?.placeId !== placeId
      || info?.building?.nodeId !== group.building_node_id
      || normalize(info?.building?.code) !== building
      || normalize(info?.floor) !== floor || normalize(detail.floor) !== floor
      || normalize(detail.roomNumber) !== normalize(group.room_number)
      || normalize(info?.roomNumber) !== normalize(group.room_number)) return fail('detail_location_mismatch');
    const entrances = new Set((detail.entrances ?? []).map(entrance => entrance.nodeId));
    if (!entrances.size || !group.node_ids.every(id => entrances.has(id))
      || (room.nodeId != null && !entrances.has(room.nodeId))) return fail('entrance_membership_mismatch');
    return { placeId, reason: 'verified', candidatePlaceIds };
  };
}

function syncFloors(catalog, directory, write = false) {
  const match = createMatcher(catalog);
  const report = {
    source: {
      baseUrl: catalog.baseUrl, fetchedAt: catalog.fetchedAt,
      baselineFingerprint: catalog.diagnostics.baselineFingerprint,
      catalogSha256: crypto.createHash('sha256').update(JSON.stringify(catalog)).digest('hex'),
    },
    totals: { floors: 0, rooms: 0, mapped: 0, unresolved: 0, uniquePlaces: 0 },
    reasons: {}, buildings: {}, unresolved: [],
  };
  let changedFiles = 0;
  const ids = new Set();
  for (const filename of fs.readdirSync(directory).filter(name => name.endsWith('.json')).sort()) {
    const filepath = path.join(directory, filename);
    const original = fs.readFileSync(filepath, 'utf8');
    const data = JSON.parse(original);
    if (`${data.floorId}.json` !== filename) throw new Error(`Floor identity mismatch: ${filename}`);
    report.totals.floors++;
    const building = data.floorId.slice(0, data.floorId.lastIndexOf('_'));
    const counts = report.buildings[building] ??= { rooms: 0, mapped: 0, unresolved: 0 };
    let changed = false;
    for (const room of data.rooms) {
      const result = match(data.floorId, room);
      report.totals.rooms++;
      counts.rooms++;
      if (result.placeId) {
        report.totals.mapped++;
        counts.mapped++;
        ids.add(result.placeId);
      } else {
        report.totals.unresolved++;
        counts.unresolved++;
        report.reasons[result.reason] = (report.reasons[result.reason] ?? 0) + 1;
        report.unresolved.push({
          floorId: data.floorId, id: room.id, label: room.label ?? room.id,
          reason: result.reason, candidatePlaceIds: result.candidatePlaceIds,
        });
      }
      if (room.placeId !== result.placeId) {
        room.placeId = result.placeId;
        changed = true;
      }
    }
    if (changed) {
      changedFiles++;
      if (write) fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + (original.endsWith('\n') ? '\n' : ''));
    }
  }
  report.totals.uniquePlaces = ids.size;
  return { report, changedFiles };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const option = name => {
      const index = args.indexOf(name);
      return index < 0 ? undefined : args[index + 1];
    };
    if (!option('--catalog')) throw new Error(
      'Usage: node scripts/sync-floor-place-ids.cjs --catalog /tmp/catalog.json [--write] [--report report.json]',
    );
    const catalog = JSON.parse(fs.readFileSync(option('--catalog'), 'utf8'));
    if (catalog.validation?.allRequestedIdsVerified !== true
      || catalog.validation?.diagnosticsFingerprintUnchanged !== true
      || catalog.validation?.layerRevisionsUnchanged !== true) {
      throw new Error('Catalogue must verify every requested UUID and unchanged server fingerprint.');
    }
    const { report, changedFiles } = syncFloors(catalog,
      option('--floors-dir') ?? path.join(__dirname, '../src/assets/svgs/floors'), args.includes('--write'));
    if (option('--report')) fs.writeFileSync(option('--report'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ ...report.totals, reasons: report.reasons, changedFiles, written: args.includes('--write') }, null, 2));
    if (args.includes('--check') && changedFiles) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { createMatcher, syncFloors };
