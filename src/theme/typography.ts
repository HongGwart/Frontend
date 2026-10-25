export const fontFamily = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semiBold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
};

// letterSpacing은 %를 px 근사치로 변환해서 사용 (RN은 % 미지원)
// -3% of 24px ≈ -0.72, -2% of 16px ≈ -0.32 식으로 폰트 사이즈별 계산
export const typography = {
  title: {
    bold: {
      fontFamily: fontFamily.bold,
      fontSize: 24,
      lineHeight: 24 * 1.4,
      letterSpacing: 24 * -0.03,
    },
    regular: {
      fontFamily: fontFamily.regular,
      fontSize: 24,
      lineHeight: 24 * 1.4,
      letterSpacing: 24 * -0.03,
    },
  },
  heading: {
    semiBold: {
      fontFamily: fontFamily.semiBold,
      fontSize: 20,
      lineHeight: 20 * 1.4,
      letterSpacing: 20 * -0.03,
    },
    regular: {
      fontFamily: fontFamily.regular,
      fontSize: 20,
      lineHeight: 20 * 1.4,
      letterSpacing: 20 * -0.03,
    },
  },
  headline: {
    semiBold: {
      fontFamily: fontFamily.semiBold,
      fontSize: 18,
      lineHeight: 18 * 1.4,
      letterSpacing: 18 * -0.02,
    },
    regular: {
      fontFamily: fontFamily.regular,
      fontSize: 18,
      lineHeight: 18 * 1.4,
      letterSpacing: 18 * -0.02,
    },
  },
  bodyNormal: {
    semiBold: {
      fontFamily: fontFamily.semiBold,
      fontSize: 16,
      lineHeight: 16 * 1.5,
      letterSpacing: 16 * -0.02,
    },
    medium: {
      fontFamily: fontFamily.medium,
      fontSize: 16,
      lineHeight: 16 * 1.5,
      letterSpacing: 16 * -0.02,
    },
  },
  bodyReading: {
    semiBold: {
      fontFamily: fontFamily.semiBold,
      fontSize: 16,
      lineHeight: 16 * 1.6,
      letterSpacing: 16 * -0.02,
    },
    medium: {
      fontFamily: fontFamily.medium,
      fontSize: 16,
      lineHeight: 16 * 1.6,
      letterSpacing: 16 * -0.02,
    },
  },
  labelNormal: {
    semiBold: {
      fontFamily: fontFamily.semiBold,
      fontSize: 14,
      lineHeight: 14 * 1.5,
      letterSpacing: 14 * -0.02,
    },
    medium: {
      fontFamily: fontFamily.medium,
      fontSize: 14,
      lineHeight: 14 * 1.5,
      letterSpacing: 14 * -0.02,
    },
  },
  labelReading: {
    semiBold: {
      fontFamily: fontFamily.semiBold,
      fontSize: 14,
      lineHeight: 14 * 1.6,
      letterSpacing: 14 * -0.02,
    },
    medium: {
      fontFamily: fontFamily.medium,
      fontSize: 14,
      lineHeight: 14 * 1.6,
      letterSpacing: 14 * -0.02,
    },
  },
  caption: {
    semiBold: {
      fontFamily: fontFamily.semiBold,
      fontSize: 12,
      lineHeight: 12 * 1.5,
      letterSpacing: 12 * -0.02,
    },
    medium: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      lineHeight: 12 * 1.5,
      letterSpacing: 12 * -0.02,
    },
  },
};

export type TypographyType = typeof typography;
