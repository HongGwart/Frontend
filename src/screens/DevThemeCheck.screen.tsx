import React from 'react';
import { ScrollView, View } from 'react-native';
import styled, { DefaultTheme } from 'styled-components/native';
import BlueLogo from '../assets/svg/blueLogo.svg';

const Container = styled(ScrollView)`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

const Section = styled.View`
  padding-horizontal: ${({ theme }) => theme.grid.margin}px;
  padding-vertical: 20px;
`;

const SectionTitle = styled.Text`
  font-family: ${({ theme }) => theme.typography.heading.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.heading.semiBold.fontSize}px;
  color: ${({ theme }) => theme.semantic.text.primary};
  margin-bottom: 12px;
`;

const Swatch = styled.View<{ getColor: (theme: DefaultTheme) => string }>`
  width: 100%;
  height: 44px;
  background-color: ${({ theme, getColor }) => getColor(theme)};
  border-radius: 8px;
  justify-content: center;
  padding-horizontal: 12px;
  margin-bottom: 6px;
  flex-direction: row;
  align-items: center;
`;

const SwatchLabel = styled.Text<{ light?: boolean }>`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  color: ${({ light }) => (light ? '#fff' : '#111')};
`;

const FontRow = styled.View`
  margin-bottom: 14px;
`;

const FontSampleText = styled.Text<{
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}>`
  font-family: ${({ fontFamily }) => fontFamily};
  font-size: ${({ fontSize }) => fontSize}px;
  line-height: ${({ lineHeight }) => lineHeight}px;
  letter-spacing: ${({ letterSpacing }) => letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const FontLabel = styled.Text`
  font-size: 11px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
  margin-bottom: 2px;
`;

export default function DevThemeCheckScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Container>
        <Section>
          <BlueLogo width={200} height={200} />

          <SectionTitle>Color</SectionTitle>
          <Swatch getColor={theme => theme.blue[500]}>
            <SwatchLabel light={true}>blue.500 (Main)</SwatchLabel>
          </Swatch>
          <Swatch getColor={theme => theme.blue[600]}>
            <SwatchLabel light={true}>blue.600 (Logo)</SwatchLabel>
          </Swatch>
          <Swatch getColor={theme => theme.blue[50]}>
            <SwatchLabel>blue.50 (Background)</SwatchLabel>
          </Swatch>
          <Swatch getColor={theme => theme.grayscale[600]}>
            <SwatchLabel light={true}>
              grayscale.600 (Text_Tertiary)
            </SwatchLabel>
          </Swatch>
          <Swatch getColor={theme => theme.grayscale[800]}>
            <SwatchLabel light={true}>grayscale.800 (Button_Fill)</SwatchLabel>
          </Swatch>
          <Swatch getColor={theme => theme.warning}>
            <SwatchLabel light={true}>Warning</SwatchLabel>
          </Swatch>
          <Swatch getColor={theme => theme.success}>
            <SwatchLabel light={true}>Success</SwatchLabel>
          </Swatch>
        </Section>

        <Section>
          <SectionTitle>Typography (Pretendard)</SectionTitle>

          <FontRow>
            <FontLabel>Title / Bold / 24px</FontLabel>
            <FontSampleText
              fontFamily="Pretendard-Bold"
              fontSize={24}
              lineHeight={24 * 1.4}
              letterSpacing={24 * -0.03}
            >
              마법 같은 일상, 홍그와트
            </FontSampleText>
          </FontRow>

          <FontRow>
            <FontLabel>Heading / SemiBold / 20px</FontLabel>
            <FontSampleText
              fontFamily="Pretendard-SemiBold"
              fontSize={20}
              lineHeight={20 * 1.4}
              letterSpacing={20 * -0.03}
            >
              마법 같은 일상, 홍그와트
            </FontSampleText>
          </FontRow>

          <FontRow>
            <FontLabel>Body_Normal / Medium / 16px</FontLabel>
            <FontSampleText
              fontFamily="Pretendard-Medium"
              fontSize={16}
              lineHeight={16 * 1.5}
              letterSpacing={16 * -0.02}
            >
              마법 같은 일상, 홍그와트
            </FontSampleText>
          </FontRow>

          <FontRow>
            <FontLabel>Label_Normal / Medium / 14px</FontLabel>
            <FontSampleText
              fontFamily="Pretendard-Medium"
              fontSize={14}
              lineHeight={14 * 1.5}
              letterSpacing={14 * -0.02}
            >
              마법 같은 일상, 홍그와트
            </FontSampleText>
          </FontRow>

          <FontRow>
            <FontLabel>Caption / Medium / 12px</FontLabel>
            <FontSampleText
              fontFamily="Pretendard-Medium"
              fontSize={12}
              lineHeight={12 * 1.5}
              letterSpacing={12 * -0.02}
            >
              마법 같은 일상, 홍그와트
            </FontSampleText>
          </FontRow>
        </Section>
      </Container>
    </View>
  );
}
