import React, { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';
import { NaverMapMarker } from './NaverMapMarker';

// 캠퍼스 동 코드. 이 순서대로 하나씩 지도에서 위치를 찍는다.
export const PIN_BUILDING_CODES = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'MH',
  'P', 'Q', 'R', 'S', 'T', 'U', 'Z1', 'Z2', 'Z3',
];

interface Coord {
  latitude: number;
  longitude: number;
}

/**
 * [개발용] 지도에서 각 동 위치를 직접 탭해 좌표를 모으는 모드. 탭할 때마다 "[PIN]" 로그를,
 * 전부 찍거나 완료를 누르면 "[PINS]" JSON 로그를 Metro에 남긴다 — 그 값을 마커 데이터에 옮긴다.
 * __DEV__에서만 켤 수 있고, 릴리스 빌드엔 버튼 자체가 안 뜬다.
 */
export function useDevBuildingPins() {
  const [active, setActive] = useState(false);
  const [pins, setPins] = useState<Record<string, Coord | null>>({});
  const [index, setIndex] = useState(0);
  const currentCode = PIN_BUILDING_CODES[index];

  const logAll = useCallback((all: Record<string, Coord | null>) => {
    console.log(`[PINS] ${JSON.stringify(all)}`);
  }, []);

  const record = useCallback(
    (coord: Coord | null) => {
      if (!currentCode) return;
      const next = { ...pins, [currentCode]: coord };
      setPins(next);
      console.log(`[PIN] ${currentCode}동 ${coord ? `${coord.latitude.toFixed(7)}, ${coord.longitude.toFixed(7)}` : '(건너뜀)'}`);
      if (index + 1 >= PIN_BUILDING_CODES.length) logAll(next);
      setIndex(i => i + 1);
    },
    [currentCode, pins, index, logAll],
  );

  const handleTap = useCallback(
    ({ latitude, longitude }: Coord) => record({ latitude, longitude }),
    [record],
  );

  const undo = useCallback(() => {
    if (index === 0) return;
    const prevCode = PIN_BUILDING_CODES[index - 1];
    setPins(prev => {
      const next = { ...prev };
      delete next[prevCode];
      return next;
    });
    console.log(`[PIN] ${prevCode}동 되돌림`);
    setIndex(i => i - 1);
  }, [index]);

  return {
    active,
    toggle: () => setActive(prev => !prev),
    currentCode,
    index,
    pins,
    handleTap,
    skip: () => record(null),
    undo,
    finish: () => {
      logAll(pins);
      setActive(false);
    },
  };
}

type PinPicker = ReturnType<typeof useDevBuildingPins>;

/** 찍어둔 동 마커들. NaverMapView의 children으로 넣는다. */
export function DevBuildingPinMarkers({ picker }: { picker: PinPicker }) {
  if (!picker.active) return null;
  return (
    <>
      {Object.entries(picker.pins).map(([code, coord]) =>
        coord ? (
          <NaverMapMarker
            key={`dev-pin-${code}`}
            latitude={coord.latitude}
            longitude={coord.longitude}
            label={`${code}동`}
            zIndex={10}
          />
        ) : null,
      )}
    </>
  );
}

/** 토글 버튼 + 모드가 켜졌을 때 상단 안내/조작 패널. 지도 위(NaverMapView 형제)에 absolute로 얹는다. */
export function DevBuildingPinPanel({ picker, topInset }: { picker: PinPicker; topInset: number }) {
  if (!__DEV__) return null;
  const done = !picker.currentCode;

  return (
    <>
      <ToggleButton onPress={picker.toggle} active={picker.active}>
        <ToggleText>📍</ToggleText>
      </ToggleButton>

      {picker.active && (
        <Panel style={{ top: topInset + 8 }}>
          <PanelTitle>
            {done
              ? '모든 동을 찍었어요'
              : `${picker.currentCode}동 위치를 탭하세요 (${picker.index + 1}/${PIN_BUILDING_CODES.length})`}
          </PanelTitle>
          <ButtonRow>
            <PanelButton onPress={picker.undo} disabled={picker.index === 0}>
              <PanelButtonText>되돌리기</PanelButtonText>
            </PanelButton>
            {!done && (
              <PanelButton onPress={picker.skip}>
                <PanelButtonText>건너뛰기</PanelButtonText>
              </PanelButton>
            )}
            <PanelButton onPress={picker.finish} primary>
              <PanelButtonText primary>완료</PanelButtonText>
            </PanelButton>
          </ButtonRow>
        </Panel>
      )}
    </>
  );
}

const ToggleButton = styled(Pressable)<{ active: boolean }>`
  position: absolute;
  left: 16px;
  bottom: 120px;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, active }) => (active ? theme.semantic.background.brand : theme.semantic.background.primary)};
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 6px;
  elevation: 4;
`;

const ToggleText = styled.Text`
  font-size: 20px;
`;

const Panel = styled.View`
  position: absolute;
  left: 16px;
  right: 16px;
  z-index: 20;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.semantic.background.primary};
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 8px;
  elevation: 6;
`;

const PanelTitle = styled.Text`
  font-family: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontSize}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const ButtonRow = styled.View`
  flex-direction: row;
  gap: 8px;
`;

const PanelButton = styled(Pressable)<{ primary?: boolean }>`
  flex: 1;
  align-items: center;
  padding-vertical: 8px;
  border-radius: 8px;
  background-color: ${({ theme, primary }) => (primary ? theme.semantic.background.brand : theme.semantic.background.fill)};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

const PanelButtonText = styled.Text<{ primary?: boolean }>`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  color: ${({ theme, primary }) => (primary ? theme.semantic.text.white : theme.semantic.text.primary)};
`;
