import React from 'react';
import { ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { CATEGORY_CHIPS, CategoryKey } from '@constant/categoryChips';
import { Chip } from './Chip';

interface Props {
  /** 현재 선택된 카테고리. 하나만 선택 가능하며, 아무것도 안 골랐으면 null */
  selectedKey: CategoryKey | null;
  /** 이미 선택된 칩을 다시 누르면 선택 해제(null)해서 넘겨준다 */
  onSelect: (key: CategoryKey | null) => void;
}

/**
 * 검색 페이지 상단의 카테고리 필터 칩 목록. 즐겨찾기/열람실/식당 등 CATEGORY_CHIPS에
 * 정의된 카테고리를 가로 스크롤로 보여주고, 한 번에 하나만 선택할 수 있다(라디오 방식).
 */
export function CategoryChipList({ selectedKey, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Row>
        {CATEGORY_CHIPS.map(({ key, label, icon, iconWidth, iconHeight }) => (
          <Chip
            key={key}
            label={label}
            icon={icon}
            iconWidth={iconWidth}
            iconHeight={iconHeight}
            active={selectedKey === key}
            onPress={() => onSelect(selectedKey === key ? null : key)}
          />
        ))}
      </Row>
    </ScrollView>
  );
}

const Row = styled.View`
  flex-direction: row;
  gap: 8px;
  padding-horizontal: 20px;
`;
