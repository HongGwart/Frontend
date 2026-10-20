# API 계약 및 iOS E2E

기준: 프론트엔드 `origin/dev`의 `6314bcc`, 백엔드 `4271ba3`.
원격에는 `develop` 대신 `dev` 브랜치가 있다.

## 격리 백엔드와 테스트 데이터

Docker와 Java 21이 필요하다. `Backend`에서 다음 명령을 실행하고 프로세스를 유지한다.

```sh
JAVA_HOME=$(/usr/libexec/java_home -v 21) PLACE_MODEL_ENABLED=true ./gradlew workspaceBrowser
```

이 작업은 Testcontainers의 PostgreSQL·Elasticsearch를 새로 만들고 실제 Spring API를
`http://localhost:18081`에 실행한다. 운영·개발 서버 데이터베이스는 사용하지 않는다.

별도 터미널에서 테스트 PostgreSQL 컨테이너를 확인한 뒤, `Frontend`에서 fixture를 만든다.

```sh
docker ps --filter label=org.testcontainers=true --filter ancestor=postgres:16 --format '{{.ID}} {{.Names}} {{.Ports}}'
python3 tests/fixtures/seed-backend.py --postgres-container <컨테이너ID> --output-dir /tmp/honggwart-api-fixture
```

도우미는 컨테이너 이미지·Testcontainers 라벨·고정 로컬 주소·테스트용 인증 키를 확인한다.
기존 fixture가 있는 서버에 다시 실행하지 말고 백엔드를 재시작해 새 컨테이너를 사용한다.
UUID와 숫자 ID는 생성 결과의 `fixtures.json`을 읽으며 앱 코드에 하드코딩하지 않는다.

## API 클라이언트와 어댑터 검증

```sh
npm ci
npm run typecheck
npm run test:api -- /tmp/honggwart-api-fixture/fixtures.json
```

실제 생성 API 함수·공통 axios 클라이언트·Zod·화면 어댑터를 실행한다. HTTP 응답은
모킹하지 않는다. 아이콘은 Node 어댑터 테스트에서만 제외한다.

검증 범위:

- 장소 UUID, 두 출입구, 동명 호실 구별 및 미매핑 숫자 노드 검색
- UUID/숫자/혼합 요청과 `SAME_PLACE` 0m·0초 성공
- 세 경로 모드, 서버 실내 비율, 실제 선택문, 엘리베이터 안내
- 시설 소개 공란, 건물 원문 소개, nullable 응답의 Zod 파싱
- 배치 CSV 직렬화·누락 목록·식별자 보존
- 저장된 평면도 기준점과 이미지 미등록 응답
- `ROUTE_NOT_FOUND`와 삭제된 대상 오류 구별, 실패한 재조회가 이전 성공 상태를 가리지 않는지
- 도면 후보의 건물·층 검증, 동명 별실 유지, 동일 UUID 출입구 중복 제거 및 선택 UUID로 실제 경로 요청

현재 시각의 API 혼잡 boolean을 그대로 검증한다. `true`일 때의 표시 회귀 검증은
실제 경로 응답의 혼잡 필드만 바꾼 별도 어댑터 검증이며, 실제 시각이 혼잡하다고 주장하지 않는다.

## iOS 앱 E2E

Xcode·iOS 시뮬레이터·CocoaPods·Maestro CLI가 필요하다.

```sh
EXPO_PUBLIC_API_URL=http://localhost:18081 EXPO_PUBLIC_USE_MOCK=false npx expo run:ios
```

이미 빌드된 앱을 실행할 때는 위 환경 변수로 Metro를 시작한다.
동일한 `exp+frontend` scheme을 가진 구형 앱이 설치된 시뮬레이터에서는 고유 scheme으로
현재 앱을 연다.

```sh
EXPO_PUBLIC_API_URL=http://localhost:18081 EXPO_PUBLIC_USE_MOCK=false REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1 npx expo start --dev-client
xcrun simctl openurl booted 'com.honggwart://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081'
maestro --device <시뮬레이터UUID> test .maestro/api-alignment.yaml --test-output-dir /tmp/honggwart-maestro-results
maestro --device <시뮬레이터UUID> test .maestro/indoor-room-routing.yaml --test-output-dir /tmp/honggwart-maestro-indoor-results
maestro --device <시뮬레이터UUID> test .maestro/api-edge-cases.yaml --test-output-dir /tmp/honggwart-maestro-edge-results
```

API 테스트와 달리 이 흐름은 실제 네이티브 화면을 탭하고 입력하여 검색 → 선택 →
경로 목록 → 경로 안내 → 도착과 동일 장소 처리를 확인한다. 경로·장소 응답을 대체하지 않는다.
네이버 지도 타일은 외부 SDK·네트워크 설정에 의존한다.

설치된 Xcode 27 / iOS 27에서 실행하기 위해 Expo 57의 Scene lifecycle 지원 패치와
`expo-build-properties`의 `ios.enableSceneSupport`를 적용했다.
근거: [Expo의 iOS Scene lifecycle 안내](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md).

도면 flow와 예외 flow는 앞선 flow가 종료한 캠퍼스맵에서 이어서 실행한다. 최초 온보딩은 실제
5페이지를 넘겨 완료하며, 테스트가 영구 저장소의 값을 직접 덮어쓰지 않는다.

`indoor-room-routing.yaml`은 건물 내부 도면의 실제 101·102·501 호실 도형을 탭한다.
후보가 없는 102호, 후보 선택 취소 후 도면 복귀, 101호 출발 선택, 도면에서 5층으로 이동,
501호 본실·별실 후보 명시 선택, 양쪽 끝점 유지와 경로 안내 도착을 검증한다.
호실의 ID를 테스트에서 주입하거나 자동으로 선택하지 않는다.

## 2026-10-21 실행 기록

- 환경: iPhone 18 Pro 시뮬레이터, iOS 27.0, Xcode 27.1.
- 실행 패키지: Expo 57.0.30, expo-build-properties 57.0.22.
- `npm run typecheck`, `git diff --check`: 통과.
- `npm run test:api`: 실제 로컬 API를 사용하는 12개 테스트 통과.
- `api-alignment.yaml`: 검색 → T동 101호 상세 → UUID 경로 요청 → 세 경로 후보 →
  안내 진행 → T동 501호 도착 → 안내 종료 통과.
- `api-edge-cases.yaml`: 동일 장소 0m·0초, 미매핑 숫자 노드 상세, 숫자 노드와 UUID의
  혼합 경로, 소개가 비어 있는 시설 화면 통과.
- `indoor-room-routing.yaml`: 도면의 호실 클릭 → 서버 후보 선택 → 출발·도착 UUID 지정 →
  실내 비율 100%·엘리베이터 1회 경로 → 도착·안내 종료 통과. 빈 후보와 취소 흐름도 통과.
- 증거는 작업 공간의 `artifacts/api-alignment-e2e-2026-10-21`에 저장했다.
  기본 흐름 성공 실행은 `maestro-root/2026-10-21_003317`이며 `commands.json`과
  상세·경로 목록·도착 스크린샷을 포함한다.
  예외 흐름 성공 실행은 `maestro-edge/2026-10-21_003740`이며 `commands.json`과
  동일 장소·미매핑 상세·혼합 경로·빈 소개 스크린샷을 포함한다.
  도면 흐름 성공 실행은 `maestro-indoor/2026-10-21_010126`이며 `commands.json`과
  빈 후보·출발 후보·선택 호실·본실/별실 후보·경로·도착 스크린샷을 포함한다.
- 테스트의 T동 실내 지도는 앱의 기존 기준점 fallback을 사용한다. fixture에 없는
  layer 3·67 조회는 예상된 404이며, 저장된/미등록 평면도 기준점 API는 별도 실제 HTTP
  테스트에서 확인했다.

기존 SVG 호실의 `placeId`가 null이고 `nodeId`도 없는 경우에는 해당 건물·층의 서버 후보를
사용자가 선택한다. 이를 도형의 영구 매핑으로 저장하지 않는다. 서버에 호실 데이터가 없거나
소속·층을 확인할 수 없는 경우에는 후보 없음 안내와 검색어 수정 기능을 제공한다.
