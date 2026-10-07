import { useMemo } from 'react';
import { useNode } from '@api/generated/honggwart';
import type { NodeDetailResponse } from '@api/generated/model';
import { USE_MOCK_API } from '@api/config';
import { floorLabel } from '@api/route/toRouteView';

// 출입구가 많은 건물(R동은 7곳)은 카드 한 줄에 다 안 들어가서 이만큼만 보여주고 "외 n곳"으로 줄인다.
const MAX_ENTRANCES = 2;

/** 장소 상세를 시설 카드에 바로 쓰는 모양으로 바꾼 것 */
export interface NodeDetailView {
  nodeId: number;
  /** 건물(SYMBOLIC)이면 true — 건물 카드, 아니면 호실/시설 카드 */
  isBuilding: boolean;
  /** 서버 표시 이름 (예: "R동 104호", "R5 강의실 끝 여자화장실") */
  displayName: string;
  /** 소속 건물 코드(예: "R동"). 건물 자체면 자기 이름 */
  buildingCode?: string;
  /** "104호". 호실 번호가 없는 시설(화장실 등)은 undefined */
  roomNumber?: string;
  /** "1층", "지하 1층", "로비층". 건물 자체는 층이 없어서 undefined */
  floorText?: string;
  /** 건물 카드의 "주출입구" 값 (예: "C1 남측 출입구, C1 북측 출입구") */
  mainEntrance?: string;
}

function formatEntrances(entrances: NodeDetailResponse['entrances']) {
  const names = (entrances ?? []).map(entrance => entrance.name).filter((name): name is string => !!name);
  if (names.length === 0) return undefined;
  // 주출입구로 표시된 곳(isPrimary 또는 이름에 "주출입구")이 있으면 그것만 앞세운다.
  const primary = (entrances ?? [])
    .filter(entrance => entrance.isPrimary || entrance.name?.includes('주출입구'))
    .map(entrance => entrance.name as string);
  const shown = (primary.length ? primary : names).slice(0, MAX_ENTRANCES);
  const rest = names.length - shown.length;
  return rest > 0 ? `${shown.join(', ')} 외 ${rest}곳` : shown.join(', ');
}

function toNodeDetailView(detail: NodeDetailResponse): NodeDetailView {
  const isBuilding = detail.nodeType === 'SYMBOLIC';
  return {
    nodeId: detail.nodeId ?? 0,
    isBuilding,
    displayName: detail.displayName ?? '',
    buildingCode: isBuilding ? detail.displayName : detail.parent?.displayName,
    roomNumber: detail.roomNumber ? `${detail.roomNumber}호` : undefined,
    floorText: isBuilding ? undefined : floorLabel(detail.floor) || undefined,
    mainEntrance: formatEntrances(detail.entrances),
  };
}

/**
 * 장소 상세(GET /api/nodes/{nodeId}) — 층·호실·소속 건물·출입구. nodeId가 없으면(앱 더미 장소) 요청하지
 * 않는다. 실패하면 카드는 더미/검색 결과 값으로 그대로 뜨니 전역 토스트도 띄우지 않는다.
 */
export function useNodeDetail(nodeId: number | undefined) {
  const enabled = !USE_MOCK_API && nodeId !== undefined;
  const { data } = useNode(nodeId ?? 0, { query: { enabled, meta: { silent: true } } });
  return useMemo(() => (enabled && data ? toNodeDetailView(data) : undefined), [enabled, data]);
}
