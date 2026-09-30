import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import styled, { useTheme } from 'styled-components/native';
import Header from '@components/layout/Header';
import { IndoorMapView } from '@components/map/IndoorMapView';
import { FloorSelector } from '@components/map/FloorSelector';
import { FacilityInfoCard } from '@components/common/FacilityInfoCard';
import { CollapsibleBottomSheet } from '@components/common/CollapsibleBottomSheet';
import { FLOOR_MAPS, getBuildingFloors } from '@constant/floorMaps';
import { DUMMY_MAP_MARKERS } from '@constant/dummyMapMarkers';
import {
  DUMMY_FACILITY_COUNTS,
  DUMMY_FACILITY_IMAGES,
  DUMMY_MAIN_ENTRANCE,
  DUMMY_OPERATING_HOURS,
} from '@constant/dummyFacilityInfo';
import { RootStackParamList } from '@navigation/types';
import { toRoutePlaceLabel, useRouteButtonProps } from '@hooks/useRouteButtonProps';

// 층 전환 시 슬라이드 이동 거리(px). 위층으로 가면 아래에서, 아래층으로 가면 위에서 들어온다.
const SLIDE_DISTANCE = 64;
const SLIDE_DURATION = 260;
// Figma: 헤더 아래 24px, 왼쪽 20px에 층 선택기.
const FLOOR_SELECTOR_TOP = 24;
// FacilityInfoCard inside variant의 고정 높이.
const INSIDE_CARD_HEIGHT = 400;
// 카드를 아래로 끌어내려 접었을 때 남겨둘 그래버 영역 높이(패딩 8 + 그래버 4 + 여백 12).
const CARD_PEEK_HEIGHT = 24;

/**
 * 지도 위 건물 카드에서 "건물 내부 보기"를 누르면 뜨는 건물 내부 지도. Figma "건물 내부 지도"(762:4924).
 * 헤더(건물 코드+이름) 아래 평면도(IndoorMapView)와 왼쪽 층 선택기, 하단 건물 정보 카드(inside)로
 * 구성된다. 강의실을 탭하면 카드가 그 강의실 정보(room)로 바뀌고, 빈 곳을 탭하면 다시 건물 정보로 돌아온다.
 */
export default function BuildingIndoorScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'BuildingIndoor'>>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const marker = useMemo(
    () => DUMMY_MAP_MARKERS.find(item => item.label === params.buildingCode),
    [params.buildingCode],
  );
  const [isFavorite, setIsFavorite] = useState(params.isFavorite ?? false);

  // 기본은 1층(없으면 가장 낮은 층)에서 시작한다.
  const floors = useMemo(() => getBuildingFloors(params.buildingCode), [params.buildingCode]);
  const [floorId, setFloorId] = useState(
    () => (floors.find(floor => floor.floorNum === 1) ?? floors[floors.length - 1])?.floorId,
  );
  const floorAssets = useMemo(() => (floorId ? FLOOR_MAPS[floorId]() : null), [floorId]);

  // 탭한 강의실 라벨(예: "212"). 층을 바꾸면 이전 층의 선택은 의미가 없으니 비운다.
  const [selectedRoomLabel, setSelectedRoomLabel] = useState<string | null>(null);

  // 직전 층 번호를 기억해뒀다가, 층이 바뀔 때 위/아래 어느 방향에서 들어올지 정한다.
  const floorNum = floors.find(floor => floor.floorId === floorId)?.floorNum ?? 0;
  const prevFloorNumRef = useRef(floorNum);
  const slideY = useSharedValue(0);
  useEffect(() => {
    if (floorNum === prevFloorNumRef.current) return;
    slideY.value = floorNum > prevFloorNumRef.current ? SLIDE_DISTANCE : -SLIDE_DISTANCE;
    slideY.value = withTiming(0, { duration: SLIDE_DURATION, easing: Easing.out(Easing.cubic) });
    prevFloorNumRef.current = floorNum;
  }, [floorNum, slideY]);
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));

  // 지도 위 건물 카드(outside, "건물 내부 보기" 버튼 때문에 더 높다)에서 넘어오면, 이 카드가 처음엔
  // 그 카드의 윗부분 위치에서 시작해 제자리로 내려앉는다. 화면이 크로스페이드되는 동안엔 지도 쪽 카드가
  // 위에 그대로 떠 있고(MapScreen은 Modal), 전환이 끝나 그 카드가 닫히는 순간 같은 모양의 이 카드가
  // 같은 자리에 있어서 이어진 것처럼 보인다 — 그 뒤 버튼 높이만큼 부드럽게 내려간다.
  const cardLift = useSharedValue(Math.max(0, (params.fromCardHeight ?? 0) - INSIDE_CARD_HEIGHT));
  useEffect(() => {
    if (cardLift.value === 0) return;
    const settle = () => {
      clearTimeout(fallbackId);
      cardLift.value = withDelay(60, withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }));
    };
    // 전환 애니메이션이 없는 경우(안드로이드 animation: 'none') transitionEnd가 안 올 수 있어서,
    // 전환 시간(200ms)보다 넉넉한 뒤에는 이벤트가 없어도 내려앉힌다.
    const fallbackId = setTimeout(settle, 400);
    const unsubscribe = navigation.addListener('transitionEnd', event => {
      if (!event.data.closing) settle();
    });
    return () => {
      clearTimeout(fallbackId);
      unsubscribe();
    };
  }, [navigation, cardLift]);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -cardLift.value }] }));

  // 층이 많으면 층 선택기가 지도 영역 밖(카드 뒤)까지 내려가지 않게 지도 영역 높이에 맞춰 자른다.
  const [mapAreaHeight, setMapAreaHeight] = useState(0);

  // 출발/도착을 누르면 길찾기 탭으로 가서 해당 입력창을 채운다(강의실을 골랐으면 호수까지).
  const routeButtonProps = useRouteButtonProps();
  const placeLabel = toRoutePlaceLabel(
    params.buildingCode,
    params.buildingName,
    selectedRoomLabel && `${selectedRoomLabel}호`,
  );

  return (
    <Container>
      <HeaderWrapper style={{ paddingTop: insets.top }}>
        <Header title={params.buildingCode} subtitle={params.buildingName} onBackPress={() => navigation.goBack()} />
      </HeaderWrapper>

      <MapArea onLayout={event => setMapAreaHeight(event.nativeEvent.layout.height)}>
        {floorId && floorAssets ? (
          <>
            <Animated.View style={[{ flex: 1 }, slideStyle]}>
              <IndoorMapView
                key={floorId}
                mapData={floorAssets.data}
                backgroundColor={theme.semantic.line.tertiary}
                // LayerSize를 그대로 펼친다. viewBox가 없을 때 viewBox={undefined}로 넘기면 SVG 컴포넌트의
                // 원래 viewBox를 덮어써서 도면 스케일이 깨진다.
                renderBackground={layerSize => <floorAssets.Background {...layerSize} />}
                renderForeground={layerSize => <floorAssets.Doors {...layerSize} />}
                onRoomSelect={room => setSelectedRoomLabel(room ? room.label ?? room.id : null)}
              />
            </Animated.View>
            <FloorSelectorWrapper>
              <FloorSelector
                floors={floors}
                selectedFloorId={floorId}
                onSelect={id => {
                  setFloorId(id);
                  setSelectedRoomLabel(null);
                }}
                maxHeight={Math.max(0, mapAreaHeight - FLOOR_SELECTOR_TOP * 2)}
              />
            </FloorSelectorWrapper>
          </>
        ) : (
          <EmptyText>아직 내부 지도가 준비되지 않은 건물이에요</EmptyText>
        )}
      </MapArea>

      <CardWrapper style={cardStyle}>
        <CollapsibleBottomSheet
          peekHeight={CARD_PEEK_HEIGHT + insets.bottom}
          header={<Grabber />}
          style={{
            backgroundColor: theme.semantic.background.primary,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          {selectedRoomLabel ? (
            <FacilityInfoCard
              variant="room"
              hideGrabber
              hideShadow
              buildingCode={params.buildingCode}
              buildingName={params.buildingName}
              roomNumber={`${selectedRoomLabel}호`}
              description={params.description}
              isFavorite={isFavorite}
              onToggleFavorite={() => setIsFavorite(prev => !prev)}
              {...routeButtonProps(placeLabel)}
              operatingHours={DUMMY_OPERATING_HOURS}
            />
          ) : (
            <FacilityInfoCard
              variant="inside"
              hideGrabber
              hideShadow
              buildingCode={params.buildingCode}
              buildingName={params.buildingName}
              description={params.description}
              isFavorite={isFavorite}
              onToggleFavorite={() => setIsFavorite(prev => !prev)}
              {...routeButtonProps(placeLabel)}
              images={marker?.images ?? DUMMY_FACILITY_IMAGES}
              facilityCounts={DUMMY_FACILITY_COUNTS}
              mainEntrance={DUMMY_MAIN_ENTRANCE}
              operatingHours={DUMMY_OPERATING_HOURS}
            />
          )}
        </CollapsibleBottomSheet>
        {/* 카드가 위로 올라가 있는 동안 그 아래로 지도가 비치지 않게 흰 바닥을 이어 붙인다. */}
        <CardBottomFill />
      </CardWrapper>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.semantic.line.tertiary};
`;

const HeaderWrapper = styled.View`
  z-index: 1;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;

// 카드(흰 라운드 시트)의 둥근 모서리 뒤로 지도 배경색이 비치도록, 카드와 겹치지 않는 영역만 차지한다.
const MapArea = styled.View`
  flex: 1;
  overflow: hidden;
  justify-content: center;
`;

const FloorSelectorWrapper = styled.View`
  position: absolute;
  top: ${FLOOR_SELECTOR_TOP}px;
  left: 20px;
`;

const EmptyText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
  text-align: center;
`;

// 이제 카드는 흐름 밖에서 지도 위에 절대위치로 떠서(bottom:0), 접으면 그래버만 남기고 뒤의
// IndoorMapView가 그대로 드러난다 — MapArea가 카드 높이만큼 줄어들지 않고 항상 화면 전체를 채운다.
const CardWrapper = styled(Animated.View)`
  position: absolute;
  left: 0px;
  right: 0px;
  bottom: 0px;
  width: 100%;
`;

const Grabber = styled.View`
  align-self: center;
  width: 36px;
  height: 4px;
  margin-top: 8px;
  border-radius: 100px;
  background-color: ${({ theme }) => theme.semantic.line.primary};
`;

const CardBottomFill = styled.View`
  position: absolute;
  top: 100%;
  left: 0px;
  right: 0px;
  height: 400px;
  background-color: ${({ theme }) => theme.semantic.background.primary};
`;
