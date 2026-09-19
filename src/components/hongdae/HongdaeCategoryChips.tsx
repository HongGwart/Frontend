import React from 'react';
import { ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { Chip } from '@components/common/Chip';
import { HongdaeCategory } from '@constant/dummyHongdaePlaces';

interface Props {
  /** null이면 "All" 선택 상태 */
  selectedCategory: HongdaeCategory | null;
  onSelect: (category: HongdaeCategory | null) => void;
}

const CATEGORIES: { key: HongdaeCategory; label: string }[] = [
  { key: 'restaurant', label: '식당' },
  { key: 'bar', label: '술집' },
];

// 주변상권 상단의 All/식당/술집 필터 칩. CategoryChipList와 달리 아이콘이 없고
// "All"(전체 보기)이 항상 첫 칩으로 있다는 점이 달라서 별도 컴포넌트로 뺐다.
export function HongdaeCategoryChips({ selectedCategory, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Row>
        <Chip
          label="All"
          active={selectedCategory === null}
          onPress={() => onSelect(null)}
          elevated={false}
        />
        {CATEGORIES.map(({ key, label }) => (
          <Chip
            key={key}
            label={label}
            active={selectedCategory === key}
            onPress={() => onSelect(selectedCategory === key ? null : key)}
            elevated={false}
          />
        ))}
      </Row>
    </ScrollView>
  );
}

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding-horizontal: 20px;
`;
