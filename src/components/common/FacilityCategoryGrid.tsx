import React from 'react';
import styled, { useTheme } from 'styled-components/native';
import { BouncyPressable } from './BouncyPressable';
import { FacilityCategory } from '@constant/facilityCategories';

interface Props {
  categories: FacilityCategory[];
  onSelectCategory?: (category: FacilityCategory) => void;
}

/**
 * 편의시설 카테고리를 3열 그리드로 보여주는 컴포넌트. Figma "편의시설"(716:2973)의
 * "facility category" 카드(717:1643 등)를 재사용 가능한 형태로 뺐다.
 */
const COLUMNS = 3;

export function FacilityCategoryGrid({ categories, onSelectCategory }: Props) {
  const theme = useTheme();
  const rows: FacilityCategory[][] = [];
  for (let i = 0; i < categories.length; i += COLUMNS) {
    rows.push(categories.slice(i, i + COLUMNS));
  }

  return (
    <Grid>
      {rows.map((row, rowIndex) => (
        <Row key={rowIndex}>
          {row.map(category => (
            <CardWrapper key={category.id} onPress={() => onSelectCategory?.(category)}>
              <Card>
                <IconBadge>
                  <category.icon width={category.iconWidth} height={category.iconHeight} color={theme.blue[500]} />
                </IconBadge>
                <Label>{category.label}</Label>
              </Card>
            </CardWrapper>
          ))}
        </Row>
      ))}
    </Grid>
  );
}

const Grid = styled.View`
  width: 100%;
  gap: 8px;
`;

const Row = styled.View`
  flex-direction: row;
  width: 100%;
  gap: 7px;
`;

const CardWrapper = styled(BouncyPressable)`
  flex: 1;
`;

const Card = styled.View`
  width: 100%;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

const IconBadge = styled.View`
  width: 72px;
  height: 72px;
  align-items: center;
  justify-content: center;
  border-radius: 100px;
  background-color: ${({ theme }) => theme.semantic.background.color};
`;

const Label = styled.Text`
  font-family: ${({ theme }) => theme.typography.headline.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.headline.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.headline.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.headline.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
  text-align: center;
`;
