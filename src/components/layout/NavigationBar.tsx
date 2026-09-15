import React from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import MapIcon from '@assets/svgs/navBarMap.svg';
import MapDotIcon from '@assets/svgs/navBarMapDot.svg';
import NavigationIcon from '@assets/svgs/navBarNavigation.svg';
import FacilityIcon from '@assets/svgs/navBarFacility.svg';
import HongdaeIcon from '@assets/svgs/navBarHongdae.svg';
import MypageIcon from '@assets/svgs/navBarMypage.svg';

export type NavigationTab =
  | 'map'
  | 'navigation'
  | 'facility'
  | 'hongdae'
  | 'mypage';

interface NavigationBarProps {
  activeTab: NavigationTab;
  onTabPress?: (tab: NavigationTab) => void;
  bottomInset?: number;
}

const TABS: {
  key: NavigationTab;
  label: string;
  Icon: React.FC<SvgProps>;
  iconWidth: number;
  iconHeight: number;
}[] = [
  { key: 'map', label: '캠퍼스맵', Icon: MapIcon, iconWidth: 18, iconHeight: 21 },
  {
    key: 'navigation',
    label: '길찾기',
    Icon: NavigationIcon,
    iconWidth: 17,
    iconHeight: 19,
  },
  {
    key: 'facility',
    label: '편의시설',
    Icon: FacilityIcon,
    iconWidth: 20,
    iconHeight: 21.5,
  },
  {
    key: 'hongdae',
    label: '주변상권',
    Icon: HongdaeIcon,
    iconWidth: 20,
    iconHeight: 20,
  },
  { key: 'mypage', label: 'MY', Icon: MypageIcon, iconWidth: 20, iconHeight: 19 },
];

const Container = styled.View<{ bottomInset: number }>`
  flex-direction: row;
  min-height: 98px;
  padding-horizontal: 8px;
  padding-top: 8px;
  padding-bottom: ${({ bottomInset }) => bottomInset}px;
  background-color: ${({ theme }) => theme.blue[900]};
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.15;
  shadow-radius: 10px;
  elevation: 8;
`;

const Tab = styled(Pressable)`
  flex: 1;
  align-items: center;
  gap: 4px;
`;

const IconBox = styled(Animated.View)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

const MapDotWrapper = styled.View`
  position: absolute;
  top: 7px;
  left: 8.5px;
`;

const Label = styled(Animated.Text)<{ active: boolean }>`
  font-family: ${({ theme, active }) =>
    active
      ? theme.typography.caption.semiBold.fontFamily
      : theme.typography.caption.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.caption.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.caption.medium.lineHeight}px;
  letter-spacing: ${({ theme }) =>
    theme.typography.caption.medium.letterSpacing}px;
  color: ${({ theme, active }) => (active ? theme.sub.beige : theme.grayscale[600])};
  text-align: center;
`;

export default function NavigationBar({
  activeTab,
  onTabPress,
  bottomInset = 0,
}: NavigationBarProps) {
  return (
    <Container bottomInset={bottomInset}>
      {TABS.map(tab => (
        <TabButton
          key={tab.key}
          tab={tab}
          isActive={tab.key === activeTab}
          onPress={() => onTabPress?.(tab.key)}
        />
      ))}
    </Container>
  );
}

// 눌렀을 때 살짝 눌렸다 튕기듯 돌아오는(토스 탭바 인터랙션) 바운스 — 아이콘과 라벨이
// 같은 scale 값을 공유해서 한 덩어리처럼 같이 움직인다. 탭 5개가 전부 눌림 상태를
// 각자 따로 갖고 있어야 해서(하나만 눌러도 나머지가 같이 움직이면 안 되니)
// useSharedValue를 쓰는 애니메이션은 map 안이 아니라 이 컴포넌트 하나당 인스턴스로
// 뽑아냈다 — BouncyPressable과 같은 패턴이다.
function TabButton({
  tab: { key, label, Icon, iconWidth, iconHeight },
  isActive,
  onPress,
}: {
  tab: (typeof TABS)[number];
  isActive: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const color = isActive ? theme.sub.beige : theme.grayscale[600];
  const scale = useSharedValue(1);

  const tabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Tab
      onPress={onPress}
      onPressIn={() => {
        // BouncyPressable과 같은 이징/지속시간 — 아이콘 자체가 24px로 작아서 축소폭만
        // (0.96 대신 0.9로) 조금 더 키워야 눌리는 느낌이 눈에 들어온다.
        scale.value = withTiming(0.9, { duration: 80, easing: Easing.out(Easing.quad) });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.back(2)) });
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <IconBox style={tabAnimatedStyle}>
        <Icon width={iconWidth} height={iconHeight} color={color} />
        {key === 'map' && (
          <MapDotWrapper>
            <MapDotIcon width={7} height={7} />
          </MapDotWrapper>
        )}
      </IconBox>
      <Label active={isActive} style={tabAnimatedStyle}>
        {label}
      </Label>
    </Tab>
  );
}
