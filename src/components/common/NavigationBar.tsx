import React from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
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

const IconBox = styled.View`
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

const Label = styled.Text<{ active: boolean }>`
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
  const theme = useTheme();

  return (
    <Container bottomInset={bottomInset}>
      {TABS.map(({ key, label, Icon, iconWidth, iconHeight }) => {
        const isActive = key === activeTab;
        const color = isActive ? theme.sub.beige : theme.grayscale[600];
        return (
          <Tab
            key={key}
            onPress={() => onTabPress?.(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <IconBox>
              <Icon width={iconWidth} height={iconHeight} color={color} />
              {key === 'map' && (
                <MapDotWrapper>
                  <MapDotIcon width={7} height={7} />
                </MapDotWrapper>
              )}
            </IconBox>
            <Label active={isActive}>{label}</Label>
          </Tab>
        );
      })}
    </Container>
  );
}
