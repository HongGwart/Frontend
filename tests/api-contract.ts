import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { api } from '../src/api/client';
import { autocomplete, route, placeDetail, node, nodePlaceInfo, building, placeBatch, placeInfos, floorPlanCorners } from '../src/api/generated/honggwart';
import * as schema from '../src/api/generated/honggwart.zod';
import { toRouteParams, routeResponseState } from '../src/api/route/useRouteSearch';
import { toRouteView } from '../src/api/route/toRouteView';
import { toSearchResultItem } from '../src/api/search/useSearchSuggestions';
import { toNodeDetailView } from '../src/api/node/useNodeDetail';
import { toPlaceKey } from '../src/utils/placeKey';
import { ApiError } from '../src/api/errors';
import {
  buildIndoorRoomQuery,
  dedupeAndSortIndoorRoomCandidates,
  normalizeIndoorBuildingCode,
  normalizeIndoorRoomNumber,
  toIndoorRoomCandidate,
} from '../src/api/search/indoorRoomCandidates';
import { fetchIndoorRoomCandidates } from '../src/api/search/useIndoorRoomCandidates';

const manifest = process.argv[2];
if (!manifest) throw new Error('Pass the disposable backend fixtures.json path; see docs/api-e2e.md.');
const fixture = JSON.parse(readFileSync(manifest, 'utf8'));
api.defaults.baseURL = fixture.baseUrl;

test('mapped search keeps two-door identity and distinct same-number room', async () => {
  const response = await autocomplete({ q: fixture.searchTerms.mapped, limit: '20' });
  schema.AutocompleteResponse.parse(response);
  const mapped = response.suggestions!.find(item => item.placeId === fixture.places.room501)!;
  const other = response.suggestions!.find(item => item.placeId === fixture.places.separate501)!;
  assert.ok(mapped && other);
  const item = toSearchResultItem(mapped);
  assert.equal(item.entranceCount, 2);
  assert.equal(item.placeKind, 'ROOM');
  assert.notEqual(item.id, toSearchResultItem(other).id);
  assert.equal(toPlaceKey('', undefined, item), `place:${fixture.places.room501}`);
});

test('unmapped result stays a routable server node without an invented place ID', async () => {
  const response = await autocomplete({ q: fixture.searchTerms.unmapped });
  schema.AutocompleteResponse.parse(response);
  const item = toSearchResultItem(response.suggestions!.find(item => item.nodeId === fixture.nodes.unmapped)!);
  assert.equal(item.placeId, null);
  assert.equal(item.entranceCount, null);
  assert.equal(item.id, `node:${fixture.nodes.unmapped}`);
  assert.deepEqual(toRouteParams({ fromNodeId: item.nodeId, fromPlaceId: item.placeId, toPlaceId: fixture.places.room501 }),
    fixture.mixedIndoorRoute);
});

test('UUID endpoints omit node IDs and SAME_PLACE is successful for UUID, node and mixed inputs', async () => {
  const request = toRouteParams({
    fromNodeId: fixture.nodes.room501doorA, fromPlaceId: fixture.places.room501,
    toNodeId: fixture.nodes.room501doorB, toPlaceId: fixture.places.room501,
  });
  assert.deepEqual(Object.keys(request).sort(), ['fromPlaceId', 'toPlaceId']);
  for (const params of [request, fixture.samePlace, { fromPlaceId: fixture.places.room501, toNodeId: fixture.nodes.room501doorB }]) {
    const response = await route(params);
    schema.RouteResponse.parse(response);
    assert.equal(response.status, 'SAME_PLACE');
    assert.deepEqual(response.summary, { distanceMeters: 0, durationSeconds: 0 });
    assert.deepEqual(response.routes, []);
    assert.deepEqual(routeResponseState(response), { samePlace: true, notFound: false, error: undefined });
  }
});

test('real route modes retain backend metrics, selected entrance and movement steps', async () => {
  const response = await route(fixture.elevatorRoute);
  schema.RouteResponse.parse(response);
  assert.equal(response.status, 'ROUTES_FOUND');
  assert.equal(response.summary, null);
  assert.equal(response.routes?.length, 3);
  for (const candidate of response.routes!) {
    const view = toRouteView(candidate)!;
    assert.ok(view);
    assert.equal(view.result.indoorPercent, candidate.summary!.indoorPercent);
    assert.equal(view.result.elevatorWarning, candidate.summary!.elevatorCongested);
    assert.equal(view.result.elevatorCount, candidate.steps!.filter(step => step.meta?.transport === 'ELEVATOR').length);
    assert.equal(candidate.to?.usedNodeId, fixture.nodes.room501doorB);
    assert.equal(view.map.end.label, candidate.to?.entranceName);
    assert.ok(view.map.path.every(point => point.latitude > 0 && point.longitude > 0));
    assert.equal(view.map.guidance.length, candidate.steps!.filter(step => step.type !== 'ARRIVE').length);
  }
  const candidate = response.routes![0];
  // Force differing geometric/server metrics and congestion to prove the UI adapter obeys the API.
  const congested = structuredClone(candidate);
  congested.summary = { ...congested.summary, indoorPercent: 37, elevatorCongested: true };
  const elevator = congested.steps!.find(step => step.meta?.transport === 'ELEVATOR')!;
  elevator.meta!.congested = true;
  const view = toRouteView(congested)!;
  assert.equal(view.result.indoorPercent, 37);
  assert.equal(view.result.elevatorWarning, true);
  assert.ok(view.map.guidance.some(step => step.title.includes('시간표상 혼잡')));
  assert.equal(toRouteView({ ...candidate, polyline: [{ lat: undefined, lng: 126 }, { lat: 37, lng: 126 }] }), null);
  // Floor-only movement can have zero walking distance and identical map coordinates.
  const vertical = structuredClone(candidate);
  vertical.summary = { ...vertical.summary, distanceMeters: 0, indoorPercent: 0 };
  vertical.polyline = vertical.polyline!.map(point => ({ ...point, lat: 37.55, lng: 126.925 }));
  const verticalView = toRouteView(vertical)!;
  assert.equal(verticalView.result.distanceMeters, 0);
  assert.ok(verticalView.map.guidance.every(step => Number.isFinite(step.progress)));
});

test('mixed indoor/outdoor route parses nullable shared context', async () => {
  const response = await route(fixture.mixedIndoorRoute);
  schema.RouteResponse.parse(response);
  for (const candidate of response.routes!) {
    assert.ok(candidate.summary!.indoorPercent! > 0 && candidate.summary!.indoorPercent! < 100);
    assert.equal(toRouteView(candidate)!.result.indoorPercent, candidate.summary!.indoorPercent);
  }
});

test('place detail keeps primary access, missing facility introduction and authoritative building content', async () => {
  const room = await placeDetail(fixture.places.room501);
  schema.PlaceDetailResponse.parse(room);
  assert.equal(room.entrances?.length, 2);
  const roomView = toNodeDetailView(undefined, room.placeInfo ?? undefined, room);
  assert.equal(roomView.placeId, fixture.places.room501);
  assert.equal(roomView.floorId, 'T_5');
  assert.ok(roomView.mainEntrance);
  const cafe = await placeDetail(fixture.places.cafe);
  schema.PlaceDetailResponse.parse(cafe);
  const cafeView = toNodeDetailView(undefined, cafe.placeInfo ?? undefined, cafe);
  assert.equal(cafeView.kind, 'FACILITY');
  assert.equal(cafeView.introduction, null);
  assert.equal(cafeView.introductionStatus, 'MISSING');
  const cafeNode = await node(fixture.nodes.cafe);
  schema.NodeResponse.parse(cafeNode);
  assert.deepEqual(cafeNode.facility, { category: 'CAFE', onCampus: true });
  const info = await building('T');
  schema.BuildingResponse.parse(info);
  assert.ok(info.introduction?.includes('E2E'));
  const detail = await node(fixture.nodes.unmapped);
  const intro = await nodePlaceInfo(String(fixture.nodes.unmapped));
  schema.NodeResponse.parse(detail);
  schema.NodePlaceInfoResponse.parse(intro);
  assert.equal(toNodeDetailView(detail, intro).placeId, null);
});

test('batch endpoints retain response identity and missing lists', async () => {
  const uri = api.getUri({ url: '/api/place-infos', params: { nodeIds: [1, 2] } });
  assert.equal(new URL(uri).searchParams.get('nodeIds'), '1,2');
  assert.equal(new URL(uri).searchParams.has('nodeIds[]'), false);
  const missingPlace = '00000000-0000-4000-8000-000000000000';
  const places = await placeBatch({ placeIds: [fixture.places.room501, fixture.places.room501, missingPlace].join(',') });
  schema.PlaceBatchResponse.parse(places);
  assert.equal(places.items?.length, 1);
  assert.deepEqual(places.missingPlaceIds, [missingPlace]);
  const infos = await placeInfos({ nodeIds: [fixture.nodes.room501doorA, fixture.nodes.room501doorB, fixture.missingNodeId] });
  schema.PlaceInfosResponse.parse(infos);
  assert.equal(infos.items.length, 2);
  assert.deepEqual(infos.missingNodeIds, [fixture.missingNodeId]);
});

test('floor-plan corners keep the two stored reference points', async () => {
  const response = await floorPlanCorners(fixture.floorPlan.layerId);
  schema.FloorPlanCornersResponse.parse(response);
  assert.equal(response.points?.length, 2);
  assert.deepEqual(response.points, fixture.floorPlan.points);
  schema.FloorPlanCornersResponse.parse({ ...response, imageId: null, points: [] });
  const empty = await floorPlanCorners(fixture.emptyFloorPlan.layerId);
  schema.FloorPlanCornersResponse.parse(empty);
  assert.equal(empty.imageId, null);
  assert.deepEqual(empty.points, []);
});

test('unreachable and deleted-node 404s have different screen states', async () => {
  const deleted = new ApiError({ kind: 'client', status: 404, code: 'PLACE_NOT_FOUND' });
  assert.equal(routeResponseState({ status: 'SAME_PLACE', routes: [] }, deleted).samePlace, false);
  for (const [params, expected] of [
    [fixture.unreachable, 'ROUTE_NOT_FOUND'],
    [{ fromNodeId: fixture.missingNodeId, toNodeId: fixture.nodes.room101 }, 'NODE_NOT_FOUND'],
  ] as const) {
    await assert.rejects(route(params), error => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, expected);
      const state = routeResponseState(undefined, error);
      assert.equal(state.notFound, expected === 'ROUTE_NOT_FOUND');
      assert.equal(state.error !== undefined, expected !== 'ROUTE_NOT_FOUND');
      return true;
    });
  }
});

test('indoor T101 candidates require verified building and floor before routing', async () => {
  const context = { buildingCode: 'T동', floor: '1', roomLabel: '101' };
  assert.equal(buildIndoorRoomQuery(context), 'T101');
  const candidates = await fetchIndoorRoomCandidates(context, buildIndoorRoomQuery(context));
  assert.equal(candidates.length, 1);
  const candidate = candidates[0];
  assert.equal(candidate.item.nodeId, fixture.nodes.room101);
  assert.equal(candidate.item.placeId, fixture.places.room101);
  assert.equal(candidate.exactRoomMatch, true);
  assert.ok(candidate.locationLabel.includes('T동'));
  assert.ok(candidate.locationLabel.includes('1층'));

  // Legacy "공학관 101호" also matches T101 text, but its building is unresolved.
  // A matching name must not connect that result to the clicked T-building room.
  const search = await autocomplete({ q: 'T101', limit: '50' });
  const legacy = search.suggestions!.find(item => item.placeId === null)!;
  assert.ok(legacy);
  const info = await nodePlaceInfo(String(legacy.nodeId));
  assert.equal(info.building, null);
  assert.equal(toIndoorRoomCandidate(context, toSearchResultItem(legacy), info), null);
  assert.deepEqual(await fetchIndoorRoomCandidates({ ...context, floor: '5' }, 'T101'), []);
  assert.deepEqual(await fetchIndoorRoomCandidates({ ...context, buildingCode: 'R동' }, 'T101'), []);

  const response = await route(toRouteParams({
    fromNodeId: candidate.item.nodeId, fromPlaceId: candidate.item.placeId,
    toPlaceId: fixture.places.room501,
  }));
  assert.equal(response.status, 'ROUTES_FOUND');
  assert.equal(response.routes?.[0].from?.placeId, fixture.places.room101);
});

test('indoor T501 keeps distinct room UUIDs and merges only the same place entrances', async () => {
  const context = { buildingCode: 'T동', floor: '5', roomLabel: '501호' };
  const candidates = await fetchIndoorRoomCandidates(context, 'T501');
  assert.equal(candidates.length, 2);
  assert.deepEqual(candidates.map(candidate => candidate.item.placeId).sort(),
    [fixture.places.room501, fixture.places.separate501].sort());
  assert.ok(candidates.every(candidate => candidate.exactRoomMatch));
  const canonical = candidates.find(candidate => candidate.item.placeId === fixture.places.room501)!;
  const separate = candidates.find(candidate => candidate.item.placeId === fixture.places.separate501)!;
  assert.ok(separate.item.displayName?.includes('별실'));
  assert.notEqual(canonical.item.id, separate.item.id);

  const detail = await placeDetail(fixture.places.room501);
  const otherDoor = toIndoorRoomCandidate(context, {
    ...canonical.item, nodeId: fixture.nodes.room501doorB,
  }, detail.placeInfo ?? undefined, detail)!;
  assert.ok(otherDoor);
  const deduped = dedupeAndSortIndoorRoomCandidates([...candidates, otherDoor]);
  assert.equal(deduped.length, 2);
  assert.deepEqual(new Set(deduped.map(candidate => candidate.item.placeId)),
    new Set([fixture.places.room501, fixture.places.separate501]));
});

test('indoor candidate normalization preserves verified numeric IDs and rejects stale membership', async () => {
  assert.equal(normalizeIndoorBuildingCode(' t동 '), 'T');
  assert.equal(normalizeIndoorRoomNumber(' 501호 '), '501');
  assert.notEqual(normalizeIndoorRoomNumber('501-1'), normalizeIndoorRoomNumber('501'));
  assert.equal(buildIndoorRoomQuery({ buildingCode: 'H동', floor: '3', roomLabel: 'H314' }), 'H314');
  assert.equal(buildIndoorRoomQuery({ buildingCode: 'H동', floor: '3', roomLabel: 'H동 314호' }), 'H314');

  const context = { buildingCode: 'T동', floor: '1', roomLabel: 'T101' };
  const [room, cafe, roomCandidates, cafeCandidates] = await Promise.all([
    placeDetail(fixture.places.room101),
    placeDetail(fixture.places.cafe),
    fetchIndoorRoomCandidates(context, 'T101'),
    fetchIndoorRoomCandidates(context, fixture.searchTerms.facility),
  ]);
  const selected = roomCandidates[0];
  assert.equal(selected.exactRoomMatch, true);
  assert.equal(cafeCandidates.length, 1);
  assert.equal(cafeCandidates[0].exactRoomMatch, false);
  assert.equal(cafeCandidates[0].item.placeId, cafe.placeId);
  assert.equal(dedupeAndSortIndoorRoomCandidates([...cafeCandidates, selected])[0].item.placeId,
    fixture.places.room101);

  assert.equal(toIndoorRoomCandidate(context, selected.item, undefined), null);
  assert.equal(toIndoorRoomCandidate(context, selected.item, room.placeInfo ?? undefined,
    { ...room, status: 'ARCHIVED' }), null);
  assert.equal(toIndoorRoomCandidate(context, selected.item, room.placeInfo ?? undefined,
    { ...room, searchable: false }), null);
  assert.equal(toIndoorRoomCandidate(context, selected.item, room.placeInfo ?? undefined,
    { ...room, floor: '5' }), null);
  assert.equal(toIndoorRoomCandidate(context, selected.item, room.placeInfo ?? undefined,
    { ...room, placeId: fixture.places.cafe }), null);

  // A verified legacy-only node stays numeric; the room label never becomes an ID.
  const legacyInfo = { ...room.placeInfo!, placeId: null };
  const legacyItem = { ...selected.item, placeId: null, placeKind: null };
  const legacyCandidate = toIndoorRoomCandidate(context, legacyItem, legacyInfo)!;
  assert.ok(legacyCandidate);
  assert.equal(legacyCandidate.item.nodeId, fixture.nodes.room101);
  assert.equal(legacyCandidate.item.placeId, null);
  assert.equal(legacyCandidate.item.id, `node:${fixture.nodes.room101}`);
  assert.equal(toIndoorRoomCandidate(context, {
    ...legacyItem, nodeId: fixture.nodes.room501doorA,
  }, legacyInfo), null);
});
