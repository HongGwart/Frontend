import { RoomShape } from "@types/room";

/**
 * 레이 캐스팅으로 (x, y)가 폴리곤 내부인지 판정.
 * Reanimated worklet 안에서 직접 호출할 수 있도록 'worklet' 지시어 포함.
 */
export function pointInPolygon(x: number, y: number, points: [number, number][]): boolean {
  'worklet';
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.00001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * 탭 좌표(원본 SVG 좌표계 기준)에 해당하는 방을 찾는다.
 * 겹치는 방이 있을 수 있으므로 배열 뒤쪽(나중에 그려진 것)을 우선한다.
 */
export function findRoomAtPoint(x: number, y: number, rooms: RoomShape[]): RoomShape | null {
  'worklet';
  for (let i = rooms.length - 1; i >= 0; i--) {
    if (pointInPolygon(x, y, rooms[i].points)) {
      return rooms[i];
    }
  }
  return null;
}