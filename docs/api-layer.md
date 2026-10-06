# API 계층 사용 규칙

서버(Swagger: `<EXPO_PUBLIC_API_URL>/swagger-ui/index.html`)와 통신하는 코드는 모두 `src/api/`에 둔다.

## 구조
| 파일 | 역할 | 직접 수정 |
|---|---|---|
| `generated/` | orval이 Swagger에서 만든 요청 함수·타입·쿼리 훅(`useAutocomplete`, `useNode`, `useRoute`)·zod 스키마 | ❌ (`npm run api:gen`으로만 갱신) |
| `client.ts` | 공통 axios 인스턴스. baseURL·timeout, 실패를 `ApiError`로 정규화 | ⭕ |
| `errors.ts` | `ApiError`(kind/status/code/serverMessage), 사용자용 문구 결정 | ⭕ |
| `queryClient.ts` | TanStack Query 설정, 전역 에러 토스트, 앱 포그라운드 복귀 시 갱신 | ⭕ |
| `errorToast.tsx` | 전역 에러 토스트 저장소 + `<ApiErrorToastHost />`(App 루트) | ⭕ |
| `{도메인}/` | 생성 훅을 화면에 맞게 감싼 훅(디바운스, 응답 → 화면 모델 변환 등). 예: `search/useSearchSuggestions.ts`, `route/useRouteSearch.ts`(+ `route/toRouteView.ts`: 경로 응답 → 경로 카드·지도·길 안내 모델) | ⭕ |

## 규칙
- 화면은 axios를 직접 부르지 않고 **쿼리 훅**만 쓴다. 응답을 화면 모델로 바꾸는 일은 `{도메인}/` 훅에서 한다.
- 요청 함수는 토스트를 띄우지 않는다. 실패는 항상 `ApiError`로 throw되고, 전역 핸들러가 토스트를 띄운다.
  - 문구 우선순위: 서버 `error.message` → 쿼리의 `meta.errorMessage` → 종류별 기본 문구
  - 화면에서 직접 처리할 실패는 `meta: { silent: true }`
- 서버 스펙이 바뀌면 `npm run api:gen` 후 생성물 변경분을 같이 커밋한다(서버가 꺼져 있어도 빌드되게).

## 환경 변수
`.env.example`을 `.env`로 복사한다.
- `EXPO_PUBLIC_API_URL`: 서버 주소
- `EXPO_PUBLIC_USE_MOCK`: `true`면 서버를 부르지 않고 앱 더미 데이터만 쓴다

환경 변수를 바꾼 뒤에는 Metro를 다시 시작한다(`npx expo start -c`).

## 알려진 제약
- 길찾기는 출발/도착을 **둘 다 서버 검색 결과**로 골랐을 때만 서버 경로를 쓴다. 앱 더미 장소(즐겨찾기·기본 출발지 포함)가 끼면 기존 더미/테스트 경로를 보여준다.
- 서버는 엘리베이터로 여러 층을 가도 층마다 `FLOOR_CHANGE`를 따로 주고 `summary.features`도 층마다 센다. 앱(`toRouteView`)에서 한 번의 층 이동으로 합쳐 보여준다.
- Swagger 스키마에 `required`/`nullable`이 없어 생성 타입의 필드가 전부 optional이다(백엔드에 요청함, #28).
