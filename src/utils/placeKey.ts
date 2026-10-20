/** UUID와 물리 노드 식별자는 이름·도면 ID와 분리한다. 이름 키는 기존 저장값/목 데이터에만 사용한다. */
export function toPlaceKey(
  buildingCode: string,
  detail?: string,
  identity?: { placeId?: string | null; nodeId?: number | null },
): string {
  if (identity?.placeId) return `place:${identity.placeId}`;
  if (identity?.nodeId != null) return `node:${identity.nodeId}`;
  const building = buildingCode.trim();
  const rest = detail?.trim();
  return rest ? `${building}/${rest}` : building;
}
