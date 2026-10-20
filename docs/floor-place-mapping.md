# 도면 호실과 배포 서버 장소 매핑

2026-10-21에 `https://dev-api.honggwart.com`의 실제 장소 UUID를
`src/assets/svgs/floors/*.json`의 `placeId`에 반영했다.

- 155개 층, 1,888개 도형 중 1,612개 연결 완료(서로 다른 장소 UUID 1,596개).
- 276개 도형은 `null`을 유지한다. 동·층·호수가 일치하는 서버 항목 없음 240개,
  서버 매핑 검수 필요 21개, UUID 미할당 12개, 여러 층에 걸친 소속 충돌 3개다.
- 도형 좌표·경로·라벨·층 정보는 변경하지 않았다. 숫자 노드 ID를 UUID로 만들거나
  임의 UUID를 생성하지 않았다.
- 전체 보류 목록과 건물별 집계, 서버 지문, 수집 시각은
  [floor-place-mapping-report.json](floor-place-mapping-report.json)에 있다.

확정된 도형의 출발·도착 버튼은 해당 UUID를 바로 사용한다. 보류된 도형은 기존처럼
검색 후보를 사용자가 고른다. 예를 들어 C동 5층 501호와 510호는 직접 연결되지만,
T동 101호는 서버가 1층·2층 문을 같은 UUID에 묶고 있어 자동 연결하지 않았다.

## 확인 기준

관리자 진단 GET의 전체 `roomCandidates`에 포함된 1,644개 UUID와 건물 21개를
공개 장소 상세 API로 다시 조회했다. 수집 전후 서버 매핑 지문과 레이어 revision이
동일하고, 요청 UUID 누락이 없음을 확인했다. 서버 총 장소 2,000개 중 나머지 335개는
이 호실 목록의 범위 밖이다. 자동완성 검색의 제한된 결과를 전체 목록으로 사용하지 않는다.

다음 조건을 모두 만족해야 도형에 UUID를 넣는다.

1. 도면의 건물 코드·층·표시 호수(`label ?? id`)가 서버의 구조화된 소속과 일치한다.
2. 대응 그룹의 UUID가 하나이고 미할당 출입구나 `needs_review`가 없다.
3. 공개 상세의 `ACTIVE`, `searchable`, 건물·층·호수·출입구가 진단 결과와 일치한다.
4. 다른 층의 출입구나 `crossFloorRoomCandidates`에 속한 UUID가 아니다.

명시적 도형 라벨이 같고 서버가 하나의 장소로 확인한 분할 도형은 같은 UUID를 사용한다.
`_2` 같은 ID 접미사만으로는 합치지 않는다. 호수의 하이픈·선행 0·지하 B 접두사는
그대로 구분한다. H동의 `H314`처럼 해당 건물 코드가 붙은 기존 표시만 `314`와 대조한다.
L동 도면에 적힌 `J101`을 임의로 다른 건물이나 `101`로 바꾸지 않는다.

## 다시 수집·검증하기

기존 관리자 키를 `HONGGWART_ADMIN_API_KEY` 환경 변수에 넣은 상태에서 실행한다.
키는 콘솔·결과 파일에 저장하지 않으며, 모든 서버 요청은 GET이다.

```sh
node scripts/fetch-floor-place-catalog.cjs \
  --base-url https://dev-api.honggwart.com --output /tmp/honggwart-place-catalog.json

# 기본 동작은 dry-run. --check는 저장값과 다르면 종료 코드 1.
node scripts/sync-floor-place-ids.cjs --catalog /tmp/honggwart-place-catalog.json --check

# 진단 결과를 검토한 뒤 실제 파일 갱신.
node scripts/sync-floor-place-ids.cjs --catalog /tmp/honggwart-place-catalog.json \
  --write --report docs/floor-place-mapping-report.json
npm run test:floors
npm run typecheck
```

이미 저장된 UUID도 새 카탈로그로 확인되지 않으면 `null`로 돌아간다.
이 데이터는 위 배포 서버에서 발급한 UUID이므로, 별도의 테스트 DB에서 생성한 UUID와
호환된다고 가정하지 않는다.

SVG 재생성은 층·원본 도형 ID·표시 라벨·좌표가 그대로일 때만 매핑을 보존한다.
변경·삭제·중복 도형은 경고와 함께 매핑을 제거하므로 다시 서버와 대조해야 한다.
기존 수동 라벨과 새 SVG 라벨이 다를 때도 자동으로 매핑을 옮기지 않는다.
