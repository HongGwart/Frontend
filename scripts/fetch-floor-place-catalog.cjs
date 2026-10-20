#!/usr/bin/env node

// Read-only evidence for floor geometry mapping. No autocomplete result limits,
// remote writes, or administrator credentials are included in the output.
const { mkdir, mkdtemp, rename, rm, writeFile } = require('node:fs/promises');
const { dirname, join, resolve } = require('node:path');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DIAGNOSTICS = '/api/admin/places/migration/diagnostics';
const LAYERS = '/api/admin/layers?protocolVersion=3';

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function parseArgs(args) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) return { help: true };
  const result = {};
  for (let index = 0; index < args.length; index += 2) {
    const option = args[index];
    check(['--base-url', '--output'].includes(option), 'Expected --base-url and --output.');
    check(args[index + 1] && !args[index + 1].startsWith('--'), `Missing value for ${option}.`);
    check(!Object.hasOwn(result, option), `Duplicate option: ${option}.`);
    result[option] = args[index + 1];
  }
  check(result['--base-url'] && result['--output'], 'Both --base-url and --output are required.');
  return { baseUrl: result['--base-url'], output: resolve(result['--output']) };
}

function normalizeBaseUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Invalid --base-url.'); }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  check(url.protocol === 'https:' || (url.protocol === 'http:' && loopback),
    'Use HTTPS, or HTTP on a loopback host for local testing.');
  check(!url.username && !url.password && !url.search && !url.hash && url.pathname === '/',
    '--base-url must be an origin without credentials, a path, query, or fragment.');
  return url.origin;
}

async function mapLimited(items, action) {
  const results = Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(3, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await action(items[index]);
    }
  }));
  return results;
}

function sameRecord(left, right) {
  return JSON.stringify(Object.entries(left).sort(([a], [b]) => a.localeCompare(b))) ===
    JSON.stringify(Object.entries(right).sort(([a], [b]) => a.localeCompare(b)));
}

async function collectCatalogue({ baseUrl, adminKey, fetchImpl = globalThis.fetch }) {
  baseUrl = normalizeBaseUrl(baseUrl);
  check(typeof adminKey === 'string' && adminKey.trim() && !/[\r\n]/.test(adminKey),
    'Set HONGGWART_ADMIN_API_KEY in the environment.');
  check(typeof fetchImpl === 'function', 'This script requires Node.js 18 or later.');
  const startedAt = new Date().toISOString();
  const requests = [];

  async function get(path, { admin = false, allowNotFound = false } = {}) {
    // Keep credentials on this explicit origin and never forward them on redirects.
    const headers = { Accept: 'application/json' };
    if (admin) headers['X-Honggwart-Admin-Key'] = adminKey;
    let response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method: 'GET', headers, redirect: 'error', signal: AbortSignal.timeout(60_000),
      });
    } catch {
      // Do not print fetch errors, request headers, or response bodies containing secrets.
      throw new Error(`GET ${path.split('?')[0]} failed before an HTTP response.`);
    }
    requests.push({ path: path.split('?')[0], status: response.status });
    if (allowNotFound && response.status === 404) return null;
    check(response.ok, `GET ${path.split('?')[0]} returned HTTP ${response.status}.`);
    try { return await response.json(); } catch {
      throw new Error(`GET ${path.split('?')[0]} returned invalid JSON.`);
    }
  }

  async function placeBatch(ids) {
    const chunks = [];
    for (let index = 0; index < ids.length; index += 100) chunks.push(ids.slice(index, index + 100));
    const responses = await mapLimited(chunks, async (chunk) => {
      const data = await get(`/api/places?${new URLSearchParams({ placeIds: chunk.join(',') })}`);
      check(Array.isArray(data.items) && Array.isArray(data.missingPlaceIds), 'Invalid place batch response.');
      check(data.missingPlaceIds.length === 0, 'A requested place UUID is missing; collection is incomplete.');
      const returned = new Set(data.items.map((item) => item.placeId));
      check(returned.size === chunk.length && data.items.length === chunk.length &&
        chunk.every((id) => returned.has(id)), 'Place batch returned an unexpected UUID set.');
      return data.items;
    });
    return responses.flat();
  }

  const diagnostics = await get(DIAGNOSTICS, { admin: true });
  check(Array.isArray(diagnostics.roomCandidates) && diagnostics.counts &&
    typeof diagnostics.baselineFingerprint === 'string' && diagnostics.layerRevisions,
  'Diagnostics response does not contain complete snapshot evidence.');
  const crossFloor = diagnostics.crossFloorRoomCandidates ?? [];
  check(Array.isArray(crossFloor), 'Invalid cross-floor room diagnostics.');
  const candidateIds = new Set();
  for (const candidate of [...diagnostics.roomCandidates, ...crossFloor]) {
    check(Array.isArray(candidate.place_ids), 'Room candidate is missing its place UUID array.');
    for (const id of candidate.place_ids) {
      if (id === null) continue;
      check(typeof id === 'string' && UUID.test(id), 'Invalid UUID in room diagnostics.');
      candidateIds.add(id);
    }
  }
  const roomPlaces = await placeBatch([...candidateIds].sort());
  const layers = await get(LAYERS, { admin: true });
  check(Array.isArray(layers), 'Invalid layer listing.');
  check(layers.length === Object.keys(diagnostics.layerRevisions).length &&
    layers.every((layer) => diagnostics.layerRevisions[String(layer.id)] === layer.revision),
  'Layer revisions changed after the initial diagnostics.');

  const layerBuildings = new Map();
  for (const layer of layers) {
    const locations = layer.locations?.length ? layer.locations : [layer];
    for (const location of locations) {
      if (location.buildingNodeId == null) continue;
      check(typeof location.buildingCode === 'string' && location.buildingCode,
        'A layer building has no code.');
      const existing = layerBuildings.get(location.buildingNodeId);
      check(!existing || existing.code === location.buildingCode, 'Conflicting layer building codes.');
      layerBuildings.set(location.buildingNodeId, {
        nodeId: location.buildingNodeId, code: location.buildingCode,
      });
    }
  }
  const unresolvedLayerBuildings = [];
  const buildings = (await mapLimited([...layerBuildings.values()], async ({ nodeId, code }) => {
    // PlaceInfoService.normalizeCode accepts building codes only. Reference-map
    // parents can have other layer identifiers, e.g. REF-CAMPUS-MAP.
    if (!/^[A-Z][A-Z0-9]{0,19}$/.test(code)) {
      unresolvedLayerBuildings.push({ nodeId, code, reason: 'PUBLIC_BUILDING_CODE_UNSUPPORTED' });
      return null;
    }
    const building = await get(`/api/buildings/${encodeURIComponent(code)}`, { allowNotFound: true });
    if (!building) {
      // Reference-map layers may have a symbolic parent without a building profile.
      unresolvedLayerBuildings.push({ nodeId, code, reason: 'PUBLIC_BUILDING_NOT_FOUND' });
      return null;
    }
    check(building.nodeId === nodeId && building.code === code,
      'Public building identity does not match the layer location.');
    check(typeof building.placeId === 'string' && UUID.test(building.placeId),
      'A public building has no logical place UUID.');
    return building;
  })).filter(Boolean).sort((a, b) => a.code.localeCompare(b.code));
  check(Number.isInteger(diagnostics.counts.building_profile) &&
    buildings.length === diagnostics.counts.building_profile,
  'Not every server building profile could be verified from the layer listing.');
  check(new Set(buildings.map((building) => building.placeId)).size === buildings.length,
    'Different building profiles returned the same UUID.');

  const buildingPlaces = await placeBatch(buildings.map((building) => building.placeId));
  const buildingByPlaceId = new Map(buildingPlaces.map((place) => [place.placeId, place]));
  for (const building of buildings) {
    const detail = buildingByPlaceId.get(building.placeId);
    check(detail.kind === 'BUILDING' && detail.legacyNodeId === building.nodeId &&
      detail.placeInfo?.building?.nodeId === building.nodeId &&
      detail.placeInfo.building.code === building.code,
    'Building detail does not match its public profile.');
  }
  for (const place of roomPlaces) {
    const building = buildingByPlaceId.get(place.buildingPlaceId);
    check(building && place.placeInfo?.building?.nodeId === building.legacyNodeId &&
      place.placeInfo.building.code === building.placeInfo.building.code,
    'A room candidate has inconsistent or missing structured building information.');
  }

  const after = await get(DIAGNOSTICS, { admin: true });
  check(after.baselineFingerprint === diagnostics.baselineFingerprint,
    'Server mapping changed during collection; rerun to obtain a consistent catalogue.');
  check(after.layerRevisions && sameRecord(after.layerRevisions, diagnostics.layerRevisions),
    'Server layer revisions changed during collection; rerun.');
  check(after.counts && sameRecord(after.counts, diagnostics.counts),
    'Server row counts changed during collection; rerun.');
  const places = [...new Map([...roomPlaces, ...buildingPlaces].map((p) => [p.placeId, p])).values()]
    .sort((a, b) => a.placeId.localeCompare(b.placeId));
  const fetchedAt = new Date().toISOString();
  const remaining = diagnostics.counts.place - places.length;
  check(Number.isInteger(remaining) && remaining >= 0, 'Server place count is inconsistent.');
  const kindCounts = {};
  for (const place of roomPlaces) kindCounts[place.kind] = (kindCounts[place.kind] ?? 0) + 1;

  return {
    baseUrl, fetchedAt, diagnostics, layers, places, buildings,
    source: {
      schemaVersion: 1,
      collector: 'scripts/fetch-floor-place-catalog.cjs',
      startedAt, completedAt: fetchedAt,
      method: 'GET',
      diagnosticsPath: DIAGNOSTICS,
      layersPath: LAYERS,
      placeDetailsPath: '/api/places?placeIds=<up to 100 UUIDs>',
      buildingProfilesPath: '/api/buildings/{buildingCode}',
      initialBaselineFingerprint: diagnostics.baselineFingerprint,
      finalBaselineFingerprint: after.baselineFingerprint,
      requests,
      scope: 'All UUIDs in roomCandidates and crossFloorRoomCandidates, plus verified building profiles.',
      excludedScope: 'Other places are not enumerated; autocomplete is not used.',
    },
    validation: {
      allRequestedIdsVerified: true,
      allRoomCandidatePlaceIdsVerified: true,
      requestedPlaceIds: places.length,
      returnedPlaceIds: places.length,
      missingPlaceIds: [],
      diagnosticsFingerprintUnchanged: true,
      layerRevisionsUnchanged: true,
      baselineVerifiedAt: fetchedAt,
      verifiedRoomPlaceCount: roomPlaces.length,
      verifiedRoomCandidateKindCounts: kindCounts,
      verifiedBuildingCount: buildings.length,
      totalServerPlaceCount: diagnostics.counts.place,
      remainingUncollectedPlaceCount: remaining,
      remainingUncollectedKinds: 'Not classified; layer snapshot union is required to enumerate other places.',
      unresolvedLayerBuildings: unresolvedLayerBuildings.sort((a, b) => a.nodeId - b.nodeId),
      completeCatalogue: remaining === 0,
      needsReviewRoomGroups: diagnostics.roomCandidates.filter((c) => c.needs_review).length,
      crossFloorRoomCandidateGroups: crossFloor.length,
    },
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('HONGGWART_ADMIN_API_KEY=<existing key> node scripts/fetch-floor-place-catalog.cjs --base-url https://dev-api.honggwart.com --output /tmp/catalog.json');
    console.log('GET only. The key is read from the environment and is never logged or saved.');
    return;
  }
  const catalog = await collectCatalogue({
    baseUrl: options.baseUrl, adminKey: process.env.HONGGWART_ADMIN_API_KEY,
  });
  await mkdir(dirname(options.output), { recursive: true });
  const temporaryDirectory = await mkdtemp(join(dirname(options.output), '.place-catalog-'));
  try {
    const temporaryFile = join(temporaryDirectory, 'catalog.json');
    await writeFile(temporaryFile, `${JSON.stringify(catalog, null, 2)}\n`, { mode: 0o600 });
    await rename(temporaryFile, options.output);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
  console.log(JSON.stringify({
    output: options.output,
    verifiedPlaceCount: catalog.places.length,
    verifiedBuildingCount: catalog.buildings.length,
    remainingUncollectedPlaceCount: catalog.validation.remainingUncollectedPlaceCount,
    diagnosticsFingerprintUnchanged: true,
  }));
}

module.exports = { collectCatalogue, parseArgs };
if (require.main === module) {
  main().catch((error) => {
    // All network exceptions are sanitized inside get(); credentials are never logged.
    console.error(error.message);
    process.exitCode = 1;
  });
}
