import { useMemo } from 'react';
import { useNode, useNodePlaceInfo, usePlaceDetail } from '@api/generated/honggwart';
import type { BuildingSummary, Detail, FacilitySummary, NodeDetailResponse, PlaceInfoResponse } from '@api/generated/model';
import { USE_MOCK_API } from '@api/config';
import { floorLabel, toFloorId } from '@api/route/toRouteView';

export interface NodeDetailView {
  nodeId?: number;
  placeId?: string | null;
  kind?: string;
  isBuilding: boolean;
  displayName: string;
  buildingCode?: string;
  buildingName?: string;
  roomNumber?: string;
  floorText?: string;
  floorId?: string;
  mainEntrance?: string;
  introduction?: string | null;
  introductionStatus?: string;
  operatingHoursText?: string | null;
  status?: string;
}

function buildingOf(info?: PlaceInfoResponse): BuildingSummary | undefined {
  const value = info?.building;
  return value && typeof value === 'object' && 'code' in value && typeof value.code === 'string'
    && 'name' in value && typeof value.name === 'string' && 'nodeId' in value && typeof value.nodeId === 'number'
    ? value as BuildingSummary : undefined;
}
function facilityOf(info?: PlaceInfoResponse): FacilitySummary | undefined {
  const value = info?.facility;
  return value && typeof value === 'object' && 'category' in value && typeof value.category === 'string'
    ? value as FacilitySummary : undefined;
}

/** 장소의 primary와 기존 노드의 isPrimary를 각 응답 어댑터에서 정규화한다. */
function formatEntrances(entrances: { name?: string; primary?: boolean }[]) {
  const named = entrances.filter(item => item.name);
  const sorted = [...named].sort((a, b) => Number(!!b.primary) - Number(!!a.primary));
  const shown = sorted.slice(0, 2).map(item => item.name);
  return shown.length ? `${shown.join(', ')}${named.length > 2 ? ` 외 ${named.length - 2}곳` : ''}` : undefined;
}

export function toNodeDetailView(detail: NodeDetailResponse | undefined, info?: PlaceInfoResponse, place?: Detail): NodeDetailView {
  const building = buildingOf(info);
  const kind = place?.kind ?? info?.kind;
  const isBuilding = kind === 'BUILDING' || (!kind && detail?.nodeType === 'SYMBOLIC');
  const code = building?.code;
  const buildingCode = code ? `${code.replace(/동$/, '')}동` : undefined;
  const roomNumber = place?.roomNumber ?? info?.roomNumber ?? detail?.roomNumber;
  const floor = place?.floor ?? info?.floor ?? detail?.floor;
  return {
    nodeId: place?.legacyNodeId ?? detail?.nodeId ?? info?.nodeId,
    placeId: place?.placeId ?? detail?.placeId ?? info?.placeId ?? null,
    kind,
    isBuilding,
    displayName: place?.displayName ?? info?.displayName ?? detail?.displayName ?? '',
    buildingCode,
    buildingName: building?.name,
    roomNumber: roomNumber ? `${roomNumber.replace(/호$/, '')}호` : undefined,
    floorText: isBuilding ? undefined : floorLabel(floor) || undefined,
    floorId: isBuilding ? undefined : toFloorId(buildingCode, floor),
    mainEntrance: place
      ? formatEntrances(place.entrances ?? [])
      : formatEntrances((detail?.entrances ?? []).map(item => ({ name: item.name, primary: item.isPrimary }))),
    introduction: info?.introduction,
    introductionStatus: info?.introductionStatus,
    operatingHoursText: facilityOf(info)?.operatingHoursText,
    status: place?.status,
  };
}

/** UUID는 장소 상세, 미매핑 숫자 노드는 기존 상세·소개 계약을 사용한다. */
export function useNodeDetail(nodeId: number | undefined, placeId?: string | null) {
  const enabled = !USE_MOCK_API;
  const options = { staleTime: 60_000, meta: { silent: true } };
  const placeQuery = usePlaceDetail(placeId ?? '', { query: { ...options, enabled: enabled && !!placeId } });
  const nodeQuery = useNode(nodeId ?? 0, { query: { ...options, enabled: enabled && !placeId && nodeId !== undefined } });
  const infoQuery = useNodePlaceInfo(String(nodeId ?? ''), { query: { ...options, enabled: enabled && !placeId && nodeId !== undefined } });
  return useMemo(() => {
    if (!enabled) return undefined;
    if (placeId) return placeQuery.data ? toNodeDetailView(undefined, placeQuery.data.placeInfo ?? undefined, placeQuery.data) : undefined;
    return nodeQuery.data || infoQuery.data ? toNodeDetailView(nodeQuery.data, infoQuery.data) : undefined;
  }, [enabled, placeId, placeQuery.data, nodeQuery.data, infoQuery.data]);
}
