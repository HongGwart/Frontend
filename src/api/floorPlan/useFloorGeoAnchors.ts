import { useMemo } from 'react';
import { useFloorPlanCorners } from '@api/generated/honggwart';
import { FLOOR_MAPS, resolveFloorId } from '@constant/floorMaps';
import { FLOOR_PLAN_ANCHORS, FLOOR_PLAN_REFERENCES } from '@constant/floorPlanReferencePoints';
import { anchorsFromReferencePoints, FloorGeoAnchors, getContentBounds } from '@utils/floorGeoTransform';

/**
 * 층 평면도를 지도에 앉힐 네 모서리 위경도. 서버의 평면도 기준 꼭짓점(위경도 두 점)과 Figma 도면 기준점(도면 좌표
 * 두 점)으로 계산한다. 서버 값이 아직 안 왔거나 없으면(요청 실패) 같은 방식으로 미리 계산해 둔
 * FLOOR_PLAN_ANCHORS(같은 서버 꼭짓점으로 buildFloorPlanAnchors.js가 계산)를 쓴다(둘 다 없으면 평면도를 안 깐다).
 * 다른 동 도면에 함께 그려진 층("J_1")은 그 도면("L_6")의 네 모서리를 그대로 쓴다.
 */
export function useFloorGeoAnchors(layerFloorId: string | undefined): FloorGeoAnchors | undefined {
  const floorId = layerFloorId && resolveFloorId(layerFloorId);
  const reference = floorId ? FLOOR_PLAN_REFERENCES[floorId] : undefined;
  const enabled = reference !== undefined;
  const { data } = useFloorPlanCorners(reference?.layerId ?? 0, {
    query: {
      enabled,
      // 기준점은 거의 안 바뀌고, 실패해도 손으로 맞춘 값/평면도 없음으로 넘어가니 토스트는 띄우지 않는다.
      staleTime: Infinity,
      meta: { silent: true },
    },
  });

  return useMemo(() => {
    const fallback = floorId ? FLOOR_PLAN_ANCHORS[floorId] : undefined;
    const points = data?.points;
    if (!floorId || !reference || !points || points.length < 2) return fallback;
    const floorMap = FLOOR_MAPS[floorId]?.();
    if (!floorMap) return fallback;
    return anchorsFromReferencePoints(getContentBounds(floorMap.data), reference.points, [points[0], points[1]]);
  }, [floorId, reference, data]);
}
