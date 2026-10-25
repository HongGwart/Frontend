import { GeoCoord } from '@utils/floorGeoTransform';

/**
 * 건물별 덮개 다각형(위경도). 평면도를 네이버 지도에 깔면 네이버 지도의 건물 윤곽과 살짝 어긋나 두 겹으로 보여서,
 * 평면도 아래에 지도 바탕색 덮개를 깔아 그 건물의 네이버 윤곽만 가린다. 네이버 지도 SDK는 건물 하나만 끄거나 건물
 * 모양을 알려주지 않아서, 개발용 지도 모드(⬛ 건물 덮개 찍기)에서 네이버 건물 모서리를 직접 찍어 buildingMasks.json에
 * 저장한다. 키는 평면도 키의 건물 부분(R_1 → "R", MH_6 → "MH").
 */
export type BuildingMasks = Record<string, GeoCoord[]>;

const SAVED_MASKS = require('./buildingMasks.json') as BuildingMasks;

// 개발용 모드가 방금 찍은 덮개. 파일 저장/HMR을 기다리지 않고 지도에 바로 보이게 들고 있는다.
let runtimeMasks: BuildingMasks = SAVED_MASKS;
export function setBuildingMasks(masks: BuildingMasks) {
  runtimeMasks = masks;
}

export function getBuildingMasks(): BuildingMasks {
  return runtimeMasks;
}

/** 이 건물의 덮개. 꼭짓점이 3개 미만이면 다각형이 안 되니 없는 것으로 본다. */
export function getBuildingMask(building: string): GeoCoord[] | undefined {
  const mask = runtimeMasks[building];
  return mask && mask.length >= 3 ? mask : undefined;
}
