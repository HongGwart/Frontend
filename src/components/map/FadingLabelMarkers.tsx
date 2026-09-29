import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { NaverMapMarker } from './NaverMapMarker';
import { animateValue } from '@utils/animateValue';

export interface FadingLabelMarkerItem {
  key: string;
  latitude: number;
  longitude: number;
  label?: string;
  favorite?: boolean;
  count?: number;
  onPress?: () => void;
}

export interface FadingLabelMarkersRef {
  /** 지도 카메라가 움직일 때마다 현재 줌을 넘겨준다(NaverMapView onCameraChanged). */
  onZoomChange: (zoom: number) => void;
}

interface Props {
  items: FadingLabelMarkerItem[];
  /** 이 줌보다 축소하면 네임택을 숨긴다. */
  hideBelowZoom: number;
  initialZoom: number;
}

// 핀치 줌은 기준값 근처에서 미세하게 오르내려서, 기준 하나로 켜고 끄면 네임택이 깜빡인다.
// 숨길 때와 다시 보일 때의 기준을 이만큼 벌려(히스테리시스) 경계에서 흔들리지 않게 한다.
const HYSTERESIS = 0.15;
// 사라질 땐 빠르게, 나타날 땐 조금 여유 있게.
const FADE_OUT_MS = 180;
const FADE_IN_MS = 260;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * 지도를 일정 줌 이하로 축소하면 동 마커 네임택(R동, T동 …)을 페이드아웃하고, 다시 확대하면
 * 페이드인하는 마커 묶음. 네임택 투명도 애니메이션이 매 프레임 상태를 바꾸기 때문에, 그 리렌더가
 * 지도 화면(MapScreen) 전체로 번지지 않도록 마커와 상태를 이 컴포넌트 안에 가둔다. 줌도 props가
 * 아니라 ref(onZoomChange)로 받아서, 카메라가 움직이는 동안 부모는 다시 그려지지 않는다.
 */
export const FadingLabelMarkers = forwardRef<FadingLabelMarkersRef, Props>(function FadingLabelMarkers(
  { items, hideBelowZoom, initialZoom },
  ref,
) {
  const [visible, setVisible] = useState(initialZoom >= hideBelowZoom);
  const visibleRef = useRef(visible);

  useImperativeHandle(
    ref,
    () => ({
      onZoomChange: zoom => {
        const next = visibleRef.current ? zoom >= hideBelowZoom - HYSTERESIS : zoom >= hideBelowZoom + HYSTERESIS;
        if (next === visibleRef.current) return;
        visibleRef.current = next;
        setVisible(next);
      },
    }),
    [hideBelowZoom],
  );

  const [opacity, setOpacity] = useState(visible ? 1 : 0);
  const opacityRef = useRef(opacity);
  useEffect(
    () =>
      // 도중에 다시 넘나들면 cleanup으로 이전 애니메이션을 멈추고 지금 투명도에서 이어서 움직인다.
      animateValue({
        from: opacityRef.current,
        to: visible ? 1 : 0,
        durationMs: visible ? FADE_IN_MS : FADE_OUT_MS,
        easing: easeInOutCubic,
        onUpdate: value => {
          opacityRef.current = value;
          setOpacity(value);
        },
      }),
    [visible],
  );

  return (
    <>
      {items.map(({ key, ...item }) => (
        <NaverMapMarker key={key} {...item} labelOpacity={opacity} />
      ))}
    </>
  );
});
