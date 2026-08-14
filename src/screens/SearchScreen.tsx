import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchPageHeader } from '@components/common/SearchPageHeader';
import { useVoiceSearch } from '@hooks/useVoiceSearch';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onBackPress?: () => void;
}

export default function SearchScreen({ value, onChangeText, onBackPress }: Props) {
  // 마이크 버튼 -> 듣기 시작 -> 인식된 텍스트로 검색창 내용을 그대로 갱신(중간 결과 포함).
  // expo-speech-recognition은 네이티브 모듈이라 Expo Go가 아니라 dev-client 빌드에서만 동작한다.
  const { isListening, toggleListening } = useVoiceSearch({ onResult: onChangeText });

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.searchHeaderWrapper}>
        <SearchPageHeader
          value={value}
          onChangeText={onChangeText}
          onVoicePress={toggleListening}
          isListening={isListening}
          onBackPress={onBackPress}
        />
      </View>
      <View style={styles.content} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchHeaderWrapper: { marginTop: 8 },
  content: { flex: 1 },
});
