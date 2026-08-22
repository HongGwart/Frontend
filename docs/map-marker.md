# 지도 마커 (Marker)

Figma: [marker](https://www.figma.com/design/C8sRNwDxZGRUQuewY6yeSd/홍그와트-평면도?node-id=703-739)

## 현재 구현

- `src/components/common/Marker.tsx` — 순수 UI 컴포넌트. `favorite`(핀/별 모양) × `count` 유무(숫자 배지) ×
  `label`(상단 텍스트, `count`가 있으면 자동으로 숨김) 조합을 props로 받는다.
- `src/components/map/NaverMapMarker.tsx` — `Marker`를 `NaverMapMarkerOverlay`의
  ["Custom React View" 이미지 타입](https://github.com/mj-studio-library/react-native-naver-map)으로
  얹는 어댑터. `latitude`/`longitude`, `onPress`(→ `onTap`)를 추가로 받는다.
- `src/constant/dummyMapMarkers.ts` — 실제 건물 좌표 연동 전까지 쓰는 더미 마커 데이터.

아이콘은 Figma에서 export한 `currentColor` 기반 SVG(`markerPin.svg`, `markerDot.svg`,
`markerFavoriteShape.svg`, `star.svg`)를 조합해서 그린다. 흰 점/별 배지는 40×40 마커 박스 안에서
Figma의 inset 값을 그대로 px로 옮겨 절대 위치(`position: absolute; top/left`)로 앉혔다
(처음 구현 땐 좌표 없이 `position: absolute`만 줘서 왼쪽 위 구석에 붙는 버그가 있었음 — 수정 완료).

## "SVG를 직접 받아서 넣는 게 낫지 않을까?"

핵심은 **RN에서 SVG는 마커 이미지 소스로 못 쓴다**는 점이다 (`NaverMapMarkerOverlay`의 `image` prop은
naver 심벌 / `require()`한 PNG 등 로컬 리소스 / 네트워크 이미지 / 커스텀 React View, 이 4가지만 지원).
그래서 선택지는 둘 중 하나다.

1. **지금처럼 SVG를 React 컴포넌트로 조합해서 커스텀 뷰로 그리기** (현재 방식)
   - 장점: 색/사이즈를 테마 값으로 동적 제어 가능, 라벨·배지 조합을 코드로 유연하게 구성.
   - 단점: 라이브러리 문서상 **이미지 캐싱이 안 되고**, 마커 하나당 리소스를 많이 먹는다.
     ("아직은 단순하게만 사용하시거나 되도록이면 이미지를 사용하는 것을 추천")
2. **Figma에서 마커를 완성된 PNG로 export해서 `image={require(...)}`로 쓰기**
   - 장점: `caching ✅`. 상태 조합이 사실상 4가지(핀/별 × 배지 유무)뿐이라 PNG 4장이면 끝.
   - 라벨 텍스트는 이미지에 구울 필요 없이 `caption` prop(네이티브가 그려주는 텍스트 오버레이,
     이미지와 별개라 성능 영향 거의 없음)으로 얹으면 된다.
   - 단점: 색상을 바꾸려면 Figma에서 다시 export해야 함 (지금처럼 `theme.blue[500]` 하나 바꿔서
     전체가 바뀌는 유연함은 없음).

## 권장 방향

- **지금(개발/데모 단계)**: 컴포넌트 구조를 그대로 유지. 이미 버그도 고쳤고, 마커 종류가 아직 확정 전이라
  코드로 조합하는 게 반복 수정에 더 편하다.
- **실제 건물 마커 ~24개를 지도에 올리는 시점**: PNG 4장(핀/별 × 배지 유무, 라벨 없는 상태로) export →
  `image={require('...')}` + `caption`으로 전환. `Marker.tsx`의 시각적 스펙(색/크기/배지 위치)은 그대로
  가져다 쓰면 되므로 전환 비용은 크지 않음.
- 24개 자체는 문서에서 경고하는 "많이"의 임계치보다 한참 적어서, 지금 방식 그대로도 당장 문제될
  가능성은 낮다. 실기기에서 스크롤/줌 시 버벅임이 체감되면 그때 위 전환을 진행하면 된다.
