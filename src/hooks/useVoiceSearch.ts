import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

interface UseVoiceSearchOptions {
  /** 인식된 텍스트가 갱신될 때마다 호출된다 (말하는 도중의 중간 결과 포함) */
  onResult: (text: string) => void;
  /** 권한을 거부했거나 음성 인식을 쓸 수 없을 때. 텍스트 검색으로 안내하는 데 쓴다. */
  onUnavailable?: () => void;
}

/**
 * 마이크 권한을 요청하기 전에 앱 안에서 먼저 띄우는 안내.
 * - 'explain': 아직 한 번도 묻지 않았음 → 왜 마이크를 쓰는지 설명하고, 확인하면 시스템 권한 팝업을 띄운다.
 * - 'settings': 이미 거부해서 시스템 팝업을 다시 띄울 수 없음 → 설정에서 켜거나 텍스트로 검색하라고 안내한다.
 */
export type VoicePermissionPrompt = 'explain' | 'settings' | null;

/**
 * 마이크 버튼 하나로 "탭하면 듣기 시작, 다시 탭하거나 말이 끝나면 자동 종료"하는
 * 음성 검색을 구현하기 위한 훅. expo-speech-recognition은 네이티브 모듈이라
 * Expo Go에서는 동작하지 않고, expo-dev-client로 빌드한 앱에서만 동작한다.
 *
 * 스토어 심사 기준에 맞춰:
 * - 권한은 앱 실행 시가 아니라 마이크 버튼을 누를 때 요청하고, 시스템 팝업 전에 앱 안 안내(permissionPrompt)를 먼저 띄운다.
 * - 거부해도 텍스트 검색은 그대로 쓸 수 있다(onUnavailable로 안내만).
 * - 앱이 화면에서 벗어나면(백그라운드) 바로 듣기를 멈춘다 — 백그라운드 녹음은 하지 않는다.
 * - 음성 파일은 저장하지 않는다(recordingOptions.persist를 켜지 않음).
 */
export function useVoiceSearch({ onResult, onUnavailable }: UseVoiceSearchOptions) {
  const [isListening, setIsListening] = useState(false);
  const [permissionPrompt, setPermissionPrompt] = useState<VoicePermissionPrompt>(null);
  // onResult가 렌더마다 새로 만들어지는 인라인 함수여도 이벤트 리스너를 매번
  // 재등록하지 않도록 최신 콜백을 ref에 담아둔다.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onUnavailableRef = useRef(onUnavailable);
  onUnavailableRef.current = onUnavailable;

  const handleStart = useCallback(() => setIsListening(true), []);
  const handleEnd = useCallback(() => setIsListening(false), []);
  const handleResult = useCallback((event: { results: { transcript: string }[] }) => {
    const transcript = event.results[0]?.transcript;
    if (transcript !== undefined) onResultRef.current(transcript);
  }, []);
  const handleError = useCallback((event: { error: string; message: string }) => {
    // "no-speech"(아무 말도 안 하고 끝남) 같은 흔한 케이스도 전부 여기로 오므로,
    // 사용자에게 알림을 띄우기보다 콘솔에만 남긴다.
    console.warn('[voice search] error:', event.error, event.message);
    setIsListening(false);
  }, []);

  useSpeechRecognitionEvent('start', handleStart);
  useSpeechRecognitionEvent('end', handleEnd);
  useSpeechRecognitionEvent('result', handleResult);
  useSpeechRecognitionEvent('error', handleError);

  const beginRecognition = useCallback(() => {
    ExpoSpeechRecognitionModule.start({
      lang: 'ko-KR',
      interimResults: true,
      continuous: false,
      // 음성을 파일로 남기지 않는다(기본값이지만 심사 체크리스트 항목이라 명시).
      recordingOptions: { persist: false },
    });
  }, []);

  const startListening = useCallback(async () => {
    const permission = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    if (permission.granted) {
      beginRecognition();
      return;
    }
    // 아직 물어볼 수 있으면 앱 안 안내부터, 이미 거부해서 다시 못 물으면 설정 안내를 띄운다.
    setPermissionPrompt(permission.canAskAgain ? 'explain' : 'settings');
  }, [beginRecognition]);

  /** 'explain' 안내에서 "계속"을 눌렀을 때 — 이제 시스템 권한 팝업을 띄운다. */
  const confirmPermissionPrompt = useCallback(async () => {
    setPermissionPrompt(null);
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (result.granted) {
      beginRecognition();
    } else {
      onUnavailableRef.current?.();
    }
  }, [beginRecognition]);

  /** 안내를 닫았을 때(취소/닫기). 텍스트 검색은 그대로 쓸 수 있다. */
  const dismissPermissionPrompt = useCallback(() => {
    setPermissionPrompt(null);
  }, []);

  const stopListening = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  // 마이크 버튼 하나에 물릴 토글 핸들러. 듣고 있으면 멈추고, 아니면 시작한다.
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // 앱이 백그라운드로 가면(홈 화면, 다른 앱 전환 등) 듣던 것을 바로 버린다 — 화면에 떠 있을 때만 마이크를 쓴다.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') ExpoSpeechRecognitionModule.abort();
    });
    return () => subscription.remove();
  }, []);

  // 화면을 벗어날 때 듣는 중이면 정리
  useEffect(() => {
    return () => {
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  return { isListening, toggleListening, permissionPrompt, confirmPermissionPrompt, dismissPermissionPrompt };
}
