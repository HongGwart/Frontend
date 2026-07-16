import { IndoorMapView } from '../components/map/IndoorMapView';
import VisualBackground from '@assets/svgs/floors/A_1_test.svg'; // react-native-svg-transformer로 import
import mapData from '@assets/svgs/floors/A_1_test.json'; // svgToRoomShapes.js 결과물


export function FloorScreen() {
  return (
    <IndoorMapView
      mapData={mapData}
      renderBackground={({ width, height }) => (
        <VisualBackground width={width} height={height} />
      )}
      onRoomSelect={(room) => {
        if (!room) return;
        // room.placeId로 상세정보 패널 열기
      }}
    />
  );
}