//
// 90개 건물 규모를 고려해, 무거운 도면 SVG는 번들에서 빼고 서버에서
// 다운로드한다(useFloorImage 훅). 좌표 JSON은 건물 1개당 몇 KB 수준으로
// 가벼우므로 그대로 번들에 둬도 무방하다 — 탭 판정, 라벨 렌더링에 필요한
// 최소한의 데이터라 빠르게 메모리에 있어야 하는 것들이다.

import type { FloorShapeData } from '../types/floorShapes';

import shapesT5 from '../assets/floorShapes/building32-floor1.json';
// 건물이 늘어날 때마다 여기 import 한 줄 + 아래 항목 한 줄씩 추가
// import shapesB32F2 from '../assets/floorShapes/building32-floor2.json';

type FloorKey = `${number}-${number}`; // `${buildingId}-${floor}`

export const floorShapesAssets: Record<FloorKey, FloorShapeData> = {
  '32-1': shapesT5 as unknown as FloorShapeData,
  // '32-2': shapesB32F2 as unknown as FloorShapeData,
};

export function getFloorShapes(buildingId: number, floor: number): FloorShapeData | null {
  const key = `${buildingId}-${floor}` as FloorKey;
  return floorShapesAssets[key] ?? null;
}