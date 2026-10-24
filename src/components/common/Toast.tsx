import React from 'react';
import styled, { useTheme } from 'styled-components/native';
import WarningIcon from '@assets/svgs/icons/toastWarning.svg';
import CheckCircleIcon from '@assets/svgs/icons/checkCircle.svg';

interface Props {
  text: string;
  /**
   * 'warning' - 주의/경고 안내 (기본값)
   * 'success' - 완료 안내. 즐겨찾기 등록/해제처럼 체크 아이콘이 어울리는 경우 거의 이걸 쓰게 된다.
   */
  variant?: 'warning' | 'success';
}

/**
 * 화면 하단 등에 잠깐 띄우는 토스트. Figma "toast"(785:7253, success 예시: 811:5110).
 * 표시/자동 숨김 타이밍 같은 건 이 컴포넌트의 책임이 아니라, 쓰는 쪽에서 관리한다
 * (예: 일정 시간 뒤 언마운트하거나, 애니메이션 라이브러리로 감싸서 사용).
 */
export function Toast({ text, variant = 'warning' }: Props) {
  const theme = useTheme();
  const isSuccess = variant === 'success';

  return (
    <Container variant={variant}>
      <IconBox>
        {isSuccess ? (
          <CheckCircleIcon width={ICON_CIRCLE_SIZE} height={ICON_CIRCLE_SIZE} color={theme.blue[800]} />
        ) : (
          <WarningIcon width={ICON_CIRCLE_SIZE} height={ICON_CIRCLE_SIZE} color={theme.semantic.warning} />
        )}
      </IconBox>
      <Text numberOfLines={1}>{text}</Text>
    </Container>
  );
}

// Figma 토스트 아이콘은 20px 틀 안에 지름 16.67px 원이다. SVG는 원 크기로 잘려 내보내져 있어서 20px로 그리면 원이
// 그만큼 커진다 — 원은 실제 지름으로 그리고 20px 틀 가운데에 둔다.
const ICON_CIRCLE_SIZE = 16.666;

const IconBox = styled.View`
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
`;

const Container = styled.View<{ variant: 'warning' | 'success' }>`
  width: 100%;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: ${({ theme, variant }) =>
    variant === 'success' ? theme.semantic.background.color : theme.semantic.background.fill};
`;

const Text = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.labelReading.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelReading.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelReading.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelReading.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;
