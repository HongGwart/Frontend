import React from 'react';
import { Linking, Modal, Pressable, StyleSheet } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import VoiceIcon from '@assets/svgs/icons/voice.svg';
import { VoicePermissionPrompt } from '@hooks/useVoiceSearch';

interface Props {
  prompt: VoicePermissionPrompt;
  /** 'explain'에서 "계속"을 누르면 호출 — 여기서 시스템 권한 팝업을 띄운다. */
  onConfirm: () => void;
  onDismiss: () => void;
}

const COPY = {
  explain: {
    title: '마이크 사용 안내',
    body:
      '강의실 이름을 말로 검색하기 위해 마이크를 사용해요.\n' +
      '말한 내용은 글자로 바꿔 검색에만 쓰이며, 음성은 저장하지 않아요.',
    confirm: '계속',
  },
  settings: {
    title: '마이크 권한이 꺼져 있어요',
    body: '음성 검색을 쓰려면 설정에서 마이크와 음성 인식 권한을 켜 주세요.\n검색창에 글자로 입력해서 검색할 수도 있어요.',
    confirm: '설정 열기',
  },
} as const;

/**
 * 마이크 권한을 요청하기 전에(시스템 팝업보다 먼저) 띄우는 앱 안 안내 팝업. 이미 거부한 상태면
 * 설정으로 보내거나 글자 검색을 안내한다. 어느 쪽이든 "닫기"를 누르면 그냥 글자로 검색하면 된다.
 */
export function VoicePermissionDialog({ prompt, onConfirm, onDismiss }: Props) {
  const theme = useTheme();
  const copy = prompt ? COPY[prompt] : null;

  const handleConfirm = () => {
    if (prompt === 'settings') {
      onDismiss();
      Linking.openSettings();
      return;
    }
    onConfirm();
  };

  return (
    <Modal transparent visible={!!copy} animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <Backdrop>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="닫기" />
        {copy && (
          <Card>
            <IconCircle>
              <VoiceIcon width={16} height={20} color={theme.blue[500]} />
            </IconCircle>
            <Title>{copy.title}</Title>
            <Body>{copy.body}</Body>
            <ButtonRow>
              <DialogButton variant="secondary" onPress={onDismiss}>
                <DialogButtonText variant="secondary">닫기</DialogButtonText>
              </DialogButton>
              <DialogButton variant="primary" onPress={handleConfirm}>
                <DialogButtonText variant="primary">{copy.confirm}</DialogButtonText>
              </DialogButton>
            </ButtonRow>
          </Card>
        )}
      </Backdrop>
    </Modal>
  );
}

const Backdrop = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-horizontal: 32px;
  background-color: rgba(0, 0, 0, 0.4);
`;

const Card = styled.View`
  width: 100%;
  align-items: center;
  padding: 24px 20px 20px;
  border-radius: 16px;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

const IconCircle = styled.View`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  background-color: ${({ theme }) => theme.semantic.background.color};
`;

const Title = styled.Text`
  font-family: ${({ theme }) => theme.typography.headline.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.headline.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.headline.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.headline.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
  text-align: center;
`;

const Body = styled.Text`
  margin-top: 8px;
  font-family: ${({ theme }) => theme.typography.labelReading.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelReading.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelReading.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelReading.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
  text-align: center;
`;

const ButtonRow = styled.View`
  flex-direction: row;
  gap: 8px;
  width: 100%;
  margin-top: 20px;
`;

// 공용 CTA Button(56px, 전체 폭)은 두 개를 나란히 놓기엔 커서, 같은 색 규칙(primary 남색 / secondary 연회색)으로 작게 만든다.
const DialogButton = styled(Pressable)<{ variant: 'primary' | 'secondary' }>`
  flex: 1;
  height: 48px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, variant }) =>
    variant === 'primary' ? theme.blue[800] : theme.semantic.background.fill};
`;

const DialogButtonText = styled.Text<{ variant: 'primary' | 'secondary' }>`
  font-family: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.bodyNormal.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.bodyNormal.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.bodyNormal.semiBold.letterSpacing}px;
  color: ${({ theme, variant }) => (variant === 'primary' ? theme.semantic.text.white : theme.semantic.text.primary)};
`;
