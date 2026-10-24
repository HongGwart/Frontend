import { FC } from 'react';
import { SvgProps } from 'react-native-svg';
import { PhotoSource } from '@appTypes/photo';
import { FocusFacilityParam } from '@navigation/types';
import { OperatingHours } from '@utils/operatingHours';

export interface FavoritePlace {
  id: string;
  /** 편의시설명. 있으면 시설 카드, 없으면 건물 카드로 렌더된다. */
  name?: string;
  buildingCode: string;
  buildingName: string;
  locationDetail?: string;
  photo?: PhotoSource;
  icon?: FC<SvgProps>;
  iconWidth?: number;
  iconHeight?: number;
  /** 요일별 운영 시간. 운영 상태 문구는 지금 시각으로 계산한다(utils/operatingHours). 없으면 운영 줄을 숨긴다 */
  operatingHours?: OperatingHours;
  /** 장소 자체 좌표(서버 시설 목록의 대표 접근점). 없으면 지도는 소속 건물 마커 좌표에 찍는다 */
  latitude?: number;
  longitude?: number;
  /** 서버 노드 id. 있으면 길찾기가 이름 검색 없이 이 노드로 바로 간다 */
  nodeId?: number;
}

/**
 * 즐겨찾기 카드를 탭했을 때 map 탭으로 넘길 파라미터로 변환한다.
 * 편의시설명(name)이 있으면 그게 제목, 없으면 "동 + 건물명"을 제목으로 쓴다.
 */
export function favoritePlaceToFocusParam(place: FavoritePlace): FocusFacilityParam {
  return {
    id: place.id,
    buildingCode: place.buildingCode,
    buildingName: place.buildingName,
    facilityName: place.name ?? `${place.buildingCode} ${place.buildingName}`,
    placeName: place.name,
  };
}

