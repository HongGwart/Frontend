import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

interface UseVoiceSearchOptions {
  /** 인식된 텍스트가 갱신될 때마다 호출된다 (말하는 도중의 중간 결과 포함) */
  onResult: (text: string) => void;
  /** 실기기가 아닌 시뮬레이터/웹처럼 음성 인식 자체가 불가능한 환경에서 알려주고 싶을 때 */
  onUnavailable?: () => void;
}

/**
 * 마이크 버튼 하나로 "탭하면 듣기 시작, 다시 탭하거나 말이 끝나면 자동 종료"하는
 * 음성 검색을 구현하기 위한 훅. expo-speech-recognition은 네이티브 모듈이라
 * Expo Go에서는 동작하지 않고, expo-dev-client로 빌드한 앱에서만 동작한다.
 */
export function useVoiceSearch({ onResult, onUnavailable }: UseVoiceSearchOptions) {
  const [isListening, setIsListening] = useState(false);
  // onResult가 렌더마다 새로 만들어지는 인라인 함수여도 이벤트 리스너를 매번
  // 재등록하지 않도록 최신 콜백을 ref에 담아둔다.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useSpeechRecognitionEvent('start', () => setIsListening(true));
  useSpeechRecognitionEvent('end', () => setIsListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript !== undefined) onResultRef.current(transcript);
  });
  useSpeechRecognitionEvent('error', (event) => {
    // "no-speech"(아무 말도 안 하고 끝남) 같은 흔한 케이스도 전부 여기로 오므로,
    // 사용자에게 알림을 띄우기보다 콘솔에만 남긴다.
    console.warn('[voice search] error:', event.error, event.message);
  });

  const startListening = useCallback(async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      onUnavailable?.();
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: 'ko-KR',
      interimResults: true,
      continuous: false,
    });
  }, [onUnavailable]);

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

  // 화면을 벗어날 때 듣는 중이면 정리
  useEffect(() => {
    return () => {
      ExpoSpeechRecognitionModule.stop();
    };
  }, []);

  return { isListening, toggleListening };
}
