import React, { useState } from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import BuildingViewIcon from '@assets/svgs/icons/buildingView.svg';
import { Button } from './Button';
import { FavoriteToggle } from './FavoriteToggle';
import { FacilityImagePair } from './FacilityImagePair';
import { BottomFade, ShadowBottomClip } from './ShadowBottomClip';

export interface FacilityCountItem {
  icon: React.FC<SvgProps>;
  /** 아이콘별 원본 비율을 유지한 채 넣을 크기. 생략하면 17x17로 렌더링된다. */
  iconWidth?: number;
  iconHeight?: number;
  label: string;
  count: number;
}

export interface OperatingHoursInfo {
  isOpen: boolean;
  /** 예: "운영 중" / "운영 종료" */
  statusText: string;
  /** 예: "22:00에 운영 종료" */
  detailText: string;
}

interface Props {
  /**
   * 'outside' - 지도에서 건물을 탭했을 때 뜨는 기본 바텀시트 (건물 내부 보기 CTA 포함)
   * 'inside' - 건물 내부로 들어간 상태에서 뜨는 바텀시트 (CTA 없음, 높이는 내용에 맞춤)
   * 'room' - 특정 강의실을 탭했을 때 뜨는 축약형 (이미지·시설 정보 없음)
   * 'facility' - 건물/강의실이 아닌 편의시설(카페, 식당 등)을 탭하거나 검색했을 때 뜨는 형태.
   *   시설명이 제목이 되고, 그 아래 "R동 홍문관 로비층"처럼 위치를 보여준다.
   */
  variant: 'outside' | 'inside' | 'room' | 'facility';
  buildingCode: string;
  buildingName: string;
  /** room에서만 쓰인다 (예: "502호") */
  roomNumber?: string;
  /** facility에서만 쓰인다. 제목으로 쓰이는 편의시설 이름 (예: "카페나무") */
  facilityName?: string;
  /** facility에서만 쓰인다. 위치 설명 마지막에 덧붙는 텍스트 (예: "로비층") */
  locationDetail?: string;
  /** facility를 제외한 나머지 variant에서 쓰인다 */
  description?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onDeparturePress?: () => void;
  onArrivalPress?: () => void;
  /** outside/inside/facility에서만 쓰인다 */
  images?: [React.FC<SvgProps>, React.FC<SvgProps>];
  /** outside/inside에서만 쓰인다 (예: 프린터 2, PC실 1) */
  facilityCounts?: FacilityCountItem[];
  /** outside/inside에서만 쓰인다 (예: "정문(1층), 후문(지하1층)") */
  mainEntrance?: string;
  operatingHours: OperatingHoursInfo;
  /** outside/facility에서만 쓰인다 */
  onViewInsidePress?: () => void;
  /**
   * CTA 버튼 라벨. 기본값은 "건물 내부 보기"지만, 캠퍼스 밖 상권(주변상권)처럼 건물 내부가
   * 없는 시설은 "네이버 지도에서 열기"처럼 다른 문구로 바꿔서 쓴다.
   */
  ctaLabel?: string;
  /** CTA 아이콘. 생략하면 건물 아이콘이 기본값이고, 아이콘 없이 텍스트만 보이려면 null을 넘긴다. */
  ctaIcon?: React.FC<SvgProps> | null;
  ctaIconWidth?: number;
  ctaIconHeight?: number;
  /** CTA 버튼 색상. 기본값 'primary'(남색). 주변상권처럼 톤 다운된 버튼이 필요하면 'secondary'. */
  ctaVariant?: 'primary' | 'secondary';
  /** true면 "건물 내부 보기" CTA 버튼을 안 그린다(예: 온보딩처럼 CTA가 필요 없는 데모용). */
  hideCta?: boolean;
  /**
   * true면 카드 맨 위 그래버를 안 그린다. 이 카드를 CollapsibleBottomSheet처럼 스스로
   * 그래버를 그리는 컨테이너 안에 넣을 때, 그래버가 두 번 겹쳐 보이지 않게 하는 용도.
   */
  hideGrabber?: boolean;
  /**
   * true면 카드 위쪽 그림자(shadow-offset 음수)를 안 그린다. 이 그림자는 원래 카드 바로
   * 위의 지도에 옅게 지는 용도인데, CollapsibleBottomSheet처럼 카드 위에 그래버 영역이
   * 따로 얹혀 있는 컨테이너 안에서는 그 그래버 영역까지 그림자가 번져 올라가 회색으로
   * 보인다. 그 컨테이너가 자기 배경을 이미 깔고 있을 때 끈다.
   */
  hideShadow?: boolean;
  /**
   * true면 온보딩 편의시설 목업(Figma 1252:43655)처럼 ~0.6613배 축소 크기로 그린다.
   * facility variant 전용으로 실측한 값이라 facility가 아닌 variant에도 적용은 되지만
   * 검증된 건 facility뿐이다.
   */
  compact?: boolean;
}

/**
 * 지도에서 건물/강의실/편의시설을 탭하거나 검색했을 때 아래에서 올라오는 시설 정보 바텀시트.
 * variant로 바깥 화면(outside)/건물 내부(inside)/특정 강의실(room)/편의시설(facility)
 * 네 가지 형태를 지원한다.
 */
export function FacilityInfoCard({
  variant,
  buildingCode,
  buildingName,
  roomNumber,
  facilityName,
  locationDetail,
  description,
  isFavorite = false,
  onToggleFavorite,
  onDeparturePress,
  onArrivalPress,
  images,
  facilityCounts,
  mainEntrance,
  operatingHours,
  onViewInsidePress,
  ctaLabel = '건물 내부 보기',
  ctaIcon,
  ctaIconWidth = 17,
  ctaIconHeight = 18,
  ctaVariant = 'primary',
  hideCta = false,
  hideGrabber = false,
  hideShadow = false,
  compact = false,
}: Props) {
  const theme = useTheme();
  const isRoom = variant === 'room';
  const isFacility = variant === 'facility';
  const hasBuildingDetails = variant === 'outside' || variant === 'inside';
  const showCta = !hideCta && (variant === 'outside' || variant === 'facility');
  const resolvedCtaIcon = ctaIcon === undefined ? BuildingViewIcon : ctaIcon ?? undefined;

  const actionButtons = (
    <ActionButtonRow compact={compact}>
      <SubButton variant="secondary" onPress={onDeparturePress} compact={compact}>
        출발
      </SubButton>
      <SubButton variant="primary" onPress={onArrivalPress} compact={compact}>
        도착
      </SubButton>
    </ActionButtonRow>
  );

  const card = (
    <Container variant={variant} compact={compact} hideShadow={hideShadow}>
      {!hideGrabber && <Grabber compact={compact} />}
      <Content compact={compact}>
        {isFacility ? (
          <FacilitySection compact={compact}>
            <FacilityHeaderGroup compact={compact}>
              <FacilityTitleBlock compact={compact}>
                <TitleRow>
                  <BuildingCodeText numberOfLines={1} style={{ flex: 1 }} compact={compact}>
                    {facilityName}
                  </BuildingCodeText>
                  <FavoriteToggle
                    isFavorite={isFavorite}
                    onPress={onToggleFavorite}
                    size={compact ? 15 : undefined}
                  />
                </TitleRow>
                <FacilityLocationRow compact={compact}>
                  <LocationCodeText compact={compact}>{buildingCode}</LocationCodeText>
                  <LocationNameText compact={compact}>{buildingName}</LocationNameText>
                  {locationDetail && <LocationCodeText compact={compact}>{locationDetail}</LocationCodeText>}
                </FacilityLocationRow>
              </FacilityTitleBlock>
              <OperatingHoursRow operatingHours={operatingHours} compact={compact} />
            </FacilityHeaderGroup>
            {actionButtons}
          </FacilitySection>
        ) : (
          <Body isRoom={isRoom}>
            <Header>
              <TitleRow>
                <TitleGroup>
                  <BuildingCodeText>{buildingCode}</BuildingCodeText>
                  <BuildingNameText>{buildingName}</BuildingNameText>
                  {isRoom && roomNumber && <BuildingCodeText>{roomNumber}</BuildingCodeText>}
                </TitleGroup>
                <FavoriteToggle isFavorite={isFavorite} onPress={onToggleFavorite} />
              </TitleRow>
              <DescriptionText numberOfLines={1}>{description}</DescriptionText>
              {/* Header 자체 gap(4px)에 2px를 더해서 room에서만 설명-운영시간 간격을 6px로 맞춘다 */}
              {isRoom && (
                <RoomOperatingHoursSpacer>
                  <OperatingHoursRow operatingHours={operatingHours} />
                </RoomOperatingHoursSpacer>
              )}
            </Header>

            {actionButtons}
          </Body>
        )}

        {isFacility && images && (
          <FacilityImagePair images={images} compact={compact} height={compact ? 66.133 : 100} />
        )}

        {hasBuildingDetails && (
          <DetailSection>
            {images && <FacilityImagePair images={images} />}

            {facilityCounts && facilityCounts.length > 0 && (
              <FacilityCountPill>
                {facilityCounts.map((item, index) => (
                  <React.Fragment key={item.label}>
                    <FacilityCountItemRow>
                      <item.icon
                        width={item.iconWidth ?? 17}
                        height={item.iconHeight ?? 17}
                        color={theme.blue[300]}
                      />
                      <FacilityCountText>
                        <FacilityLabelText>{item.label}</FacilityLabelText>
                        <FacilityCountValueText>{item.count}</FacilityCountValueText>
                      </FacilityCountText>
                    </FacilityCountItemRow>
                    {index !== facilityCounts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </FacilityCountPill>
            )}

            <InfoList>
              {mainEntrance && (
                <InfoRow>
                  <InfoLabelText>주 출입구</InfoLabelText>
                  <InfoValueText>{mainEntrance}</InfoValueText>
                </InfoRow>
              )}
              <InfoRow>
                <InfoLabelText>운영 시간</InfoLabelText>
                <OperatingHoursRow operatingHours={operatingHours} />
              </InfoRow>
            </InfoList>
          </DetailSection>
        )}
      </Content>

      {showCta && (
        <CtaWrapper>
          <Button
            label={ctaLabel}
            variant={ctaVariant}
            icon={resolvedCtaIcon}
            iconWidth={ctaIconWidth}
            iconHeight={ctaIconHeight}
            disabled={!onViewInsidePress}
            onPress={onViewInsidePress}
          />
        </CtaWrapper>
      )}

      {compact && <BottomFade pointerEvents="none" />}
    </Container>
  );

  if (!compact) return card;
  return <ShadowBottomClip spread={SHADOW_CLIP_SPREAD_PX}>{card}</ShadowBottomClip>;
}

// 건물 상세보기 화면(BuildingDetailScreen)의 "운영 시간" 행도 이 카드와 똑같은 모양을
// 써서 export한다.
export function OperatingHoursRow({
  operatingHours,
  compact = false,
}: {
  operatingHours: OperatingHoursInfo;
  compact?: boolean;
}) {
  return (
    <HoursGroup compact={compact}>
      <StatusDot isOpen={operatingHours.isOpen} compact={compact} />
      <HoursStatusText compact={compact}>{operatingHours.statusText}</HoursStatusText>
      <HoursDotSeparator compact={compact}>·</HoursDotSeparator>
      <HoursDetailText compact={compact}>{operatingHours.detailText}</HoursDetailText>
    </HoursGroup>
  );
}

function SubButton({
  variant,
  onPress,
  children,
  compact,
}: {
  variant: 'primary' | 'secondary';
  onPress?: () => void;
  children: string;
  compact: boolean;
}) {
  // 누르고 있는 동안의 배경색 — 공용 Button처럼 Pressable style 함수 대신 상태로 들고 있는다.
  const [isPressed, setIsPressed] = useState(false);
  return (
    <SubButtonContainer
      variant={variant}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      pressed={isPressed}
      compact={compact}
    >
      <SubButtonText variant={variant} pressed={isPressed} compact={compact}>
        {children}
      </SubButtonText>
    </SubButtonContainer>
  );
}

const Container = styled.View<{ variant: Props['variant']; compact: boolean; hideShadow: boolean }>`
  width: 100%;
  background-color: ${({ theme }) => theme.semantic.background.primary};
  border-top-left-radius: ${({ compact }) => (compact ? '10.581px' : '16px')};
  border-top-right-radius: ${({ compact }) => (compact ? '10.581px' : '16px')};
  align-items: center;
  padding-top: ${({ compact }) => (compact ? '5.291px' : '8px')};
  padding-bottom: ${({ compact }) => (compact ? '21.163px' : '32px')};
  /* outside/inside/room은 그래버-본문-CTA 사이가 24px, facility만 16px로 Figma 스펙이 다르다. */
  gap: ${({ variant, compact }) => (compact ? '10.581px' : variant === 'facility' ? '16px' : '24px')};
  /* compact(온보딩 편의시설 목업)만 Figma box-shadow 적용: 0 -2.645px 20px 0 rgba(0,0,0,0.10) */
  shadow-color: #000;
  shadow-offset: 0px ${({ compact }) => (compact ? '-2.645px' : '-4px')};
  shadow-opacity: ${({ hideShadow, compact }) => (hideShadow ? 0 : compact ? 0.1 : 0.05)};
  shadow-radius: 20px;
  elevation: ${({ hideShadow }) => (hideShadow ? 0 : 8)};
`;

const Grabber = styled.View<{ compact: boolean }>`
  width: ${({ compact }) => (compact ? '23.808px' : '36px')};
  height: ${({ compact }) => (compact ? '2.645px' : '4px')};
  border-radius: 100px;
  background-color: ${({ theme }) => theme.semantic.line.primary};
`;

const Content = styled.View<{ compact: boolean }>`
  width: 100%;
  padding-horizontal: ${({ compact }) => (compact ? '13.227px' : '20px')};
  gap: ${({ compact }) => (compact ? '7.936px' : '12px')};
`;

// outside/inside는 제목/설명 블록과 출발·도착 버튼 사이 gap이 4px, room은 16px로 Figma 스펙이 다르다.
const Body = styled.View<{ isRoom: boolean }>`
  width: 100%;
  gap: ${({ isRoom }) => (isRoom ? '16px' : '4px')};
`;

const RoomOperatingHoursSpacer = styled.View`
  margin-top: 2px;
`;

// facility 전용: (제목+위치 블록 + 운영시간) + 출발·도착 버튼 사이 gap 4px
const FacilitySection = styled.View<{ compact: boolean }>`
  width: 100%;
  gap: ${({ compact }) => (compact ? '2.645px' : '4px')};
`;

// facility 전용: (제목+위치 블록) + 운영시간 사이 gap 8px
const FacilityHeaderGroup = styled.View<{ compact: boolean }>`
  width: 100%;
  gap: ${({ compact }) => (compact ? '5.291px' : '8px')};
`;

// facility 전용: 제목 행 + 위치 행 사이 gap 4px
const FacilityTitleBlock = styled.View<{ compact: boolean }>`
  width: 100%;
  gap: ${({ compact }) => (compact ? '2.645px' : '4px')};
`;

const FacilityLocationRow = styled.View<{ compact: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${({ compact }) => (compact ? '2.645px' : '4px')};
  width: 100%;
`;

const LocationCodeText = styled.Text<{ compact: boolean }>`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ compact, theme }) => (compact ? '9.26px' : `${theme.typography.labelNormal.medium.fontSize}px`)};
  line-height: ${({ compact, theme }) =>
    compact ? '13.89px' : `${theme.typography.labelNormal.medium.lineHeight}px`};
  letter-spacing: ${({ compact, theme }) =>
    compact ? '-0.1852px' : `${theme.typography.labelNormal.medium.letterSpacing}px`};
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const LocationNameText = styled(LocationCodeText)`
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const Header = styled.View`
  width: 100%;
  gap: 4px;
`;

const TitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const TitleGroup = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const BuildingCodeText = styled.Text<{ compact?: boolean }>`
  font-family: ${({ theme }) => theme.typography.heading.semiBold.fontFamily};
  font-size: ${({ compact, theme }) => (compact ? '13.23px' : `${theme.typography.heading.semiBold.fontSize}px`)};
  line-height: ${({ compact, theme }) =>
    compact ? '18.52px' : `${theme.typography.heading.semiBold.lineHeight}px`};
  letter-spacing: ${({ compact, theme }) =>
    compact ? '-0.3969px' : `${theme.typography.heading.semiBold.letterSpacing}px`};
  color: ${({ theme }) => theme.semantic.text.primary};
`;

const BuildingNameText = styled(BuildingCodeText)`
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const DescriptionText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;


const ActionButtonRow = styled.View<{ compact: boolean }>`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  gap: ${({ compact }) => (compact ? '3.968px' : '6px')};
  width: 100%;
`;

// 눌렀을 때: 도착(primary)은 공용 Button과 같이 blue 800 → 900으로 한 단계 진하게, 출발(secondary)은
// 흰 배경은 그대로 두고 테두리(blue 300 → 500)와 글자(blue 700 → 800)만 진해진다.
const SubButtonContainer = styled(Pressable)<{ variant: 'primary' | 'secondary'; compact: boolean; pressed: boolean }>`
  padding: ${({ compact }) => (compact ? '3.968px 9.259px' : '6px 14px')};
  border-radius: 100px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, variant, pressed }) =>
    variant === 'primary'
      ? pressed
        ? theme.blue[900]
        : theme.blue[800]
      : theme.semantic.background.primary};
  border-width: ${({ variant, compact }) => (variant === 'secondary' ? (compact ? '0.661px' : '1px') : '0px')};
  border-color: ${({ theme, pressed }) => (pressed ? theme.blue[500] : theme.blue[300])};
`;

const SubButtonText = styled.Text<{ variant: 'primary' | 'secondary'; compact: boolean; pressed: boolean }>`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ compact, theme }) => (compact ? '9.26px' : `${theme.typography.labelNormal.semiBold.fontSize}px`)};
  line-height: ${({ compact, theme }) =>
    compact ? '13.89px' : `${theme.typography.labelNormal.semiBold.lineHeight}px`};
  letter-spacing: ${({ compact, theme }) =>
    compact ? '-0.1852px' : `${theme.typography.labelNormal.semiBold.letterSpacing}px`};
  color: ${({ theme, variant, pressed }) =>
    variant === 'primary' ? theme.semantic.text.white : pressed ? theme.blue[800] : theme.blue[700]};
`;

const DetailSection = styled.View`
  width: 100%;
`;

const FacilityCountPill = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.semantic.background.fill};
`;

const FacilityCountItemRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const FacilityCountText = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const FacilityLabelText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.blue[800]};
`;

const FacilityCountValueText = styled(FacilityLabelText)`
  color: ${({ theme }) => theme.blue[700]};
`;

const Divider = styled.View`
  width: 1px;
  height: 16px;
  background-color: ${({ theme }) => theme.semantic.line.secondary};
`;

const InfoList = styled.View`
  width: 100%;
  gap: 4px;
  margin-top: 16px;
`;

const InfoRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
`;

const InfoLabelText = styled.Text`
  width: 51px;
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const InfoValueText = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const HoursGroup = styled.View<{ compact?: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${({ compact }) => (compact ? '3.968px' : '6px')};
`;

const StatusDot = styled.View<{ isOpen: boolean; compact?: boolean }>`
  width: ${({ compact }) => (compact ? '3.968px' : '6px')};
  height: ${({ compact }) => (compact ? '3.968px' : '6px')};
  border-radius: 100px;
  background-color: ${({ theme, isOpen }) => (isOpen ? theme.semantic.success : theme.semantic.text.tertiary)};
`;

const HoursStatusText = styled.Text<{ compact?: boolean }>`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ compact, theme }) => (compact ? '9.26px' : `${theme.typography.labelNormal.medium.fontSize}px`)};
  line-height: ${({ compact, theme }) =>
    compact ? '13.89px' : `${theme.typography.labelNormal.medium.lineHeight}px`};
  letter-spacing: ${({ compact, theme }) =>
    compact ? '-0.1852px' : `${theme.typography.labelNormal.medium.letterSpacing}px`};
  color: ${({ theme }) => theme.semantic.text.secondary};
`;

const HoursDotSeparator = styled(HoursStatusText)`
  color: ${({ theme }) => theme.semantic.text.tertiary};
`;

const HoursDetailText = styled(HoursStatusText)``;

const CtaWrapper = styled.View`
  width: 100%;
  padding-horizontal: 20px;
`;

const SHADOW_CLIP_SPREAD_PX = 48;
