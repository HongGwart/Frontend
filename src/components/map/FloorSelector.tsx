import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styled, { useTheme } from 'styled-components/native';
import { FloorInfo } from '@constant/floorMaps';

interface Props {
  /** 높은 층이 위로 오게 정렬된 층 목록 (getBuildingFloors 결과) */
  floors: FloorInfo[];
  selectedFloorId: string;
  onSelect: (floorId: string) => void;
  /** 층 선택기가 차지할 수 있는 최대 높이. 6개 층 높이보다 작으면 이 높이에서 스크롤된다. */
  maxHeight?: number;
}

// 한 번에 보여줄 최대 층 수. 이보다 많으면 나머지는 안에서 세로 스크롤된다.
const MAX_VISIBLE_FLOORS = 6;
// 스크롤해서 더 볼 층이 있는 쪽 끝에 까는 흰색 페이드 높이
const FADE_HEIGHT = 28;

/**
 * 건물 내부 지도의 층 선택기. Figma "floors"(774:5332) — 폭 40px 세로 필, 층 사이 1px
 * 구분선, 선택된 층만 남색(background.brand) 배경에 흰 굵은 글씨. 위아래 끝만 둥글다.
 * 층은 최대 6개까지 보이고 나머지는 스크롤되며, 더 볼 층이 있는 쪽(위/아래)에 흰색 페이드를 깐다.
 */
export function FloorSelector({ floors, selectedFloorId, onSelect, maxHeight }: Props) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  // 층 버튼마다 실제 높이/위치(첫·끝 층은 위아래 여백이 더 커서 높이가 다르다)를 재서, 6개 높이와
  // 선택된 층으로 스크롤할 위치를 구한다.
  const [rowLayouts, setRowLayouts] = useState<Record<string, { y: number; height: number }>>({});
  const handleRowLayout = useCallback((floorId: string, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setRowLayouts(prev =>
      prev[floorId]?.y === y && prev[floorId]?.height === height ? prev : { ...prev, [floorId]: { y, height } },
    );
  }, []);

  const scrollable = floors.length > MAX_VISIBLE_FLOORS;
  const lastVisible = rowLayouts[floors[MAX_VISIBLE_FLOORS - 1]?.floorId];
  // 6번째 층 버튼 아래 끝까지가 한 화면. 아직 못 쟀으면 maxHeight만 적용한다.
  const sixFloorsHeight = scrollable && lastVisible ? lastVisible.y + lastVisible.height : undefined;
  const viewportHeight =
    sixFloorsHeight !== undefined && maxHeight !== undefined ? Math.min(sixFloorsHeight, maxHeight) : sixFloorsHeight ?? maxHeight;

  // 스크롤 위치에 따라 위/아래에 더 볼 층이 남았는지
  const [edges, setEdges] = useState({ top: false, bottom: false });
  const contentHeightRef = useRef(0);
  const offsetRef = useRef(0);
  const updateEdges = useCallback(() => {
    if (viewportHeight === undefined) return;
    const top = offsetRef.current > 1;
    const bottom = offsetRef.current + viewportHeight < contentHeightRef.current - 1;
    setEdges(prev => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
  }, [viewportHeight]);
  useEffect(updateEdges, [updateEdges]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = event.nativeEvent.contentOffset.y;
    updateEdges();
  };

  // 선택된 층이 보이는 범위 밖이면(예: 16층짜리 건물에서 처음 1층) 그 층이 가운데 오도록 스크롤한다.
  const selectedRow = rowLayouts[selectedFloorId];
  useEffect(() => {
    if (!scrollable || !selectedRow || viewportHeight === undefined) return;
    const visibleTop = offsetRef.current;
    const visibleBottom = visibleTop + viewportHeight;
    if (selectedRow.y >= visibleTop && selectedRow.y + selectedRow.height <= visibleBottom) return;
    const target = Math.max(0, selectedRow.y - (viewportHeight - selectedRow.height) / 2);
    scrollRef.current?.scrollTo({ y: target, animated: false });
    offsetRef.current = target;
    updateEdges();
  }, [scrollable, selectedRow, viewportHeight, updateEdges]);

  const fadeColor = theme.semantic.background.primary;

  return (
    <Shadow>
      <Pill>
        <ScrollView
          ref={scrollRef}
          style={{ maxHeight: viewportHeight }}
          bounces={false}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onContentSizeChange={(_, height) => {
            contentHeightRef.current = height;
            updateEdges();
          }}
        >
          {floors.map((floor, index) => {
            const selected = floor.floorId === selectedFloorId;
            return (
              <FloorButton
                key={floor.floorId}
                onPress={() => onSelect(floor.floorId)}
                onLayout={event => handleRowLayout(floor.floorId, event)}
                selected={selected}
                isFirst={index === 0}
                isLast={index === floors.length - 1}
              >
                <FloorText selected={selected} numberOfLines={1}>
                  {floor.label}
                </FloorText>
              </FloorButton>
            );
          })}
        </ScrollView>
        {edges.top && (
          <LinearGradient
            pointerEvents="none"
            colors={[fadeColor, `${fadeColor}00`]}
            style={[styles.fade, styles.fadeTop]}
          />
        )}
        {edges.bottom && (
          <LinearGradient
            pointerEvents="none"
            colors={[`${fadeColor}00`, fadeColor]}
            style={[styles.fade, styles.fadeBottom]}
          />
        )}
      </Pill>
    </Shadow>
  );
}

const styles = StyleSheet.create({
  fade: { position: 'absolute', left: 0, right: 0, height: FADE_HEIGHT },
  fadeTop: { top: 0 },
  fadeBottom: { bottom: 0 },
});

// Figma drop-shadow: 0px 0px 5px rgba(0,0,0,0.05) — Pill의 overflow:hidden에 잘리지 않게 바깥에 건다.
const Shadow = styled.View`
  width: 40px;
  border-radius: 100px;
  shadow-color: #000;
  shadow-offset: 0px 0px;
  shadow-opacity: 0.05;
  shadow-radius: 5px;
  elevation: 3;
`;

// 층 사이 1px 구분선은 Figma처럼 버튼 사이 간격(gap 1px)으로 비치는 배경색으로 만든다.
const Pill = styled.View`
  width: 40px;
  border-radius: 100px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.semantic.line.tertiary};
`;

const FloorButton = styled(Pressable)<{ selected: boolean; isFirst: boolean; isLast: boolean }>`
  align-items: center;
  justify-content: center;
  padding-top: ${({ isFirst }) => (isFirst ? 10 : 6)}px;
  padding-bottom: ${({ isLast }) => (isLast ? 10 : 6)}px;
  margin-bottom: ${({ isLast }) => (isLast ? 0 : 1)}px;
  background-color: ${({ theme, selected }) =>
    selected ? theme.semantic.background.brand : theme.semantic.background.primary};
`;

const FloorText = styled.Text<{ selected: boolean }>`
  font-family: ${({ theme, selected }) =>
    selected ? theme.typography.bodyNormal.semiBold.fontFamily : theme.typography.bodyNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.medium.letterSpacing}px;
  color: ${({ theme, selected }) => (selected ? theme.semantic.text.white : theme.semantic.text.tertiary)};
`;
