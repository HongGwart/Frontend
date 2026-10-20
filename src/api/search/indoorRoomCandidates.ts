import type { Detail, PlaceInfoResponse } from '@api/generated/model';
import type { SearchResultItem } from '@constant/dummySearchData';

export interface IndoorRoomContext {
  buildingCode: string;
  floor: string;
  roomLabel: string;
}

export interface IndoorRoomCandidate {
  item: SearchResultItem;
  locationLabel: string;
  /** 정렬 정보일 뿐 도형과 이 장소가 같다는 판정은 아니다. */
  exactRoomMatch: boolean;
}

export function normalizeIndoorBuildingCode(value: string): string {
  return value.normalize('NFC').trim().replace(/동$/, '').trim().toUpperCase();
}

export function normalizeIndoorRoomNumber(value: string): string {
  return value.normalize('NFC').trim().replace(/호$/, '').trim().toUpperCase();
}

/** 도면 라벨로 검색어만 준비한다. 검색 결과를 장소 ID로 자동 연결하는 규칙은 아니다. */
export function buildIndoorRoomQuery(context: IndoorRoomContext): string {
  const buildingCode = normalizeIndoorBuildingCode(context.buildingCode);
  const roomLabel = normalizeIndoorRoomNumber(context.roomLabel);
  if (!buildingCode || !roomLabel) return roomLabel || (buildingCode ? `${buildingCode}동` : '');
  if (roomLabel.startsWith(buildingCode)) {
    const rest = roomLabel.slice(buildingCode.length).replace(/^동/, '').trim();
    if (/^\d/.test(rest)) return `${buildingCode}${rest}`;
  }
  return `${buildingCode}${roomLabel}`;
}

function normalizeFloor(value: string): string {
  return value.trim().toUpperCase();
}

function roomNumberForBuilding(value: string, buildingCode: string): string {
  const number = normalizeIndoorRoomNumber(value);
  // H314 같은 도면 라벨도 정확호수 정렬에 활용하되, 서버 소속이나 UUID를 추론하지 않는다.
  return number.startsWith(buildingCode) && /^\d/.test(number.slice(buildingCode.length))
    ? number.slice(buildingCode.length)
    : number;
}

function floorText(floor: string): string {
  if (floor === 'L') return '로비층';
  const basement = floor.match(/^B(\d+)$/);
  return basement ? `지하 ${basement[1]}층` : `${floor}층`;
}

/**
 * 검색 이름 대신 소개 API의 확인된 소속과 층으로 후보를 검증한다.
 * 동일 호수의 별실은 여전히 별도 후보이며, 단일 결과도 화면에서 사용자가 선택해야 한다.
 */
export function toIndoorRoomCandidate(
  context: IndoorRoomContext,
  item: SearchResultItem,
  placeInfo: PlaceInfoResponse | undefined,
  placeDetail?: Detail,
): IndoorRoomCandidate | null {
  if (!placeInfo?.building || !placeInfo.floor
    || placeDetail?.status === 'ARCHIVED' || placeDetail?.searchable === false) return null;
  if (placeDetail?.kind === 'BUILDING' || placeInfo.kind === 'BUILDING') return null;

  const buildingCode = normalizeIndoorBuildingCode(context.buildingCode);
  const floor = normalizeFloor(context.floor);
  if (!buildingCode || !floor
    || normalizeIndoorBuildingCode(placeInfo.building.code) !== buildingCode
    || normalizeFloor(placeInfo.floor) !== floor) return null;
  // 장소 상세와 소개가 서로 다른 층을 가리키는 경우에도 임의로 한쪽을 택하지 않는다.
  if (placeDetail?.floor && normalizeFloor(placeDetail.floor) !== floor) return null;
  if (item.placeId && placeDetail && placeDetail.placeId !== item.placeId) return null;
  if (placeDetail?.placeId && placeInfo.placeId && placeDetail.placeId !== placeInfo.placeId) return null;
  if (!placeDetail && item.nodeId !== undefined && placeInfo.nodeId !== item.nodeId) return null;

  const placeId = placeDetail?.placeId ?? placeInfo.placeId ?? item.placeId ?? null;
  const nodeId = item.nodeId ?? placeDetail?.legacyNodeId ?? placeInfo.nodeId;
  if (!placeId && (!Number.isSafeInteger(nodeId) || nodeId <= 0)) return null;
  const roomNumber = placeDetail?.roomNumber ?? placeInfo.roomNumber;
  const displayName = placeDetail?.displayName ?? placeInfo.displayName ?? item.displayName ?? item.place;
  const numberedRoom = roomNumber ? `${normalizeIndoorRoomNumber(roomNumber)}호` : undefined;
  const buildingLabel = `${buildingCode}동`;

  return {
    item: {
      ...item,
      id: placeId ? `place:${placeId}` : `node:${nodeId}`,
      nodeId,
      placeId,
      placeKind: placeDetail?.kind ?? item.placeKind ?? null,
      displayName,
      building: buildingLabel,
      place: placeInfo.building.name,
      // 별실·중앙 등 서버 표시명의 구분 정보를 목록에서도 보존한다.
      room: displayName || numberedRoom,
    },
    locationLabel: [buildingLabel, placeInfo.building.name, floorText(floor), numberedRoom].filter(Boolean).join(' · '),
    exactRoomMatch: !!roomNumber
      && roomNumberForBuilding(roomNumber, buildingCode) === roomNumberForBuilding(context.roomLabel, buildingCode),
  };
}

/** 동일 UUID의 여러 출입구만 합치고, UUID가 다른 동명 장소나 미매핑 노드는 각각 유지한다. */
export function dedupeAndSortIndoorRoomCandidates(candidates: IndoorRoomCandidate[]): IndoorRoomCandidate[] {
  const seen = new Set<string>();
  return candidates.filter(candidate => {
    const { placeId, nodeId } = candidate.item;
    const key = placeId ? `place:${placeId}` : `node:${nodeId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => Number(b.exactRoomMatch) - Number(a.exactRoomMatch));
}
