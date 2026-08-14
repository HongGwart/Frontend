import React from 'react';
import styled from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import { FacilityListItem } from './FacilityListItem';

export interface FacilityListSheetItem {
  id: string;
  icon: React.FC<SvgProps>;
  iconWidth?: number;
  iconHeight?: number;
  emphasized?: boolean;
  building: string;
  place: string;
  room?: string;
  description: string;
  isFavorite?: boolean;
  images?: [React.FC<SvgProps>, React.FC<SvgProps>];
}

interface Props {
  items: FacilityListSheetItem[];
  onSelectItem?: (item: FacilityListSheetItem) => void;
  onToggleFavorite?: (item: FacilityListSheetItem) => void;
  /** FacilityListItem을 대신 넘기고 싶을 때 쓰는 렌더 함수. 생략하면 기본 FacilityListItem을 쓴다. */
  renderItem?: (item: FacilityListSheetItem, index: number, isLast: boolean) => React.ReactNode;
}

/**
 * 숫자 배지가 붙은(군집된) 마커를 탭했을 때 뜨는, 건물/시설 여러 개를 나열하는 바텀시트.
 * Figma "facility list"(716:2935, 811:6250). 그래버 + FacilityListItem 목록으로만 구성된다.
 */
export function FacilityListSheet({ items, onSelectItem, onToggleFavorite, renderItem }: Props) {
  return (
    <Container>
      <Grabber />
      <List>
        {items.map((item, index) =>
          renderItem ? (
            <React.Fragment key={item.id}>
              {renderItem(item, index, index === items.length - 1)}
            </React.Fragment>
          ) : (
            <DefaultFacilityListItem
              key={item.id}
              item={item}
              showDivider={index !== items.length - 1}
              onPress={() => onSelectItem?.(item)}
              onToggleFavorite={() => onToggleFavorite?.(item)}
            />
          ),
        )}
      </List>
    </Container>
  );
}

// 기본 렌더러를 분리해두면 renderItem prop으로 다른 카드 컴포넌트로도 쉽게 바꿔 쓸 수 있다.
function DefaultFacilityListItem({
  item,
  showDivider,
  onPress,
  onToggleFavorite,
}: {
  item: FacilityListSheetItem;
  showDivider: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <FacilityListItem
      icon={item.icon}
      iconWidth={item.iconWidth}
      iconHeight={item.iconHeight}
      emphasized={item.emphasized}
      building={item.building}
      place={item.place}
      room={item.room}
      description={item.description}
      isFavorite={item.isFavorite}
      images={item.images}
      showDivider={showDivider}
      onPress={onPress}
      onToggleFavorite={onToggleFavorite}
    />
  );
}

const Container = styled.View`
  width: 100%;
  background-color: ${({ theme }) => theme.semantic.background.primary};
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  align-items: center;
  padding-top: 8px;
  padding-bottom: 8px;
  gap: 16px;
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.05;
  shadow-radius: 20px;
  elevation: 8;
`;

const Grabber = styled.View`
  width: 36px;
  height: 4px;
  border-radius: 100px;
  background-color: ${({ theme }) => theme.semantic.line.primary};
`;

const List = styled.View`
  width: 100%;
`;
