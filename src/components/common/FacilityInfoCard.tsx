import React from 'react';
import { Image, Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { SvgProps } from 'react-native-svg';
import StarIcon from '@assets/svgs/icons/star.svg';
import StarOutlineIcon from '@assets/svgs/icons/starOutline.svg';
import BuildingViewIcon from '@assets/svgs/icons/buildingView.svg';

export interface FacilityCountItem {
  icon: React.FC<SvgProps>;
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
   * 'room' - 특정 강의실/시설을 탭했을 때 뜨는 축약형 (이미지·시설 정보 없음)
   */
  variant: 'outside' | 'inside' | 'room';
  buildingCode: string;
  buildingName: string;
  /** room에서만 쓰인다 (예: "502호") */
  roomNumber?: string;
  description: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onDeparturePress?: () => void;
  onArrivalPress?: () => void;
  /** outside/inside에서만 쓰인다 */
  images?: [string, string];
  /** outside/inside에서만 쓰인다 (예: 프린터 2, PC실 1) */
  facilityCounts?: FacilityCountItem[];
  /** outside/inside에서만 쓰인다 (예: "정문(1층), 후문(지하1층)") */
  mainEntrance?: string;
  operatingHours: OperatingHoursInfo;
  /** outside에서만 쓰인다 */
  onViewInsidePress?: () => void;
}

/**
 * 지도에서 건물/강의실을 탭했을 때 아래에서 올라오는 시설 정보 바텀시트.
 * variant로 바깥 화면(outside)/건물 내부(inside)/특정 강의실(room) 세 가지 형태를 지원한다.
 */
export function FacilityInfoCard({
  variant,
  buildingCode,
  buildingName,
  roomNumber,
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
  const hasBuildingDetails = variant === 'outside' || variant === 'inside';

  return (
    <Container variant={variant}>
      <Grabber />
      <Content>
        <Body>
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
            {isRoom && <OperatingHoursRow operatingHours={operatingHours} />}
          </Header>

          <ActionButtonRow>
            <SubButton variant="secondary" onPress={onDeparturePress}>
              출발
            </SubButton>
            <SubButton variant="primary" onPress={onArrivalPress}>
              도착
            </SubButton>
          </ActionButtonRow>
        </Body>

        {hasBuildingDetails && (
          <DetailSection>
            {images && (
              <ImageRow>
                <BuildingImage source={{ uri: images[0] }} first />
                <BuildingImage source={{ uri: images[1] }} />
              </ImageRow>
            )}

            {facilityCounts && facilityCounts.length > 0 && (
              <FacilityCountPill>
                {facilityCounts.map((item, index) => (
                  <React.Fragment key={item.label}>
                    <FacilityCountItemRow>
                      <item.icon width={20} height={20} color={theme.blue[800]} />
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

      {variant === 'outside' && (
        <CtaWrapper>
          <CtaButton onPress={onViewInsidePress}>
            <CtaButtonText>건물 내부 보기</CtaButtonText>
            <BuildingViewIcon width={17} height={18} color="white" />
          </CtaButton>
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

function FavoriteToggle({ isFavorite, onPress }: { isFavorite: boolean; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <FavoriteCircle isFavorite={isFavorite} onPress={onPress} hitSlop={8}>
      {isFavorite ? (
        <StarIcon width={16} height={16} />
      ) : (
        <StarOutlineIcon width={16} height={16} color={theme.semantic.line.primary} />
      )}
    </FavoriteCircle>
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
  gap: 24px;
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

const Body = styled.View`
  width: 100%;
  gap: 12px;
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

const FavoriteCircle = styled(Pressable)<{ isFavorite: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 100px;
  align-items: center;
  justify-content: center;
  border-width: 1.5px;
  border-color: ${({ theme, isFavorite }) => (isFavorite ? theme.blue[300] : theme.semantic.line.secondary)};
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
  gap: 16px;
`;

const ImageRow = styled.View`
  flex-direction: row;
  gap: 4px;
  height: 100px;
  width: 100%;
`;

const BuildingImage = styled(Image)<{ first?: boolean }>`
  flex: 1;
  height: 100%;
  border-top-left-radius: ${({ first }) => (first ? '4px' : '0px')};
  border-bottom-left-radius: ${({ first }) => (first ? '4px' : '0px')};
  border-top-right-radius: ${({ first }) => (first ? '0px' : '4px')};
  border-bottom-right-radius: ${({ first }) => (first ? '0px' : '4px')};
`;

const FacilityCountPill = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  width: 100%;
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

const CtaButton = styled(Pressable)`
  width: 100%;
  height: 56px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.blue[800]};
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const CtaButtonText = styled.Text`
  font-family: ${({ theme }) => theme.typography.headline.semiBold.fontFamily};
  font-size: ${({ theme }) => theme.typography.headline.semiBold.fontSize}px;
  line-height: ${({ theme }) => theme.typography.headline.semiBold.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.headline.semiBold.letterSpacing}px;
  color: ${({ theme }) => theme.semantic.text.white};
`;
