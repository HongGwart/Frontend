import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchPageHeader } from '@components/common/SearchPageHeader';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onBackPress?: () => void;
}

export default function SearchScreen({ value, onChangeText, onBackPress }: Props) {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.searchHeaderWrapper}>
        <SearchPageHeader value={value} onChangeText={onChangeText} onBackPress={onBackPress} />
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
