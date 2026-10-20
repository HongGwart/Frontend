"""Create repeatable fixtures only in Backend's disposable workspaceBrowser."""
import base64
import json
import pathlib
import argparse
import subprocess
import urllib.error
import urllib.parse
import urllib.request
import uuid

parser = argparse.ArgumentParser()
parser.add_argument("--postgres-container", required=True)
parser.add_argument("--output-dir", type=pathlib.Path, required=True)
parser.add_argument("--check-only", action="store_true", help="Verify local guards without writing data.")
args = parser.parse_args()
OUT = args.output_dir.resolve()
BASE = "http://localhost:18081"
HEADERS = {
    "Content-Type": "application/json",
    "X-Honggwart-Admin-Key": "workspace-browser-test-only",
}


def request(path, body=None):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body, ensure_ascii=False).encode() if body is not None else None,
        headers=HEADERS,
    )
    try:
        with opener.open(req, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"{path}: {error.code} {error.read().decode()}") from error


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError("Fixture API redirects are not permitted.")


opener = urllib.request.build_opener(NoRedirect())
# All guards precede API/DB mutations. The endpoint cannot be overridden with
# a production URL or environment variable.
assert urllib.parse.urlsplit(BASE).hostname == "localhost"
assert urllib.parse.urlsplit(BASE).port == 18081
container = json.loads(subprocess.check_output(["docker", "inspect", args.postgres_container]))[0]
if (container["Config"]["Image"] != "postgres:16"
        or container["Config"].get("Labels", {}).get("org.testcontainers") != "true"
        or not container["State"]["Running"]):
    raise SystemExit("Expected a running postgres:16 Testcontainers container.")
request("/api/admin/graph/status")
if args.check_only:
    print("Guards passed: localhost:18081 and running postgres:16 Testcontainers container.")
    raise SystemExit(0)
if (OUT / "fixtures.json").exists():
    raise SystemExit("Output already contains fixtures.json; reuse it for test:api or choose a fresh server/output directory.")
if request("/api/admin/layers"):
    raise SystemExit("Use a fresh workspaceBrowser server; existing layers were found.")
OUT.mkdir(parents=True, exist_ok=True)


def sql(statement):
    subprocess.run(["docker", "exec", "-i", args.postgres_container,
                    "psql", "-U", "honggwart", "-d", "honggwart", "-v", "ON_ERROR_STOP=1"],
                   input=statement.encode(), check=True)


nodes = {}
places = {name: str(uuid.uuid4()) for name in ("building", "room501", "room101", "cafe", "separate501")}


def node(key, name, floor, node_type="POI", room=None, parent=True, searchable=True,
         lat=37.55075, lng=126.92545):
    payload = {
        "name": name, "lat": lat, "lng": lng, "floor": str(floor),
        "floorOrder": floor, "parentNodeId": nodes.get("building") if parent else None,
        "nodeType": node_type, "searchable": searchable, "roomNumber": room,
        "properties": {},
    }
    nodes[key] = request("/api/admin/nodes", payload)["id"]
    (OUT / "seed-state.json").write_text(json.dumps({"nodes": nodes, "places": places}, indent=2))
    return nodes[key]


def edge(source, target, weight, kind="CORRIDOR", indoor=True):
    return request("/api/admin/edges", {
        "fromNodeId": nodes[source], "toNodeId": nodes[target], "weight": weight,
        "edgeType": kind, "isIndoor": indoor, "bidirectional": True,
        "properties": {},
    })["id"]


def member(key, role, primary=False):
    return {"nodeId": nodes[key], "role": role, "primary": primary}


def place(key, kind, name, members, floor=None, room=None, facility=None, aliases=None):
    return {
        "id": places[key], "expectedVersion": None, "kind": kind, "displayName": name,
        "buildingPlaceId": None if kind == "BUILDING" else places["building"],
        "floor": str(floor) if floor is not None else None, "floorOrder": floor,
        "roomNumber": room, "searchable": True, "status": "ACTIVE",
        "members": members, "aliases": aliases or [], "facility": facility,
    }


node("building", "T동", 0, "SYMBOLIC", parent=False)
node("entrance", "T동 E2E 주출입구", 1, "ENTRANCE", searchable=False)
node("room101", "T동 101호", 1, room="101", lng=126.92549)
node("room501doorA", "T동 501호 정문", 5, room="501", lng=126.92550)
node("room501doorB", "T동 501호 옆문", 5, room="501", lng=126.92552)
node("elevator1", "T동 E2E 엘리베이터 1층", 1, "VERTICAL_LINK", searchable=False)
node("elevator5", "T동 E2E 엘리베이터 5층", 5, "VERTICAL_LINK", searchable=False)
node("cafe", "T동 빈소개카페", 1, lng=126.92555)
node("unmapped", "미매핑 E2E 안내소", 0, parent=False, lat=37.55065, lng=126.92535)
node("separate501", "T동 501호 별실", 5, room="501", lng=126.92554)

edge("unmapped", "entrance", 20, "OUTDOOR_PATH", False)
edge("entrance", "room101", 8, "DOOR")
edge("room101", "elevator1", 5)
edge("elevator1", "elevator5", 20, "ELEVATOR")
edge("elevator1", "elevator5", 16, "STAIR")
edge("elevator5", "room501doorA", 9)
edge("elevator5", "room501doorB", 3)
edge("room501doorB", "separate501", 4)
edge("room101", "cafe", 10)

# The enabled backend creates provisional singleton POIs during individual node
# writes. Reset only this script's nodes before applying the intended reviewed
# fixture mapping (and leave the deliberately unmapped fixture unmapped).
own_ids = ",".join(str(int(node_id)) for node_id in nodes.values())
cleanup = f"""
BEGIN;
CREATE TEMP TABLE e2e_singleton_places AS
  SELECT DISTINCT place_id FROM place_node WHERE node_id IN ({own_ids});
DELETE FROM place_alias WHERE place_id IN (SELECT place_id FROM e2e_singleton_places);
DELETE FROM search_index_failure WHERE place_id IN (SELECT place_id FROM e2e_singleton_places);
DELETE FROM place_node WHERE place_id IN (SELECT place_id FROM e2e_singleton_places);
DELETE FROM place WHERE id IN (SELECT place_id FROM e2e_singleton_places);
COMMIT;
"""
sql(cleanup)

changes = [
    place("building", "BUILDING", "T동", [
        member("building", "BUILDING_ANCHOR", True),
        member("entrance", "BUILDING_ENTRANCE"),
    ], aliases=["제4공학관", "T"]),
    place("room101", "ROOM", "T동 101호", [member("room101", "ROOM_DOOR", True)], 1, "101"),
    place("room501", "ROOM", "T동 501호", [
        member("room501doorA", "ROOM_DOOR", True), member("room501doorB", "ROOM_DOOR"),
    ], 5, "501", aliases=["T501", "E2E 다중출입구"]),
    place("separate501", "ROOM", "T동 501호 별실", [member("separate501", "ROOM_DOOR", True)], 5, "501"),
    place("cafe", "FACILITY", "T동 빈소개카페", [member("cafe", "FACILITY_ACCESS", True)], 1,
          facility={"category": "CAFE", "onCampus": True, "introduction": None,
                    "operatingHoursText": None, "sourceRecordKey": "e2e:missing-cafe",
                    "sourceUrl": "https://example.test/e2e", "sourceVersion": "fixture"}),
]
request("/api/admin/places/changes", {"changes": {"places": changes}, "expectedLayerRevisions": {}})
request("/api/admin/index/reindex", {})
request("/api/admin/graph/reload", {})

fixtures = {
    "baseUrl": BASE,
    "openApiUrl": BASE + "/v3/api-docs",
    "nodes": nodes,
    "places": places,
    "searchTerms": {"mapped": "T501", "unmapped": "미매핑", "facility": "빈소개카페"},
    "samePlace": {"fromNodeId": nodes["room501doorA"], "toNodeId": nodes["room501doorB"]},
    "elevatorRoute": {"fromPlaceId": places["room101"], "toPlaceId": places["room501"]},
    "mixedIndoorRoute": {"fromNodeId": nodes["unmapped"], "toPlaceId": places["room501"]},
    "unreachable": {"fromNodeId": nodes["room101"], "toNodeId": 203},
    "missingNodeId": 999999,
}
(OUT / "building-profile.sql").write_text(f"""
INSERT INTO building_profile (
  building_node_id, building_code, building_name, introduction, main_entrance_text,
  operating_hours_text, source_record_key, source_url, source_version, imported_at, place_id
) VALUES (
  {nodes["building"]}, 'T', '제4공학관', 'E2E 서버에서 받은 제4공학관 소개입니다.',
  'E2E 정문(1층)', '05:00 - 23:00', 'e2e:building:T',
  'https://example.test/e2e', 'fixture', now(), '{places["building"]}'
);
""")
sql((OUT / "building-profile.sql").read_text())

def create_layer(name, floor):
    return request("/api/admin/layers", {
        "name": name, "buildingCode": "E2E", "buildingName": "E2E 검증 건물",
        "floor": str(floor), "floorOrder": floor, "kind": "FLOOR_PLAN",
    })


layer = create_layer("E2E 기준점 검증층", 1)
empty_layer = create_layer("E2E 기준점 미등록층", 2)
fixtures["emptyFloorPlan"] = request(f"/api/layers/{empty_layer['id']}/floor-plan-corners")
assert fixtures["emptyFloorPlan"]["imageId"] is None
assert fixtures["emptyFloorPlan"]["points"] == []
png = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJk0AAAAASUVORK5CYII=")
boundary = "honggwart-e2e-fixture"
body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"fixture.png\"\r\n"
        "Content-Type: image/png\r\n\r\n").encode() + png + f"\r\n--{boundary}--\r\n".encode()
upload = urllib.request.Request(
    f"{BASE}/api/admin/layers/{layer['id']}/images?expectedRevision=0",
    data=body, headers={
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "X-Honggwart-Admin-Key": HEADERS["X-Honggwart-Admin-Key"],
    },
)
with opener.open(upload, timeout=30) as response:
    image = json.load(response)
saved = request(f"/api/admin/layers/{layer['id']}/floor-plan-corners", {
    "expectedRevision": 1, "imageId": image["id"], "points": [
        {"longitude": 126.92535, "latitude": 37.55065},
        {"longitude": 126.92555, "latitude": 37.55085},
    ],
})
fixtures["floorPlan"] = request(f"/api/layers/{layer['id']}/floor-plan-corners")
assert fixtures["floorPlan"] == saved
(OUT / "fixtures.json").write_text(json.dumps(fixtures, ensure_ascii=False, indent=2))
print(json.dumps(fixtures, ensure_ascii=False, indent=2))
