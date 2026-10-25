import { useMemo } from 'react';
import { useFacilities, usePlace } from '@api/generated/honggwart';
import type { FacilityListItem, FacilitySummary } from '@api/generated/model';
import { floorLabel } from '@api/route/toRouteView';
import type { PhotoSource } from '@appTypes/photo';
import type { CategoryKey } from '@constant/categoryChips';
import type { FavoritePlace } from '@constant/dummyMypage';
import { FACILITY_CATEGORIES } from '@constant/facilityCategories';
import type { FacilityCategoryId } from '@navigation/types';
import { useNow } from '@hooks/useNow';
import { getOperatingStatus, parseOperatingHoursText } from '@utils/operatingHours';

/**
 * 지도 위 편의시설(카테고리 칩 마커) 하나. 서버 시설 목록(GET /api/facilities)을 이 모양으로 바꿔 쓴다.
 * room이 시설 카드 제목(facilityName)으로 쓰인다.
 */
export interface FacilityMarker {
  id: string;
  latitude: number;
  longitude: number;
  category: Exclude<CategoryKey, 'favorite'>;
  /** 같은 자리에 겹친 시설 수(숫자 배지) */
  count?: number;
  buildingCode: string;
  buildingName: string;
  room: string;
  description: string;
  /** 시설 사진 2장. 확인된 사진이 없으면 생략한다(카드는 카테고리 아이콘 기본 이미지를 보여준다). */
  images?: [PhotoSource, PhotoSource];
  /** 서버 노드 id — 시설 소개·운영 시간(place-info)과 길찾기에 쓴다 */
  nodeId?: number;
}

const NO_FACILITIES: FacilityListItem[] = [];

/**
 * 서버 시설 분류 코드 → 편의시설 탭 카테고리. 서버는 분류를 enum으로 막지 않아서(지금 쓰는 값: CAFE·CONVENIENCE_STORE·
 * READING_ROOM·PC_ROOM·PRINTER·ETC) 모르는 코드는 "기타"로 모은다. 식당·도서 반납기·흡연 구역은 서버에 아직 등록된
 * 시설이 없어 코드를 추정해 둔 것이다 — 실제 코드가 다르면 여기만 고친다(검색 결과 아이콘도 이 표를 거친다).
 */
const TAB_CATEGORY_BY_SERVER: Record<string, FacilityCategoryId> = {
  RESTAURANT: 'restaurant',
  CAFE: 'cafe',
  CONVENIENCE_STORE: 'store',
  READING_ROOM: 'readingRoom',
  PC_ROOM: 'pc',
  PRINTER: 'printer',
  BOOK_RETURN: 'bookReturn',
  SMOKING_AREA: 'smokingArea',
};
export const toTabCategory = (serverCategory: string): FacilityCategoryId =>
  TAB_CATEGORY_BY_SERVER[serverCategory] ?? 'etc';

/** 편의시설 탭 카테고리 → 지도 칩. "기타"는 지도 칩이 없어 지도에는 안 찍는다. */
const CHIP_BY_TAB_CATEGORY: Partial<Record<FacilityCategoryId, FacilityMarker['category']>> = {
  restaurant: 'restaurant',
  cafe: 'cafe',
  store: 'store',
  readingRoom: 'readingRoom',
  pc: 'pcRoom',
  printer: 'printer',
  bookReturn: 'bookReturn',
  smokingArea: 'smokingArea',
};

/** 서버 건물 코드("R") → 앱 동 코드("R동"). 소속 건물이 없으면 빈 문자열. */
const toBuildingCode = (code: string | null) => (code ? `${code}동` : '');

/** 교내 시설 전체. 시설 목록은 자주 안 바뀌어서 10분 동안은 다시 받지 않는다. */
function useCampusFacilities() {
  const { data } = useFacilities(undefined, {
    // 실패해도 지도·편의시설 탭이 빈 상태로 보일 뿐이라 토스트는 띄우지 않는다.
    query: { staleTime: 10 * 60_000, meta: { silent: true } },
  });
  return useMemo(() => (data?.items ?? NO_FACILITIES).filter(item => item.onCampus), [data]);
}

/**
 * 시설 노드 id → 소속 동 코드("R동"). 검색 자동완성은 시설의 소속 건물을 주지 않아서, 이름에 동 표기가 없는
 * 시설("그라찌에")도 검색 결과에 동·건물명을 붙이려고 쓴다.
 */
export function useFacilityBuildingCodes(): ReadonlyMap<number, string> {
  const facilities = useCampusFacilities();
  return useMemo(
    () =>
      new Map(
        facilities
          .filter(item => item.buildingCode)
          .map(item => [item.legacyNodeId, toBuildingCode(item.buildingCode)] as const),
      ),
    [facilities],
  );
}

/** 지도·건물 상세에 찍을 편의시설 목록. 지도 칩이 없는 "기타" 시설은 빠진다. */
export function useFacilityMarkers(): FacilityMarker[] {
  const facilities = useCampusFacilities();
  return useMemo(
    () =>
      facilities.flatMap(item => {
        const category = CHIP_BY_TAB_CATEGORY[toTabCategory(item.category)];
        if (!category) return [];
        return [
          {
            id: item.placeId,
            latitude: item.lat,
            longitude: item.lng,
            category,
            buildingCode: toBuildingCode(item.buildingCode),
            buildingName: item.buildingName ?? '',
            room: item.displayName,
            description: item.introduction ?? '',
            nodeId: item.legacyNodeId,
          },
        ];
      }),
    [facilities],
  );
}

/** 편의시설 탭의 카테고리별 장소 목록. 등록된 시설이 없으면 "등록된 ○○ 정보가 없어요" 빈 상태가 보인다. */
export function useFacilityPlaces(categoryId: FacilityCategoryId): FavoritePlace[] {
  const facilities = useCampusFacilities();
  return useMemo(() => {
    const category = FACILITY_CATEGORIES.find(item => item.id === categoryId);
    return facilities
      .filter(item => toTabCategory(item.category) === categoryId)
      .map(item => ({
        id: item.placeId,
        name: item.displayName,
        buildingCode: toBuildingCode(item.buildingCode),
        buildingName: item.buildingName ?? '',
        locationDetail: floorLabel(item.floor ?? undefined) || undefined,
        icon: category?.icon,
        operatingHours: parseOperatingHoursText(item.operatingHoursText),
        latitude: item.lat,
        longitude: item.lng,
        nodeId: item.legacyNodeId,
      }));
  }, [facilities, categoryId]);
}

/**
 * 시설 하나의 운영 상태 — 서버 장소 소개(GET /api/nodes/{nodeId}/place-info)의 시설 자체 운영 시간으로
 * 지금 시각 기준 상태를 계산한다. 서버에 운영 시간이 없거나(시설 데이터 미입력) nodeId가 없으면 undefined라
 * 카드의 운영 시간 줄이 빠진다. 서버에 데이터가 들어오면 앱 수정 없이 보인다.
 */
export function useFacilityOperatingStatus(nodeId: number | undefined) {
  const now = useNow();
  const { data } = usePlace(String(nodeId ?? ''), {
    // 실패하거나 시설 정보가 없어도 그 줄이 빠질 뿐이라 토스트는 띄우지 않는다.
    query: { enabled: nodeId !== undefined, staleTime: 10 * 60_000, meta: { silent: true } },
  });
  return useMemo(() => {
    // 생성 타입이 nullable 객체를 `FacilitySummary | unknown`으로 만들어서 원래 모양으로 좁힌다(시설이 아니면 null).
    const facility = data?.facility as FacilitySummary | null | undefined;
    const hours = parseOperatingHoursText(facility?.operatingHoursText);
    return hours ? getOperatingStatus(hours, now) : undefined;
  }, [data, now]);
}
