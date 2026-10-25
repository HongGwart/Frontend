// theme/globalStyles.ts
import { StyleSheet } from 'react-native';
import { moderateScale } from '../utils/scale';

/**
 * 전역적으로 사용되는 style을 정의합니다. 공통으로 적용되는 style들의 위계는
 * globalStyles -> screenStyles (각 .screen.tsx 파일에서 정의) -> styles (각 섹션별 .tsx 파일에서 정의) 순입니다.
 */
export const globalStyles = StyleSheet.create({
  /**
   * 일반적인 스크린들의 좌우 여백. 좌우에 20px 여백을 줍니다.
   */
  screen__horizontalPadding: {
    paddingHorizontal: moderateScale(20),
  },

  /**
   * Auth 스크린 좌우 여백. 좌우에 25px 여백을 줍니다.
   */
  // authScreen__horizontalPadding: {
  //   paddingHorizontal: moderateScale(25),
  // },

  /**
   * 유입경로/온보딩류 페이지 좌우 여백. 좌우에 12px 여백을 줍니다.
   */
  // funnelScreen__horizontalPadding: {
  //   paddingHorizontal: moderateScale(12),
  // },

  /**
   * 지도 스크린 등 풀스크린으로 여백 없이 써야 하는 경우.
   */
  // mapScreen__noPadding: {
  //   paddingHorizontal: 0,
  // },
});
