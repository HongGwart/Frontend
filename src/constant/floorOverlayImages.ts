// scripts/renderFloorOverlay.js가 생성하는 파일 — 직접 고치지 말고 스크립트를 다시 돌린다.
import { ImageRequireSource } from 'react-native';
import { Region } from '@mj-studio/react-native-naver-map';
import { FloorGeoAnchors } from '@utils/floorGeoTransform';

export interface FloorOverlayImage {
  /** 건물 기울기만큼 미리 돌려 구운 투명 배경 평면도 PNG */
  image: ImageRequireSource;
  /** PNG를 펴 붙일 남북 정렬 사각형 */
  region: Region;
  /** PNG를 구울 때 쓴 기준점. 지금 기준점과 다르면 PNG가 낡은 것이다 */
  anchors: FloorGeoAnchors;
}

/* DATA {} DATA */
export const FLOOR_OVERLAY_IMAGES: Record<string, FloorOverlayImage> = {
};
