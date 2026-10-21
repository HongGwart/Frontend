import React from 'react';
import { View } from 'react-native';
import { useTheme } from 'styled-components/native';
import ToastWarningIcon from '@assets/svgs/icons/toastWarning.svg';

/**
 * 엘리베이터 혼잡 예상 경고 아이콘. 경로 카드(RouteResultCard)·구간 목록(RouteStepRow)이 같이 쓴다.
 * 아이콘만으로는 스크린 리더가 읽을 내용이 없어서 접근성 라벨을 붙인다.
 */
export function ElevatorCongestionIcon() {
  const theme = useTheme();
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="엘리베이터 혼잡 예상">
      <ToastWarningIcon width={16} height={16} color={theme.semantic.warning} />
    </View>
  );
}
