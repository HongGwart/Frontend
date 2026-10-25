import React, { useEffect, useState } from 'react';
import { NaverMapCategoryMarker } from './NaverMapCategoryMarker';
import { NaverMapMarker } from './NaverMapMarker';

// 마커를 누르면 강조(active) 모양 + 네임택으로 바뀌는데, NaverMapMarkerOverlay는 커스텀 뷰가 바뀔 때마다
// 이미지로 새로 래스터화해서 바뀐 모양이 늦게 뜬다. 그래서 평소 모양과 강조 모양을 둘 다 미리 그려 두고
// isHidden만 바꿔 끼워서, 누르는 즉시 모양이 바뀌게 한다. 다른 마커를 숨길 때도(hidden) 같은 방식이라
// 카드를 닫으면 바로 다시 보인다.
//
// 단, 커스텀 뷰 마커는 하나하나가 이미지로 찍혀 무거워서(라이브러리 문서), 두 모양을 한꺼번에 붙이면 칩을
// 누르거나 지도에 처음 들어갈 때 그리는 양이 두 배로 몰린다. 그래서 평소 모양을 먼저 붙이고, 강조 모양은
// 조금 뒤에(PRELOAD_DELAY_MS) 미리 붙인다. 그 전에 눌리면 그때 바로 붙인다.
const PRELOAD_DELAY_MS = 500;

/** 강조 모양을 지금 붙여둘지. 처음엔 평소 모양만 붙이고, 잠시 뒤(또는 포커싱되는 즉시) true가 된다. */
function useDeferredPreload(focused: boolean) {
  const [ready, setReady] = useState(focused);
  useEffect(() => {
    if (ready) return;
    const id = setTimeout(() => setReady(true), PRELOAD_DELAY_MS);
    return () => clearTimeout(id);
  }, [ready]);
  return ready || focused;
}

type DongMarkerProps = Omit<React.ComponentProps<typeof NaverMapMarker>, 'active' | 'hidden' | 'labelOpacity'> & {
  /** 지금 카드가 열린(포커싱된) 마커인지 — 강조 모양 + 네임택으로 보인다 */
  focused: boolean;
  hidden?: boolean;
};

/** 동(건물) 마커. 평소엔 핀만, 포커싱되면 강조된 핀 + 네임택(label). */
export function FocusableDongMarker({ focused, hidden = false, label, zIndex = 0, ...rest }: DongMarkerProps) {
  const showActive = useDeferredPreload(focused);
  return (
    <>
      <NaverMapMarker {...rest} zIndex={zIndex} hidden={hidden || focused} />
      {showActive && (
        <NaverMapMarker {...rest} label={label} active zIndex={zIndex + 1} hidden={hidden || !focused} />
      )}
    </>
  );
}

type CategoryMarkerProps = Omit<React.ComponentProps<typeof NaverMapCategoryMarker>, 'active' | 'hidden'> & {
  focused: boolean;
  hidden?: boolean;
};

/** 카테고리(편의시설) 마커. 포커싱되면 강조 모양. */
export function FocusableCategoryMarker({ focused, hidden = false, ...rest }: CategoryMarkerProps) {
  const showActive = useDeferredPreload(focused);
  return (
    <>
      <NaverMapCategoryMarker {...rest} hidden={hidden || focused} />
      {showActive && <NaverMapCategoryMarker {...rest} active hidden={hidden || !focused} />}
    </>
  );
}
