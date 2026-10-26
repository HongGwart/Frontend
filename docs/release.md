# 빌드·출시·업데이트

## 브랜치

- 기능 PR은 `dev`로 머지한다(스쿼시).
- 출시할 때 `dev` → `main` PR을 **머지 커밋**으로 머지하고(스쿼시하면 main·dev 이력이 갈라진다), `main`에서 빌드한다.
- 심사를 통과하면 그 main 커밋에 버전 태그(`v1.0.0`)를 단다. 거절되면 수정은 dev에 머지한 뒤 다시 main으로 반영한다.

## 스토어 빌드

```sh
git checkout main && git pull
eas build --profile production --platform ios   # android도 같은 방식
```

- 빌드 번호는 EAS가 자동으로 올린다(`eas.json`의 `appVersionSource: "remote"` + `autoIncrement`). 사용자에게 보이는 버전은 `app.json`의 `expo.version`을 직접 올린다.
- API 주소 등 `EXPO_PUBLIC_*` 값은 빌드 프로필의 EAS 환경(`environment`)에서 들어간다. 로컬 `.env`는 EAS 빌드에 올라가지 않는다.

## 앱 업데이트(EAS Update) — 심사 없이 JS만 바꾸기

화면·로직 같은 JS 코드와 이미지(평면도 등)만 바꿨으면 새 빌드 없이 내보낼 수 있다. 앱은 실행할 때 받아 두고 **다음 실행**부터 적용한다.

```sh
git checkout main && git pull
eas update --channel production --environment production --message "무엇을 고쳤는지"
```

- `--environment`는 생략할 수 없다(SDK 55부터 필수). 지정한 EAS 환경의 변수(`EXPO_PUBLIC_API_URL` 등)가 업데이트에 들어가니, 운영 업데이트는 반드시 `production`으로 지정한다.
- 업데이트는 **runtime version과 채널이 둘 다 맞는** 빌드만 받는다.
  - runtime version: `app.json`의 `version`(`runtimeVersion.policy: "appVersion"`). 1.0.0으로 만든 업데이트는 1.0.0 빌드만 받는다.
  - 채널: 빌드 프로필의 `channel`(`eas.json`). `production` 채널 업데이트는 production 빌드만 받고, 같은 버전의 preview 빌드는 받지 않는다.
- **새 빌드와 심사가 필요한 경우**: 네이티브 라이브러리 추가·제거·업그레이드, 권한·`app.json`의 네이티브 설정(아이콘, 권한 문구, 플러그인 등) 변경, Expo SDK 업그레이드. 이때는 `app.json`의 `version`도 올려서(예: 1.0.1) 이전 빌드가 맞지 않는 업데이트를 받지 않게 한다.
  - 예외: 그 버전이 아직 출시 전이면(심사 반려·Apple 처리 단계 반려 후 재제출) 버전은 그대로 두고 빌드 번호만 올린다. 사용자 기기에 그 버전 빌드가 없고 그 runtime version으로 올린 업데이트도 없어서 어긋날 빌드가 없다. App Store도 같은 버전에 새 빌드를 골라 다시 제출하는 흐름이다.
- 앱의 주요 목적을 바꾸는 변경은 업데이트로 내보내지 않는다(App Store 심사 가이드라인).
- 업데이트도 main에 반영된 코드로 만든다 — 사용자 기기의 코드가 어떤 커밋인지 main으로 추적할 수 있게.

채널은 빌드 프로필과 같은 이름이다(`development`·`preview`·`production`, `eas.json`). 내부 테스트는 preview 빌드를 설치해 두고 `--channel preview --environment preview`로 먼저 올려 확인한다(production 빌드에는 가지 않는다).
