# 평면도 데이터 작업

Figma에서 내보낸 층 평면도 SVG를 앱 데이터(내부 지도 JSON·배경 SVG, 네이버 지도용 이미지)로 바꾸는 방법.

| 문서 | 내용 |
|---|---|
| 이 문서 | 언제 어떤 스크립트를 어떤 순서로 돌리는지 |
| [figma-rules.md](figma-rules.md) | Figma 레이어 이름 규칙과 자주 나는 실수 |
| [decisions.md](decisions.md) | 데이터 구조를 왜 이렇게 정했는지 (다른 동 도면에 함께 그려진 층 등) |
| [known-issues.md](known-issues.md) | 아직 안 고친 문제 — Figma·서버 수정 대기, 현장 확인 필요 |

## 파일 위치

- 원본·산출물: `src/assets/svgs/floors/{층}.svg` → `{층}.json`, `{층}_bg.svg` (`_doors.svg`, `_icons.svg`는 중간 산출물)
- 층 목록: `src/constant/floorMaps.ts`의 `FLOOR_MAPS` — 층 키는 `{동}_{층}` (지하 `_B1`, R동 로비 `_L`)
- 지도 기준점: `src/constant/floorPlanReferencePoints.json`(서버 layerId + Figma 기준점 두 개) → `floorPlanAnchors.json`(계산된 네 모서리)
- 지도용 이미지: `src/assets/floorOverlays/{층}.webp` (무손실 WebP, [decisions.md](decisions.md) 2026-10-26) + `src/constant/floorOverlayImages.ts`(자동 생성, 직접 고치지 않음)
- 확대용 조각: `src/assets/floorOverlays/hires/{층}_{행}_{열}.webp` — 지도용 이미지와 같이 구워진다([decisions.md](decisions.md) 2026-10-25)
- 다른 동 도면에 함께 그려진 층: `src/constant/hostedFloors.json` ([decisions.md](decisions.md))

## 층을 추가하거나 다시 처리할 때

1. **백업**: `src/assets/svgs/floors`, `src/assets/floorOverlays`, `floorOverlayImages.ts`, `floorPlanAnchors.json`을 복사해 둔다.
2. **층 처리**: SVG를 `src/assets/svgs/floors/`에 넣고
   ```bash
   node scripts/processFloor.js src/assets/svgs/floors/C_8.svg
   ```
   - 강의실이 없는 층(Hitbox에 방이 0개, 예: R_16, L_1)만 `--allow-empty`를 붙인다.
   - 새 층이면 `FLOOR_MAPS`에 한 줄 추가한다.
   - 마지막에 `auditFloors.js`가 이 층을 검사한다. 경고가 [known-issues.md](known-issues.md)에 없는 것이면 확인한다.
3. **지도 기준점**: `contentBounds`가 바뀌었거나 새 층이면
   ```bash
   node scripts/buildFloorPlanAnchors.js C_8
   ```
   새 층은 먼저 `floorPlanReferencePoints.json`에 `{ layerId, points }`를 넣는다(Figma "평면도 기준점 · API" 프레임의 기준점 1·2). layerId가 서버와 어긋나면 `syncFloorPlanLayers.js`(관리자 키 필요).
4. **지도용 이미지**:
   ```bash
   node scripts/renderFloorOverlay.js C_8
   ```
   다른 동 도면에 함께 그려진 층(`J_1`, `H_1` 등)은 그 도면을 다시 처리했으면 같이 굽는다: `node scripts/renderFloorOverlay.js L_6 J_1`.
5. **확인**: `npx tsc --noEmit -p .`, 그리고 `node scripts/auditFloors.js`(전 층).

## 데이터 오류를 고칠 때

- Hitbox 방 이름이 틀렸으면 레포의 SVG에서 Hitbox 그룹 안 `id="room_…"`만 고치고 2번부터 다시 돌린다. **Figma도 같이 고쳐야** 다음 내보내기에서 되돌아가지 않는다 → [known-issues.md](known-issues.md)의 "Figma 수정 대기"에 적는다.
- 스크립트는 한 번뿐인 데이터 문제를 위해 고치지 않는다. Figma(원본)를 고친다.
