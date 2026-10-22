import React, { memo } from 'react';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { DoorMarker } from '@appTypes/room';

/** 도면 벽선과 같은 색 (Figma 평면도) */
const WALL_COLOR = '#1D2056';

interface Props {
  doors: DoorMarker[];
  /** 실제로 렌더링될 dp 크기 */
  width: number;
  height: number;
  /** 원본 SVG 좌표계 크기 (mapData.width/height) */
  mapWidth: number;
  mapHeight: number;
  /** 보이는 영역만 그리는 덮개 레이어(SharpViewportLayer)가 넘기는 viewBox. 없으면 도면 전체 */
  viewBox?: string;
}

/**
 * 기준 문 하나(svgToDoors.js 참고)를 층 데이터의 변환값으로 옮겨 그린다. 경첩 (0,0), 닫힌 끝 (-16,0), 열린 끝 (0,-16).
 * 흰 부채꼴 → 문짝 선과 호 → 벽선을 지우는 흰 틈과 양 끝 마감 순서로, Figma 문 그룹과 같은 모양이다.
 */
function FloorDoorsComponent({ doors, width, height, mapWidth, mapHeight, viewBox }: Props) {
  return (
    <Svg width={width} height={height} viewBox={viewBox ?? `0 0 ${mapWidth} ${mapHeight}`}>
      {doors.map((door, i) => (
        <G key={i} transform={`matrix(${door.m.join(' ')})`}>
          {door.kind !== 'opening' && (
            <>
              <Path d="M0 0H-16C-16 -8.837 -8.837 -16 0 -16Z" fill="white" />
              <Path d="M0 0V-16C-8.837 -16 -16 -8.837 -16 0" stroke={WALL_COLOR} fill="none" />
            </>
          )}
          <Rect x={-15.5} y={0} width={15} height={0.5} fill="white" />
          <Rect x={-16.5} y={0} width={1} height={0.5} fill={WALL_COLOR} />
          <Rect x={-0.5} y={0} width={1} height={0.5} fill={WALL_COLOR} />
        </G>
      ))}
    </Svg>
  );
}

export const FloorDoors = memo(FloorDoorsComponent);
