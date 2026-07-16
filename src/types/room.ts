export interface RoomShape {
  /** svgToRoomShapes.js가 뽑아낸 방 이름 (예: "506-1") */
  id: string;
  /** placeIdMapping.ts로 나중에 채워지는 값. 매핑 전이면 null */
  placeId: number | null;
  /** 원본 SVG 좌표계 기준 4개 모서리 [x, y] */
  points: [number, number][];
  /** react-native-svg <Path d={...}>에 바로 넣을 수 있는 문자열 */
  path: string;
}

export interface FloorMapData {
  floorId: string;
  /** 원본 SVG viewBox 기준 너비/높이 (배경 SVG와 반드시 같은 좌표계여야 함) */
  width: number;
  height: number;
  rooms: RoomShape[];
}