import React, { useState } from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import BuildingViewIcon from '@assets/svgs/icons/buildingView.svg';
import { Button } from './Button';
import { FavoriteToggle } from './FavoriteToggle';
import { FacilityImagePair } from './FacilityImagePair';

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
   * 'inside' - 건물 내부로 들어간 상태에서 뜨는 바텀시트 (CTA 없음, 높이 고정)
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
}: Props) {
  const theme = useTheme();
  const isRoom = variant === 'room';
  const isFacility = variant === 'facility';
  const hasBuildingDetails = variant === 'outside' || variant === 'inside';
  const showCta = variant === 'outside' || variant === 'facility';

  const actionButtons = (
    <ActionButtonRow>
      <SubButton variant="secondary" onPress={onDeparturePress}>
        출발
      </SubButton>
      <SubButton variant="primary" onPress={onArrivalPress}>
        도착
      </SubButton>
    </ActionButtonRow>
  );

  return (
    <Container variant={variant}>
      <Grabber />
      <Content>
        {isFacility ? (
          <FacilitySection>
            <FacilityHeaderGroup>
              <FacilityTitleBlock>
                <TitleRow>
                  <BuildingCodeText numberOfLines={1} style={{ flex: 1 }}>
                    {facilityName}
                  </BuildingCodeText>
                  <FavoriteToggle isFavorite={isFavorite} onPress={onToggleFavorite} />
                </TitleRow>
                <FacilityLocationRow>
                  <LocationCodeText>{buildingCode}</LocationCodeText>
                  <LocationNameText>{buildingName}</LocationNameText>
                  {locationDetail && <LocationCodeText>{locationDetail}</LocationCodeText>}
                </FacilityLocationRow>
              </FacilityTitleBlock>
              <OperatingHoursRow operatingHours={operatingHours} />
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

        {isFacility && images && <FacilityImagePair images={images} />}

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
          <Button label="건물 내부 보기" icon={BuildingViewIcon} iconWidth={17} iconHeight={18} onPress={onViewInsidePress} />
        </CtaWrapper>
      )}
    </Container>
  );
}

function OperatingHoursRow({ operatingHours }: { operatingHours: OperatingHoursInfo }) {
  return (
    <HoursGroup>
      <StatusDot isOpen={operatingHours.isOpen} />
      <HoursStatusText>{operatingHours.statusText}</HoursStatusText>
      <HoursDotSeparator>·</HoursDotSeparator>
      <HoursDetailText>{operatingHours.detailText}</HoursDetailText>
    </HoursGroup>
  );
}

function SubButton({
  variant,
  onPress,
  children,
}: {
  variant: 'primary' | 'secondary';
  onPress?: () => void;
  children: string;
}) {
  return (
    <SubButtonContainer variant={variant} onPress={onPress}>
      <SubButtonText variant={variant}>{children}</SubButtonText>
    </SubButtonContainer>
  );
}

const Container = styled.View<{ variant: Props['variant'] }>`
  width: 100%;
  background-color: ${({ theme }) => theme.semantic.background.primary};
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  align-items: center;
  padding-top: 8px;
  padding-bottom: 32px;
  /* outside/inside/room은 그래버-본문-CTA 사이가 24px, facility만 16px로 Figma 스펙이 다르다. */
  gap: ${({ variant }) => (variant === 'facility' ? '16px' : '24px')};
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.05;
  shadow-radius: 20px;
  elevation: 8;
  ${({ variant }) => (variant === 'inside' ? 'height: 400px;' : '')}
`;

const Grabber = styled.View`
  width: 36px;
  height: 4px;
  border-radius: 100px;
  background-color: ${({ theme }) => theme.semantic.line.primary};
`;

const Content = styled.View`
  width: 100%;
  padding-horizontal: 20px;
  gap: 12px;
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
const FacilitySection = styled.View`
  width: 100%;
  gap: 4px;
`;

// facility 전용: (제목+위치 블록) + 운영시간 사이 gap 8px
const FacilityHeaderGroup = styled.View`
  width: 100%;
  gap: 8px;
`;

// facility 전용: 제목 행 + 위치 행 사이 gap 4px
const FacilityTitleBlock = styled.View`
  width: 100%;
  gap: 4px;
`;

const FacilityLocationRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  width: 100%;
`;

const LocationCodeText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
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

const BuildingCodeText = styled.Text`
  font-family: ${({ theme }) => theme.typography.heading.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.heading.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.heading.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.heading.semiBold.letterSpacing}px;
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


const ActionButtonRow = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  width: 100%;
`;

const SubButtonContainer = styled(Pressable)<{ variant: 'primary' | 'secondary' }>`
  padding: 6px 14px;
  border-radius: 100px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, variant }) => (variant === 'primary' ? theme.blue[800] : theme.semantic.background.primary)};
  border-width: ${({ variant }) => (variant === 'secondary' ? '1px' : '0px')};
  border-color: ${({ theme }) => theme.blue[300]};
`;

const SubButtonText = styled.Text<{ variant: 'primary' | 'secondary' }>`
  font-family: ${({ theme }) => theme.typography.labelNormal.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.semiBold.letterSpacing}px;
  color: ${({ theme, variant }) => (variant === 'primary' ? theme.semantic.text.white : theme.blue[700])};
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

const HoursGroup = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const StatusDot = styled.View<{ isOpen: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 100px;
  background-color: ${({ theme, isOpen }) => (isOpen ? theme.semantic.success : theme.semantic.text.tertiary)};
`;

const HoursStatusText = styled.Text`
  font-family: ${({ theme }) => theme.typography.labelNormal.medium.fontFamily};
  font-size: ${({ theme }) => theme.typography.labelNormal.medium.fontSize}px;
  line-height: ${({ theme }) => theme.typography.labelNormal.medium.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.labelNormal.medium.letterSpacing}px;
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
