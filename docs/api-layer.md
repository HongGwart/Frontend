# API 계층 사용 규칙

서버(Swagger: `<EXPO_PUBLIC_API_URL>/swagger-ui/index.html`)와 통신하는 코드는 모두 `src/api/`에 둔다.

## 구조
| 파일 | 역할 | 직접 수정 |
|---|---|---|
| `generated/` | orval이 Swagger에서 만든 검색·장소·소개·길찾기·평면도 요청 함수, 타입, 쿼리 훅, Zod 스키마 | ❌ (`npm run api:gen`으로만 갱신) |
| `client.ts` | 공통 axios 인스턴스. baseURL·timeout, 실패를 `ApiError`로 정규화 | ⭕ |
| `errors.ts` | `ApiError`(kind/status/code/serverMessage), 사용자용 문구 결정 | ⭕ |
| `queryClient.ts` | TanStack Query 설정, 전역 에러 토스트, 앱 포그라운드 복귀 시 갱신 | ⭕ |
| `errorToast.tsx` | 전역 에러 토스트 저장소 + `<ApiErrorToastHost />`(App 루트) | ⭕ |
| `{도메인}/` | 생성 훅을 화면에 맞게 감싼 훅(디바운스, 응답 → 화면 모델 변환 등). 예: `search/useSearchSuggestions.ts`, `route/useRouteSearch.ts`(+ `route/toRouteView.ts`: 경로 응답 → 경로 카드·지도·길 안내 모델), `node/useNodeDetail.ts`(장소 상세 → 시설 카드의 층·호실·출입구), `floorPlan/useFloorGeoAnchors.ts`(평면도 기준 꼭짓점 + Figma 도면 기준점 → 지도에 앉힐 네 모서리) | ⭕ |

## 규칙
- 화면은 axios를 직접 부르지 않고 **쿼리 훅**만 쓴다. 응답을 화면 모델로 바꾸는 일은 `{도메인}/` 훅에서 한다.
- 요청 함수는 토스트를 띄우지 않는다. 실패는 항상 `ApiError`로 throw되고, 전역 핸들러가 토스트를 띄운다.
  - 문구 우선순위: 서버 `error.message` → 쿼리의 `meta.errorMessage` → 종류별 기본 문구
  - 화면에서 직접 처리할 실패는 `meta: { silent: true }`
- 서버 스펙이 바뀌면 `npm run api:gen` 후 생성물 변경분을 같이 커밋한다(서버가 꺼져 있어도 빌드되게).
- 로컬 백엔드 스펙은 `OPENAPI_SPEC=/절대/경로/openapi.json npm run api:gen`으로 생성할 수 있다.
- `orval.config.ts`는 Springdoc의 잘못된 nullable `$ref` 표현과 실제 DTO가 반환하는 일부 null 필드를 보정한다. 생성물을 직접 수정하지 말고 백엔드 계약이 바뀔 때 보정 목록도 검토한다.

## 환경 변수
`.env.example`을 `.env`로 복사한다.
- `EXPO_PUBLIC_API_URL`: 서버 주소
- `EXPO_PUBLIC_USE_MOCK`: `true`면 서버를 부르지 않고 앱 더미 데이터만 쓴다

환경 변수를 바꾼 뒤에는 Metro를 다시 시작한다(`npx expo start -c`).

## 장소·길찾기 계약
- 검색·최근 검색·즐겨찾기·화면 이동에 `placeId`(UUID)와 `nodeId`(숫자)를 따로 보존한다. 키는 UUID → 숫자 ID → 기존 로컬 이름 순이며 이름으로 서로 다른 서버 장소를 합치지 않는다.
- 길찾기는 각 끝점에 UUID가 있으면 `fromPlaceId`/`toPlaceId`만 보내고, 없으면 숫자 노드 ID를 보낸다. UUID가 null인 미매핑 검색 결과도 유효한 서버 노드다.
- `SAME_PLACE`는 동일 장소 성공으로 0m·0초 안내만 표시한다. 지도 경로선과 안내 시작 버튼을 만들지 않는다.
- 경로 없음은 404와 `ROUTE_NOT_FOUND` 조합으로만 판정한다. 삭제된 노드·장소 등의 실패는 별도 API 오류 메시지를 표시한다.
- 경로 카드의 실내 비율과 혼잡 표시는 서버의 `summary.indoorPercent`, `summary.elevatorCongested`를 사용한다. 개별 엘리베이터는 `meta.congested`를 사용하며 시간표 기반 예상임을 표시한다. 서버가 합친 `FLOOR_CHANGE`를 다시 합치지 않는다.
- 경로 캐시는 30초 뒤 오래된 값이 되며 새 화면 마운트에서 다시 요청한다. 같은 출발·도착을 다시 선택할 때도 새 탐색 revision으로 갱신한다. 안내 시작 시 선택한 `RouteView`를 네비게이션 파라미터에 고정해 재조회 결과와 진행 중인 안내 단계가 섞이지 않게 한다.
- 실서비스 모드에서는 더미 검색 결과나 임의 더미 경로로 대체하지 않는다. 서버 식별자가 없는 예전 저장 항목은 검색에서 다시 선택하도록 안내한다. 기존 즐겨찾기를 삭제하거나 이름으로 UUID를 추측하지 않는다.

## 상세·소개
- UUID는 장소 상세, 미매핑 숫자 ID는 노드 상세와 노드 소개, 건물 코드는 건물 소개 API를 사용한다.
- 장소의 `entrances[].primary`와 노드의 `entrances[].isPrimary`를 구분한다. 경로의 실제 문은 서버가 선택한 `usedNodeId`와 `entranceName`을 따른다.
- 소개 공란은 공란으로 유지한다. 시설에 건물 소개나 더미 소개를 대신 넣지 않는다. 운영시간은 서버 원문을 표시하며 실시간 영업 상태로 해석하지 않는다.
- 서버가 제공하지 않는 사진·주변상권 목록은 기존 로컬 자료를 사용한다.

## 도면 호실에서 길찾기
- 도형에 검증된 UUID/노드 ID가 있으면 해당 ID로 출발·도착을 지정한다. ID가 없으면 버튼이 서버 검색 후보 화면을 연다.
- `search/useIndoorRoomCandidates.ts`가 자동완성과 장소 상세/노드 소개 API를 조회한다. 표시명에서 소속을 추론하지 않고 `building.code`와 `floor`가 도면과 일치하는 후보만 보여준다.
- 결과가 하나여도 사용자가 직접 선택한다. 같은 호수의 별실은 UUID가 다르면 별도 후보이고, 같은 UUID의 여러 출입구만 중복을 제거한다.
- 후보 선택은 현재 길찾기의 끝점만 설정한다. 도형의 영구 매핑이나 다른 동명 도형을 함께 변경하지 않는다.
- 후보 화면은 검색어 수정, 로딩·오류·재시도·빈 결과, 취소 후 도면 복귀를 지원한다. 입력 변경과 재조회 중에는 이전 후보를 선택할 수 없다.
- 길찾기에서 반대쪽 입력을 열면 해당 건물의 도면으로 다시 이동할 수 있다. 기존 끝점은 유지되며 새로 선택한 쪽만 갱신한다.

검증 방법은 [API·iOS E2E](api-e2e.md)를 참고한다.
