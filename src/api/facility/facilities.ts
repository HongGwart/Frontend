import { useMemo } from 'react';
import { usePlace } from '@api/generated/honggwart';
import type { FacilitySummary } from '@api/generated/model';
import type { PhotoSource } from '@appTypes/photo';
import type { CategoryKey } from '@constant/categoryChips';
import type { FavoritePlace } from '@constant/dummyMypage';
import type { FacilityCategoryId } from '@navigation/types';
import { useNow } from '@hooks/useNow';
import { getOperatingStatus, parseOperatingHoursText } from '@utils/operatingHours';

/**
 * 지도 위 편의시설(카테고리 칩 마커) 하나. 서버 시설 목록 API가 생기면 그 응답을 이 모양으로 바꿔 넣는다.
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

const NO_MARKERS: FacilityMarker[] = [];
const NO_PLACES: FavoritePlace[] = [];

/**
 * 지도·건물 상세에 찍을 편의시설 목록. 서버에 공개 시설 목록 API가 아직 없어서 지금은 빈 목록이다 —
 * 화면은 빈 상태(칩 토스트·칸 숨김)로 보인다. TODO: 시설 목록 API가 생기면 여기서만 서버 데이터로 바꾼다(#41).
 */
export function useFacilityMarkers(): FacilityMarker[] {
  return NO_MARKERS;
}

/**
 * 편의시설 탭의 카테고리별 장소 목록. 지금은 빈 목록이라 "등록된 ○○ 정보가 없어요" 빈 상태가 보인다.
 * TODO: 시설 목록 API가 생기면 여기서만 서버 데이터로 바꾼다(#41).
 */
export function useFacilityPlaces(_categoryId: FacilityCategoryId): FavoritePlace[] {
  return NO_PLACES;
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
