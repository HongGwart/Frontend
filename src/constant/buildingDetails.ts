import { PhotoSource } from '@appTypes/photo';
import { FacilityCountItem } from '@components/common/FacilityInfoCard';
import { OperatingHours } from '@utils/operatingHours';

/**
 * 건물 상세·건물 카드에 보여줄 건물 정보. 나중에 서버 API(건물 상세)도 이 모양으로 받는다(useBuildingDetail이
 * 출처를 바꾼다). 운영 상태 문구는 들고 있지 않고 hours로 지금 시각에 계산한다(utils/operatingHours).
 * 확인하지 못한 항목은 비워 두면 화면에서 그 줄이 빠진다.
 */
export interface BuildingDetail {
  /** 한 줄 설명. 없으면 지도 마커의 설명을 쓴다 */
  description?: string;
  /** 직접 찍었거나 사용 허락을 받은 사진 두 장. 없으면 지도 마커의 사진을 쓴다 */
  photos?: [PhotoSource, PhotoSource];
  hours?: OperatingHours;
  /** 운영 시간 아래 한 줄 메모(예: "방학 중 09:00–18:00") */
  hoursNote?: string;
  /** 프린터·PC실 등 개수 */
  facilityCounts?: FacilityCountItem[];
}

/**
 * 아래 정보를 실제로 확인한 날짜("YYYY-MM-DD"). 건물 상세에 "○월 기준" 안내로 보인다.
 * TODO: 팀이 확인한 실제 정보(docs/data-templates)로 바꾸면서 날짜를 채운다. null이면 안내를 띄우지 않는다.
 */
export const BUILDING_DETAILS_AS_OF: string | null = null;

/** 건물 코드("R동") → 확인된 건물 정보 */
export const BUILDING_DETAILS: Record<string, BuildingDetail> = {};

/** 팀이 확인한 건물 정보. 없으면 undefined(화면에서 그 줄들이 빠진다) */
export function getBuildingDetail(buildingCode: string): BuildingDetail | undefined {
  return BUILDING_DETAILS[buildingCode];
}
