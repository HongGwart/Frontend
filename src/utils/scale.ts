import { Dimensions } from 'react-native';

// 디자인 시안 기준 해상도 (보통 iPhone 기준 375x812)
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const scale = (size: number) =>
  (SCREEN_WIDTH / guidelineBaseWidth) * size;
export const verticalScale = (size: number) =>
  (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * 디바이스 크기에 따라 값을 적당히(moderate) 스케일링합니다.
 * factor가 낮을수록 원본 값에 가깝게, 높을수록 화면 크기 비례에 가깝게 조정됩니다.
 * @param size 기준 크기값
 * @param factor 스케일 강도 (기본 0.5)
 */
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;
