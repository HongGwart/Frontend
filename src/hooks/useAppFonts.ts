import { useFonts } from 'expo-font';

/**
 * theme/typography.ts의 fontFamily가 가리키는 Pretendard 각 굵기를 실제로 등록한다.
 * 이걸 안 하면 'Pretendard-SemiBold' 같은 font-family는 존재하지 않는 폰트라
 * RN이 조용히 시스템 기본 폰트로 대체해버려서, 굵기가 달라도 화면에서 구분이 안 된다.
 */
export function useAppFonts() {
  const [loaded] = useFonts({
    'Pretendard-Thin': require('@assets/fonts/Pretendard-Thin.otf'),
    'Pretendard-ExtraLight': require('@assets/fonts/Pretendard-ExtraLight.otf'),
    'Pretendard-Light': require('@assets/fonts/Pretendard-Light.otf'),
    'Pretendard-Regular': require('@assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('@assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('@assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('@assets/fonts/Pretendard-Bold.otf'),
    'Pretendard-ExtraBold': require('@assets/fonts/Pretendard-ExtraBold.otf'),
    'Pretendard-Black': require('@assets/fonts/Pretendard-Black.otf'),
  });
  return loaded;
}
