import React from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BuildingDetailContent } from '@components/common/BuildingDetailContent';
import { RootStackParamList } from '@navigation/types';

// 지도 위 시설 정보 카드(FacilityInfoCard)를 위로 슬라이드하면 뜨는 건물 상세보기.
// 실제 내용은 BuildingDetailContent가 갖고 있다 — 이 화면은 그걸 라우트에 연결만 한다.
// 진입 애니메이션을 따로 넣지 않는 이유: 카드를 드래그하는 동안 MapScreen이 이미 같은
// 내용을 실시간 미리보기로 겹쳐 그려서 화면 전환 시점엔 이미 이 모양대로 보이고 있고,
// RootNavigator에서 이 화면의 스택 전환 자체도 animation: 'none'이라 다시 움직이면
// 오히려 한 번 더 튀어 보인다.
export default function BuildingDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'BuildingDetail'>>();

  return <BuildingDetailContent buildingCode={params.buildingCode} onBack={() => navigation.goBack()} />;
}
