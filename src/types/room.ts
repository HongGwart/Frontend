export interface RoomShape {
  /** svgToRoomShapes.js가 뽑아낸 방 이름 (예: "506-1") */
  id: string;
  /**
   * 지도 위에 그릴 텍스트. 생략하면 id를 그대로 쓴다. 화장실처럼 배경 SVG에 이미
   * 성별 아이콘이 박혀있어서 텍스트 라벨이 필요 없는 방은 빈 문자열("")로 명시해서 숨긴다.
   */
  label?: string;
  /** placeIdMapping.ts로 나중에 채워지는 값. 매핑 전이면 null */
  placeId: number | null;
  /** 원본 SVG 좌표계 기준 4개 모서리 [x, y] */
  points: [number, number][];
  /** react-native-svg <Path d={...}>에 바로 넣을 수 있는 문자열 */
  path: string;
  /**
   * 라벨 텍스트를 그릴 위치를 강제로 지정하고 싶을 때만 채운다. 없으면 points의
   * 평균(centroid)을 쓰는데, L자처럼 각이 진 방은 centroid가 실제 방 안쪽이 아니라
   * 노치(파낸 부분) 쪽으로 치우쳐 보일 수 있어서 수동으로 보정할 때 쓴다.
   */
  labelAnchor?: [number, number];
}

export type IconMarkerType = 'elevator' | 'stairs';

export interface IconMarker {
  /** svgToIcons.js가 뽑아낸 원본 그룹 id (예: "map_stairs_2") */
  id: string;
  type: IconMarkerType;
  /** 원본 SVG 좌표계 기준 아이콘 중심점 [x, y]. 화면에는 이 좌표를 앵커로 고정 픽셀 크기로 그린다
   *  (지도를 확대/축소해도 아이콘 크기는 안 커지는 네이버지도식 마커) */
  center: [number, number];
  /** 원본 SVG상 아이콘 한 변 길이 (참고용, 실제 렌더링 크기는 IconMarkersLayer가 별도로 정함) */
  size: number;
}

export interface FloorMapData {
  floorId: string;
  /** 원본 SVG viewBox 기준 너비/높이 (배경 SVG와 반드시 같은 좌표계여야 함) */
  width: number;
  height: number;
  rooms: RoomShape[];
  /** 계단/엘리베이터 등 확대해도 크기가 고정되어야 하는 마커. 없는 층은 생략 가능 */
  icons?: IconMarker[];
}