import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { requireOptionalNativeModule } from 'expo';

type ScreenCaptureModule = typeof import('expo-screen-capture');

// 네이티브 모듈이라 이 패키지를 넣기 전에 빌드한 dev-client에는 없다. 그런 앱에서 패키지를 불러오면 에러가
// 나고(try/catch로 잡아도 개발 모드에선 에러 화면이 뜬다), 그래서 네이티브 모듈이 있을 때만 불러오고 없으면
// 막기만 건너뛴다.
let screenCapture: ScreenCaptureModule | null | undefined;
function getScreenCapture() {
  if (screenCapture === undefined) {
    screenCapture = requireOptionalNativeModule('ExpoScreenCapture')
      ? (require('expo-screen-capture') as ScreenCaptureModule)
      : null;
  }
  return screenCapture;
}

// 지금 캡처를 막고 있는 화면들. 라이브러리에는 항상 키 하나(LIBRARY_KEY)로만 막기/풀기를 부른다 — 키를 화면마다
// 다르게 넘기면 이미 막힌 상태에서 네이티브 막기가 또 불려서, iOS가 앱 창을 보안 텍스트필드 안에 한 번 더 겹쳐
// 넣는 바람에 화면 전체가 까맣게 나온다(경로 보기 위에 길 안내를 열 때). 그래서 막는 화면 수를 여기서 센다.
const LIBRARY_KEY = 'app';
const activeScreens = new Set<string>();

/**
 * 이 화면이 보이는 동안(포커스 + enabled) 스크린샷·화면 녹화를 막는다 — 캠퍼스 내부지도/경로가 밖으로 퍼지지 않게.
 * 마운트가 아니라 포커스 기준이다 — native-stack은 위에 화면을 쌓아도 아래 화면을 언마운트하지 않아서, 마운트
 * 기준이면 내부지도에서 길찾기를 push했을 때 길찾기 입력 화면까지 막힌다.
 * iOS는 캡처한 이미지에서 앱 화면이 비어 보이고, Android는 캡처 자체가 막힌다(최근 앱 미리보기도 빈 화면).
 *
 * key는 화면마다 다르게 준다. 경로 보기 위에 길 안내가 쌓였다가 길 안내가 닫히는 것처럼, 한 화면이 빠져도
 * 아직 떠 있는 다른 화면이 있으면 막기를 유지하고, 마지막 화면이 빠질 때만 푼다.
 */
export function useBlockScreenCapture(key: string, enabled = true) {
  const isFocused = useIsFocused();
  const active = enabled && isFocused;
  useEffect(() => {
    const module = active ? getScreenCapture() : null;
    if (!module) return;
    activeScreens.add(key);
    if (activeScreens.size === 1) module.preventScreenCaptureAsync(LIBRARY_KEY).catch(() => {});
    return () => {
      activeScreens.delete(key);
      if (activeScreens.size === 0) module.allowScreenCaptureAsync(LIBRARY_KEY).catch(() => {});
    };
  }, [key, active]);
}
