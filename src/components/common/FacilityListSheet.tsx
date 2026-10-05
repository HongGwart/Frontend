import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import styled from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import { FacilityListItem } from './FacilityListItem';
import { BottomFade, ShadowBottomClip } from './ShadowBottomClip';
import { PhotoSource } from '@appTypes/photo';

// fillHeight가 아닐 때(부모가 높이를 고정해주지 않을 때)를 위한 fallback 상한선.
// 화면 높이의 70%를 넘어가면 스크롤되게 한다. DismissibleBottomSheet가 이 시트를 스와이프로
// 닫는 제스처도 같이 처리하는데, 일반 ScrollView(react-native)를 쓰면 그 팬 제스처와 스크롤이
// 서로 터치를 뺏으려고 충돌하기 쉬워서, 같은 gesture-handler 트리에서 잘 어우러지는
// react-native-gesture-handler의 ScrollView를 쓴다.
const MAX_HEIGHT = Dimensions.get('window').height * 0.7;

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
  images?: [PhotoSource, PhotoSource];
}

interface Props {
  items: FacilityListSheetItem[];
  onSelectItem?: (item: FacilityListSheetItem) => void;
  onToggleFavorite?: (item: FacilityListSheetItem) => void;
  /** FacilityListItem을 대신 넘기고 싶을 때 쓰는 렌더 함수. 생략하면 기본 FacilityListItem을 쓴다. */
  renderItem?: (item: FacilityListSheetItem, index: number, isLast: boolean) => React.ReactNode;
  /**
   * true면 부모가 이미 고정 높이(예: 카테고리 칩 아래 235px 지점 ~ 화면 끝)를 잡아준다고
   * 보고, 그 높이를 그대로 채운다(항목이 적어도 빈 공간이 남지 않고 시트가 그 높이를 가짐).
   * 기본값(false)은 기존처럼 내용물 크기대로 커지다가 화면 70% 지점부터 스크롤된다.
   */
  fillHeight?: boolean;
  /**
   * true면 온보딩 검색 목업(Figma 1252:43041)처럼 ~0.685배 축소 크기로 그린다. items의
   * 각 FacilityListItem과 그라버에도 그대로 전달된다.
   */
  compact?: boolean;
}

/**
 * 숫자 배지가 붙은(군집된) 마커를 탭했을 때 뜨는, 건물/시설 여러 개를 나열하는 바텀시트.
 * Figma "facility list"(716:2935, 811:6250). 그래버 + FacilityListItem 목록으로만 구성된다.
 */
export function FacilityListSheet({
  items,
  onSelectItem,
  onToggleFavorite,
  renderItem,
  fillHeight,
  compact = false,
}: Props) {
  const content = (
    <Container style={fillHeight ? styles.fillContainer : undefined} compact={compact}>
      <Grabber compact={compact} />
      <ScrollView
        style={fillHeight ? styles.scrollViewFill : styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
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
              compact={compact}
            />
          ),
        )}
      </ScrollView>
      {compact && <BottomFade pointerEvents="none" />}
    </Container>
  );

  if (!compact) return content;
  return <ShadowBottomClip spread={SHADOW_CLIP_SPREAD_PX}>{content}</ShadowBottomClip>;
}

// 기본 렌더러를 분리해두면 renderItem prop으로 다른 카드 컴포넌트로도 쉽게 바꿔 쓸 수 있다.
function DefaultFacilityListItem({
  item,
  showDivider,
  onPress,
  onToggleFavorite,
  compact,
}: {
  item: FacilityListSheetItem;
  showDivider: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  compact: boolean;
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
      compact={compact}
    />
  );
}

const Container = styled.View<{ compact: boolean }>`
  width: 100%;
  background-color: ${({ theme }) => theme.semantic.background.primary};
  border-top-left-radius: ${({ compact }) => (compact ? '10.956px' : '16px')};
  border-top-right-radius: ${({ compact }) => (compact ? '10.956px' : '16px')};
  align-items: center;
  padding-top: ${({ compact }) => (compact ? '5.478px' : '8px')};
  padding-bottom: ${({ compact }) => (compact ? '5.478px' : '8px')};
  gap: ${({ compact }) => (compact ? '10.956px' : '16px')};
  /* compact(온보딩 검색 목업)만 Figma box-shadow 적용: 0 -2.739px 20px 0 rgba(0,0,0,0.10) —
     FacilityInfoCard와 같은 이유로 radius가 40px로 과하게 커져 있던 걸 20px로 맞춘다. */
  shadow-color: #000;
  shadow-offset: 0px ${({ compact }) => (compact ? '-2.739px' : '-4px')};
  shadow-opacity: ${({ compact }) => (compact ? 0.1 : 0.05)};
  shadow-radius: 20px;
  elevation: 8;
`;

const SHADOW_CLIP_SPREAD_PX = 40;

const Grabber = styled.View<{ compact: boolean }>`
  width: ${({ compact }) => (compact ? '24.652px' : '36px')};
  height: ${({ compact }) => (compact ? '2.739px' : '4px')};
  border-radius: 100px;
  background-color: ${({ theme }) => theme.semantic.line.primary};
`;

const styles = StyleSheet.create({
  fillContainer: {
    flex: 1,
  },
  scrollView: {
    width: '100%',
    maxHeight: MAX_HEIGHT,
  },
  scrollViewFill: {
    width: '100%',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
