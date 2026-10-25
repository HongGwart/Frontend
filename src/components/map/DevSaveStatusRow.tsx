import React from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';

/** [개발용] 개발용 지도 모드가 찍은 값을 Metro 개발 서버로 파일에 저장하는 상태 */
export type DevSaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

const SAVE_STATUS_TEXT: Record<DevSaveStatus, string> = {
  idle: '',
  saving: '저장 중…',
  saved: '파일에 저장됨',
  failed: '저장 실패 — Metro(expo start)를 껐다 켠 뒤 다시 저장을 누르세요',
};

/** 파일 저장 상태 한 줄 + 실패했을 때 다시 저장 버튼. 건물 덮개 찍기 패널이 쓴다. */
export function DevSaveStatusRow({ status, onRetry }: { status: DevSaveStatus; onRetry: () => void }) {
  if (status === 'idle') return null;
  return (
    <StatusRow>
      {status === 'failed' ? (
        <PanelWarning style={{ flex: 1 }}>{SAVE_STATUS_TEXT[status]}</PanelWarning>
      ) : (
        <PanelHint style={{ flex: 1 }}>{SAVE_STATUS_TEXT[status]}</PanelHint>
      )}
      {status === 'failed' && (
        <RetryButton onPress={onRetry}>
          <RetryButtonText>다시 저장</RetryButtonText>
        </RetryButton>
      )}
    </StatusRow>
  );
}

const StatusRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const RetryButton = styled(Pressable)`
  padding: 6px 12px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;

const RetryButtonText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const PanelWarning = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  color: #d93025;
`;

const PanelHint = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;
