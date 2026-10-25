import React, { useCallback, useMemo } from 'react';
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

  // categories는 부모에서 대개 상수 배열을 그대로 넘기지만, 다른 상태 변화로 이
  // 컴포넌트가 리렌더될 때마다 같은 그룹핑을 다시 계산하지 않도록 memo화했다.
  const rows = useMemo(() => {
    const grouped: FacilityCategory[][] = [];
    for (let i = 0; i < categories.length; i += COLUMNS) {
      grouped.push(categories.slice(i, i + COLUMNS));
    }
    return grouped;
  }, [categories]);

  // 매 렌더마다 카드 개수만큼 새 클로저를 만들지 않도록, category를 인자로 받는
  // 안정된 콜백 하나만 만들어 각 카드에는 category만 다르게 바인딩한다.
  const handleSelectCategory = useCallback(
    (category: FacilityCategory) => {
      onSelectCategory?.(category);
    },
    [onSelectCategory],
  );

  return (
    <Grid>
      {rows.map((row, rowIndex) => (
        <Row key={rowIndex}>
          {row.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              iconColor={theme.blue[500]}
              onPress={handleSelectCategory}
            />
          ))}
        </Row>
      ))}
    </Grid>
  );
}

const CategoryCard = React.memo(function CategoryCard({
  category,
  iconColor,
  onPress,
}: {
  category: FacilityCategory;
  iconColor: string;
  onPress: (category: FacilityCategory) => void;
}) {
  const handlePress = useCallback(() => onPress(category), [onPress, category]);
  return (
    <CardWrapper onPress={handlePress}>
      <Card>
        <IconBadge>
          <category.icon width={category.iconWidth} height={category.iconHeight} color={iconColor} />
        </IconBadge>
        <Label>{category.label}</Label>
      </Card>
    </CardWrapper>
  );
});

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
