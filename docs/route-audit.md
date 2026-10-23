# 길찾기 경로 검사

dev 서버(`GET /api/route`)에 실제 경로를 요청하고, 앱의 `toRouteView`로 바꾼 경로 카드 구간 목록에서 문제를 찾는다.
스크립트: [scripts/auditRoutes.js](../scripts/auditRoutes.js). 검사 항목은 스크립트 머리 주석에 있다.

## 돌리는 법

서버가 경로를 요청마다 실시간으로 계산해서 **하루 50건(2초 간격)씩만** 돌린다. 진행 위치는
`scripts/routeAudit/state.json`에 남아서 다음 실행이 이어서 한다. 요청 한 건이 세 모드(최단/실내 위주/계단 회피)를 다 준다.

```
node scripts/auditRoutes.js               # 오늘 분 50건
node scripts/auditRoutes.js --report      # 요청 없이 누적 결과만
node scripts/auditRoutes.js --reinspect   # 요청 없이 저장된 응답을 지금 앱 코드로 재검사 (앱을 고친 뒤)
node scripts/auditRoutes.js --recheck     # 문제 나온 경로만 서버에 다시 요청 (서버가 고친 뒤, 한도 적용)
```

- 테스트 장소는 `scripts/routeAudit/places.json`(자동완성으로 모은 건물 21개, 호실 약 900개)이다. 전체 800건:
  건물 ↔ 건물 420, 같은 건물 최저층 ↔ 최고층 38, 다른 건물 호실 ↔ 호실 342.
- 응답 원본은 `scripts/routeAudit/responses/`에 저장되고 커밋하지 않는다. 2026-10-23 첫 50건은 저장 기능 전이라 원본이 없다.

## 열린 문제

### 앱에서 고칠 것

**실내 공용 통로가 "건물 밖"으로 나오고, 통로 안 계단이 "계단으로 층 이동"으로 나옴** (`unknown-floor`, `indoor-exit`)
- 예: A동 → B동 실내 위주 (`1367->1368`). 첫 50건 중 33건이 이 경우다.
- 서버는 건물 사이 실내 통로를 `EXIT_BUILDING`(`context.indoor: true`, 건물 없음, "A동에서 공용 통로로 이동하세요") →
  `FLOOR_CHANGE`(건물·층 없음) → `ENTER_BUILDING`으로 준다.
- `toRouteView`가 `EXIT_BUILDING`을 무조건 "건물 밖"으로, 실내 `FLOOR_CHANGE`를 층 이동 구간으로 처리해서 생긴다.
  통로는 "공용 통로" 같은 실내 구간으로 묶고, 통로 안 계단은 야외 계단처럼 그 구간에 "계단 포함"으로 합치는 방향이 맞다.

### 서버(백엔드)에 요청할 것

**계단 회피 경로에 계단이 들어감** (`stairs-in-avoidance`)
- 실내 계단: A동 → Q동, B동 → Q동 계단 회피 경로에 "계단 이동: G동 1층 → 2층".
- 야외 계단: A동·B동·C동 → F동, → I동 계단 회피 경로에 야외 계단 1곳.

**경로를 찾지 못하는 건물** (`no-route`, 404 `ROUTE_NOT_FOUND`)
- D동(nodeId 2411), Z1동(5510)으로 가는 경로가 모두 없다. 그래프에 연결이 안 된 것으로 보인다.

**실외 구간 이름 없음**
- 실외 step의 `road`·`landmark`가 항상 `null`이라 앱은 "건물 밖"으로만 보여준다.

## 기록

| 날짜 | 건수 | 비고 |
|---|---|---|
| 2026-10-23 | 50 (건물 ↔ 건물 A·B·C동 출발) | 문제 34건: 공용 통로 33, 계단 회피 8, 경로 없음 5 |
