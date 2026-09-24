import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled, { useTheme } from 'styled-components/native';
import NavigationArrowIcon from '@assets/svgs/icons/navigationArrow.svg';
import DestinationMarkerIcon from '@assets/svgs/icons/destinationMarker.svg';
import GpsIcon from '@assets/svgs/icons/gps.svg';
import ExchangeIcon from '@assets/svgs/icons/exchange.svg';
import BlueLogoSymbol from '@assets/svgs/blueLogoSymbol.svg';
import { RouteInputField } from '@components/navigation/RouteInputField';
import { RouteOptionChip } from '@components/navigation/RouteOptionChip';
import { RouteResultCard } from '@components/navigation/RouteResultCard';
import { Toast } from '@components/common/Toast';
import { ROUTE_OPTIONS, RouteOptionKey } from '@constant/routeOptions';
import { DUMMY_DEFAULT_DEPARTURE } from '@constant/dummyMypage';
import { DUMMY_ROUTE_RESULTS, DUMMY_ELEVATOR_WARNING_MESSAGE } from '@constant/dummyRouteResults';
import { MainTabParamList, RootStackParamList } from '@navigation/types';

// Figma "길 찾기_출발지/도착지 입력"(720:4897) + 출발/도착지를 모두 설정하면 뜨는
// "길 찾기_경로 선택"(720:10860). 상단 헤더는 이미 MainTabNavigator가 타이틀("길찾기")을
// 보여주고 있어서, 여기서는 출발/도착 입력 + 경로 옵션 + 빈 상태/경로 목록 본문만 그린다.
export default function NavigationScreen() {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tabNavigation = useNavigation<NativeStackNavigationProp<MainTabParamList, 'navigation'>>();
  const { params } = useRoute<RouteProp<MainTabParamList, 'navigation'>>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  // 경로 옵션은 라디오처럼 한 번에 하나만 고를 수 있다. 같은 칩을 다시 누르면 선택 해제.
  const [selectedOption, setSelectedOption] = useState<RouteOptionKey | null>(null);

  // RouteLocationSearchScreen에서 항목을 골라 돌아오면 routeSelection 파라미터로 실려 온다.
  // 항상 출발/도착 값을 함께 담아 오므로 두 값을 각각 독립적으로 반영하면 되고(한쪽만
  // 왔다고 다른 쪽을 건드리지 않음), 적용한 뒤에는 파라미터를 비워서 같은 곳을 다시
  // 골랐을 때도 이 effect가 또 반응하게 한다.
  useEffect(() => {
    const selection = params?.routeSelection;
    if (!selection) return;
    if (selection.departureLabel !== undefined) setDeparture(selection.departureLabel);
    if (selection.destinationLabel !== undefined) setDestination(selection.destinationLabel);
    tabNavigation.setParams({ routeSelection: undefined });
  }, [params?.routeSelection, tabNavigation]);

  const swapValues = () => {
    setDeparture(destination);
    setDestination(departure);
  };

  const toggleOption = (key: RouteOptionKey) => {
    setSelectedOption(prev => (prev === key ? null : key));
  };

  // 출발/도착지가 둘 다 채워지면 빈 상태 대신 경로 목록을 보여준다.
  const hasRoute = departure.length > 0 && destination.length > 0;
  const hasElevatorWarning = useMemo(() => DUMMY_ROUTE_RESULTS.some(route => route.elevatorWarning), []);

  return (
    <Container>
      <InputSection>
        <SwapButton onPress={swapValues} hitSlop={8}>
          <ExchangeIcon width={24} height={24} color={theme.semantic.icon.secondary} />
        </SwapButton>
        <InputColumn>
          <RouteInputField
            icon={NavigationArrowIcon}
            value={departure}
            placeholder="출발지를 입력하세요"
            onPress={() =>
              rootNavigation.navigate('RouteLocationSearch', {
                target: 'departure',
                departureLabel: departure,
                destinationLabel: destination,
              })
            }
            onClear={() => setDeparture('')}
            rightSlot={
              <GpsButton
                onPress={() =>
                  setDeparture(
                    `${DUMMY_DEFAULT_DEPARTURE.buildingCode} ${DUMMY_DEFAULT_DEPARTURE.buildingName} ${DUMMY_DEFAULT_DEPARTURE.roomNumber}`,
                  )
                }
                hitSlop={8}
              >
                <GpsIcon width={24} height={24} />
              </GpsButton>
            }
          />
          <RouteInputField
            icon={DestinationMarkerIcon}
            value={destination}
            placeholder="도착지를 입력하세요"
            onPress={() =>
              rootNavigation.navigate('RouteLocationSearch', {
                target: 'destination',
                departureLabel: departure,
                destinationLabel: destination,
              })
            }
            onClear={() => setDestination('')}
          />
        </InputColumn>
      </InputSection>

      <OptionRow showDivider={hasRoute}>
        {ROUTE_OPTIONS.map(({ key, label, icon }) => (
          <RouteOptionChip
            key={key}
            label={label}
            icon={icon}
            active={selectedOption === key}
            onPress={() => toggleOption(key)}
          />
        ))}
      </OptionRow>

      {hasRoute ? (
        <ResultsArea>
          <ScrollView
            contentContainerStyle={{ paddingBottom: hasElevatorWarning ? insets.bottom + 76 : insets.bottom + 16 }}
            showsVerticalScrollIndicator={false}
          >
            {DUMMY_ROUTE_RESULTS.map((result, index) => (
              <RouteResultCard
                key={result.id}
                result={result}
                optionLabel={ROUTE_OPTIONS.find(option => option.key === result.option)?.label ?? ''}
                showDivider={index !== DUMMY_ROUTE_RESULTS.length - 1}
              />
            ))}
          </ScrollView>
          {hasElevatorWarning && (
            <ToastWrapper bottomInset={insets.bottom}>
              <Toast text={DUMMY_ELEVATOR_WARNING_MESSAGE} variant="warning" />
            </ToastWrapper>
          )}
        </ResultsArea>
      ) : (
        <EmptyState>
          {/* blueLogoSymbol 원본 비율(117.27x152.443)이 정사각형이 아니라, width/height를 같은
              값으로 주면 옆으로 눌려 보인다. 세로 120px 기준으로 원본 비율을 유지한 가로값을 쓴다. */}
          <BlueLogoSymbol width={92} height={120} style={{ opacity: 0.35 }} />
          <EmptyText>
            도착지를 설정하면{'\n'}경로를 안내해드릴게요
          </EmptyText>
        </EmptyState>
      )}
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

const InputSection = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 20px;
  background-color: ${({ theme }) => theme.semantic.background.primary};
  /* Figma box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.05) */
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.05;
  shadow-radius: 10px;
  elevation: 3;
`;

const SwapButton = styled(Pressable)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

const InputColumn = styled.View`
  flex: 1;
  gap: 4px;
`;

const GpsButton = styled(Pressable)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

const OptionRow = styled.View<{ showDivider: boolean }>`
  flex-direction: row;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 20px;
  border-bottom-width: ${({ showDivider }) => (showDivider ? '1px' : '0px')};
  border-bottom-color: ${({ theme }) => theme.semantic.line.tertiary};
`;

const ResultsArea = styled.View`
  flex: 1;
`;

const ToastWrapper = styled.View<{ bottomInset: number }>`
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: ${({ bottomInset }) => bottomInset + 16}px;
`;

const EmptyState = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 16px;
  /* justify-content: center가 위아래를 똑같이 나누는데, 그 정중앙보다 8px 위로 올려달라는
     요청이라 아래쪽 패딩만 16px 더 줘서(위아래 차이의 절반=8px) 시각적으로 위로 밀어낸다. */
  padding-bottom: 50px;
`;

const EmptyText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
  text-align: center;
`;
