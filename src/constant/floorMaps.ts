import { ComponentType } from 'react';
import { SvgProps } from 'react-native-svg';
import { FloorMapData } from '@appTypes/room';

export interface FloorMapAssets {
  data: FloorMapData;
  /** 벽/방 박스 배경 SVG (IndoorMapView renderBackground). 문은 data.doors로 FloorDoors가 그린다 */
  Background: ComponentType<SvgProps>;
}

/**
 * 전 건물 층 평면도(processFloor.js 산출물) 목록. 키는 "{건물}_{층}"(지하는 "_B{n}", R동 L층은 "_L").
 * 전 층의 JSON/SVG를 앱 시작 때 한꺼번에 읽지 않도록, 층을 실제로 열 때 require하는
 * 로더 함수로 들고 있는다. 새 층을 추가하면 여기 한 줄 추가한다.
 */
export const FLOOR_MAPS: Record<string, () => FloorMapAssets> = {
  A_1: () => ({
    data: require('@assets/svgs/floors/A_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/A_1_bg.svg').default,
  }),
  A_2: () => ({
    data: require('@assets/svgs/floors/A_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/A_2_bg.svg').default,
  }),
  B_1: () => ({
    data: require('@assets/svgs/floors/B_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/B_1_bg.svg').default,
  }),
  B_2: () => ({
    data: require('@assets/svgs/floors/B_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/B_2_bg.svg').default,
  }),
  B_3: () => ({
    data: require('@assets/svgs/floors/B_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/B_3_bg.svg').default,
  }),
  B_4: () => ({
    data: require('@assets/svgs/floors/B_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/B_4_bg.svg').default,
  }),
  C_1: () => ({
    data: require('@assets/svgs/floors/C_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_1_bg.svg').default,
  }),
  C_2: () => ({
    data: require('@assets/svgs/floors/C_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_2_bg.svg').default,
  }),
  C_3: () => ({
    data: require('@assets/svgs/floors/C_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_3_bg.svg').default,
  }),
  C_4: () => ({
    data: require('@assets/svgs/floors/C_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_4_bg.svg').default,
  }),
  C_5: () => ({
    data: require('@assets/svgs/floors/C_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_5_bg.svg').default,
  }),
  C_6: () => ({
    data: require('@assets/svgs/floors/C_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_6_bg.svg').default,
  }),
  C_7: () => ({
    data: require('@assets/svgs/floors/C_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_7_bg.svg').default,
  }),
  C_8: () => ({
    data: require('@assets/svgs/floors/C_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_8_bg.svg').default,
  }),
  C_9: () => ({
    data: require('@assets/svgs/floors/C_9.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_9_bg.svg').default,
  }),
  D_B5: () => ({
    data: require('@assets/svgs/floors/D_B5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/D_B5_bg.svg').default,
  }),
  D_B4: () => ({
    data: require('@assets/svgs/floors/D_B4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/D_B4_bg.svg').default,
  }),
  D_B3: () => ({
    data: require('@assets/svgs/floors/D_B3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/D_B3_bg.svg').default,
  }),
  D_B2: () => ({
    data: require('@assets/svgs/floors/D_B2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/D_B2_bg.svg').default,
  }),
  D_B1: () => ({
    data: require('@assets/svgs/floors/D_B1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/D_B1_bg.svg').default,
  }),
  E_1: () => ({
    data: require('@assets/svgs/floors/E_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_1_bg.svg').default,
  }),
  E_2: () => ({
    data: require('@assets/svgs/floors/E_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_2_bg.svg').default,
  }),
  E_3: () => ({
    data: require('@assets/svgs/floors/E_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_3_bg.svg').default,
  }),
  E_4: () => ({
    data: require('@assets/svgs/floors/E_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_4_bg.svg').default,
  }),
  E_5: () => ({
    data: require('@assets/svgs/floors/E_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_5_bg.svg').default,
  }),
  E_6: () => ({
    data: require('@assets/svgs/floors/E_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_6_bg.svg').default,
  }),
  E_7: () => ({
    data: require('@assets/svgs/floors/E_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_7_bg.svg').default,
  }),
  E_8: () => ({
    data: require('@assets/svgs/floors/E_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_8_bg.svg').default,
  }),
  E_9: () => ({
    data: require('@assets/svgs/floors/E_9.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_9_bg.svg').default,
  }),
  E_10: () => ({
    data: require('@assets/svgs/floors/E_10.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_10_bg.svg').default,
  }),
  F_1: () => ({
    data: require('@assets/svgs/floors/F_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_1_bg.svg').default,
  }),
  F_2: () => ({
    data: require('@assets/svgs/floors/F_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_2_bg.svg').default,
  }),
  F_3: () => ({
    data: require('@assets/svgs/floors/F_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_3_bg.svg').default,
  }),
  F_4: () => ({
    data: require('@assets/svgs/floors/F_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_4_bg.svg').default,
  }),
  F_5: () => ({
    data: require('@assets/svgs/floors/F_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_5_bg.svg').default,
  }),
  F_6: () => ({
    data: require('@assets/svgs/floors/F_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_6_bg.svg').default,
  }),
  F_7: () => ({
    data: require('@assets/svgs/floors/F_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_7_bg.svg').default,
  }),
  F_8: () => ({
    data: require('@assets/svgs/floors/F_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_8_bg.svg').default,
  }),
  G_B1: () => ({
    data: require('@assets/svgs/floors/G_B1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/G_B1_bg.svg').default,
  }),
  G_1: () => ({
    data: require('@assets/svgs/floors/G_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/G_1_bg.svg').default,
  }),
  G_2: () => ({
    data: require('@assets/svgs/floors/G_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/G_2_bg.svg').default,
  }),
  G_3: () => ({
    data: require('@assets/svgs/floors/G_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/G_3_bg.svg').default,
  }),
  G_4: () => ({
    data: require('@assets/svgs/floors/G_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/G_4_bg.svg').default,
  }),
  H_1: () => ({
    data: require('@assets/svgs/floors/H_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/H_1_bg.svg').default,
  }),
  H_2: () => ({
    data: require('@assets/svgs/floors/H_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/H_2_bg.svg').default,
  }),
  H_3: () => ({
    data: require('@assets/svgs/floors/H_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/H_3_bg.svg').default,
  }),
  H_4: () => ({
    data: require('@assets/svgs/floors/H_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/H_4_bg.svg').default,
  }),
  H_5: () => ({
    data: require('@assets/svgs/floors/H_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/H_5_bg.svg').default,
  }),
  H_6: () => ({
    data: require('@assets/svgs/floors/H_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/H_6_bg.svg').default,
  }),
  I_1: () => ({
    data: require('@assets/svgs/floors/I_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/I_1_bg.svg').default,
  }),
  I_2: () => ({
    data: require('@assets/svgs/floors/I_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/I_2_bg.svg').default,
  }),
  I_3: () => ({
    data: require('@assets/svgs/floors/I_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/I_3_bg.svg').default,
  }),
  I_4: () => ({
    data: require('@assets/svgs/floors/I_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/I_4_bg.svg').default,
  }),
  I_5: () => ({
    data: require('@assets/svgs/floors/I_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/I_5_bg.svg').default,
  }),
  I_6: () => ({
    data: require('@assets/svgs/floors/I_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/I_6_bg.svg').default,
  }),
  K_B1: () => ({
    data: require('@assets/svgs/floors/K_B1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/K_B1_bg.svg').default,
  }),
  K_1: () => ({
    data: require('@assets/svgs/floors/K_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/K_1_bg.svg').default,
  }),
  K_2: () => ({
    data: require('@assets/svgs/floors/K_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/K_2_bg.svg').default,
  }),
  K_3: () => ({
    data: require('@assets/svgs/floors/K_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/K_3_bg.svg').default,
  }),
  K_4: () => ({
    data: require('@assets/svgs/floors/K_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/K_4_bg.svg').default,
  }),
  K_5: () => ({
    data: require('@assets/svgs/floors/K_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/K_5_bg.svg').default,
  }),
  K_6: () => ({
    data: require('@assets/svgs/floors/K_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/K_6_bg.svg').default,
  }),
  L_1: () => ({
    data: require('@assets/svgs/floors/L_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_1_bg.svg').default,
  }),
  L_2: () => ({
    data: require('@assets/svgs/floors/L_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_2_bg.svg').default,
  }),
  L_3: () => ({
    data: require('@assets/svgs/floors/L_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_3_bg.svg').default,
  }),
  L_4: () => ({
    data: require('@assets/svgs/floors/L_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_4_bg.svg').default,
  }),
  L_5: () => ({
    data: require('@assets/svgs/floors/L_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_5_bg.svg').default,
  }),
  L_6: () => ({
    data: require('@assets/svgs/floors/L_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_6_bg.svg').default,
  }),
  L_7: () => ({
    data: require('@assets/svgs/floors/L_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_7_bg.svg').default,
  }),
  L_8: () => ({
    data: require('@assets/svgs/floors/L_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_8_bg.svg').default,
  }),
  L_9: () => ({
    data: require('@assets/svgs/floors/L_9.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_9_bg.svg').default,
  }),
  L_10: () => ({
    data: require('@assets/svgs/floors/L_10.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_10_bg.svg').default,
  }),
  MH_1: () => ({
    data: require('@assets/svgs/floors/MH_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_1_bg.svg').default,
  }),
  MH_3: () => ({
    data: require('@assets/svgs/floors/MH_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_3_bg.svg').default,
  }),
  MH_4: () => ({
    data: require('@assets/svgs/floors/MH_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_4_bg.svg').default,
  }),
  MH_5: () => ({
    data: require('@assets/svgs/floors/MH_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_5_bg.svg').default,
  }),
  MH_6: () => ({
    data: require('@assets/svgs/floors/MH_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_6_bg.svg').default,
  }),
  MH_7: () => ({
    data: require('@assets/svgs/floors/MH_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_7_bg.svg').default,
  }),
  MH_8: () => ({
    data: require('@assets/svgs/floors/MH_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_8_bg.svg').default,
  }),
  MH_9: () => ({
    data: require('@assets/svgs/floors/MH_9.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_9_bg.svg').default,
  }),
  MH_10: () => ({
    data: require('@assets/svgs/floors/MH_10.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_10_bg.svg').default,
  }),
  MH_11: () => ({
    data: require('@assets/svgs/floors/MH_11.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_11_bg.svg').default,
  }),
  MH_12: () => ({
    data: require('@assets/svgs/floors/MH_12.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_12_bg.svg').default,
  }),
  MH_13: () => ({
    data: require('@assets/svgs/floors/MH_13.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_13_bg.svg').default,
  }),
  MH_14: () => ({
    data: require('@assets/svgs/floors/MH_14.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_14_bg.svg').default,
  }),
  MH_15: () => ({
    data: require('@assets/svgs/floors/MH_15.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_15_bg.svg').default,
  }),
  P_B2: () => ({
    data: require('@assets/svgs/floors/P_B2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_B2_bg.svg').default,
  }),
  P_B1: () => ({
    data: require('@assets/svgs/floors/P_B1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_B1_bg.svg').default,
  }),
  P_1: () => ({
    data: require('@assets/svgs/floors/P_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_1_bg.svg').default,
  }),
  P_2: () => ({
    data: require('@assets/svgs/floors/P_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_2_bg.svg').default,
  }),
  P_3: () => ({
    data: require('@assets/svgs/floors/P_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_3_bg.svg').default,
  }),
  P_4: () => ({
    data: require('@assets/svgs/floors/P_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_4_bg.svg').default,
  }),
  P_5: () => ({
    data: require('@assets/svgs/floors/P_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_5_bg.svg').default,
  }),
  P_6: () => ({
    data: require('@assets/svgs/floors/P_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_6_bg.svg').default,
  }),
  P_7: () => ({
    data: require('@assets/svgs/floors/P_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_7_bg.svg').default,
  }),
  P_8: () => ({
    data: require('@assets/svgs/floors/P_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_8_bg.svg').default,
  }),
  Q_1: () => ({
    data: require('@assets/svgs/floors/Q_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_1_bg.svg').default,
  }),
  Q_2: () => ({
    data: require('@assets/svgs/floors/Q_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_2_bg.svg').default,
  }),
  Q_3: () => ({
    data: require('@assets/svgs/floors/Q_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_3_bg.svg').default,
  }),
  Q_4: () => ({
    data: require('@assets/svgs/floors/Q_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_4_bg.svg').default,
  }),
  Q_5: () => ({
    data: require('@assets/svgs/floors/Q_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_5_bg.svg').default,
  }),
  Q_6: () => ({
    data: require('@assets/svgs/floors/Q_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_6_bg.svg').default,
  }),
  Q_7: () => ({
    data: require('@assets/svgs/floors/Q_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_7_bg.svg').default,
  }),
  Q_8: () => ({
    data: require('@assets/svgs/floors/Q_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_8_bg.svg').default,
  }),
  Q_9: () => ({
    data: require('@assets/svgs/floors/Q_9.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_9_bg.svg').default,
  }),
  Q_10: () => ({
    data: require('@assets/svgs/floors/Q_10.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_10_bg.svg').default,
  }),
  R_B4: () => ({
    data: require('@assets/svgs/floors/R_B4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_B4_bg.svg').default,
  }),
  R_B3: () => ({
    data: require('@assets/svgs/floors/R_B3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_B3_bg.svg').default,
  }),
  R_B2: () => ({
    data: require('@assets/svgs/floors/R_B2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_B2_bg.svg').default,
  }),
  R_L: () => ({
    data: require('@assets/svgs/floors/R_L.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_L_bg.svg').default,
  }),
  R_1: () => ({
    data: require('@assets/svgs/floors/R_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_1_bg.svg').default,
  }),
  R_2: () => ({
    data: require('@assets/svgs/floors/R_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_2_bg.svg').default,
  }),
  R_3: () => ({
    data: require('@assets/svgs/floors/R_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_3_bg.svg').default,
  }),
  R_4: () => ({
    data: require('@assets/svgs/floors/R_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_4_bg.svg').default,
  }),
  R_5: () => ({
    data: require('@assets/svgs/floors/R_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_5_bg.svg').default,
  }),
  R_6: () => ({
    data: require('@assets/svgs/floors/R_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_6_bg.svg').default,
  }),
  R_7: () => ({
    data: require('@assets/svgs/floors/R_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_7_bg.svg').default,
  }),
  R_8: () => ({
    data: require('@assets/svgs/floors/R_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_8_bg.svg').default,
  }),
  R_9: () => ({
    data: require('@assets/svgs/floors/R_9.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_9_bg.svg').default,
  }),
  R_10: () => ({
    data: require('@assets/svgs/floors/R_10.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_10_bg.svg').default,
  }),
  R_11: () => ({
    data: require('@assets/svgs/floors/R_11.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_11_bg.svg').default,
  }),
  R_12: () => ({
    data: require('@assets/svgs/floors/R_12.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_12_bg.svg').default,
  }),
  R_13: () => ({
    data: require('@assets/svgs/floors/R_13.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_13_bg.svg').default,
  }),
  R_14: () => ({
    data: require('@assets/svgs/floors/R_14.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_14_bg.svg').default,
  }),
  R_15: () => ({
    data: require('@assets/svgs/floors/R_15.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_15_bg.svg').default,
  }),
  R_16: () => ({
    data: require('@assets/svgs/floors/R_16.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_16_bg.svg').default,
  }),
  S_1: () => ({
    data: require('@assets/svgs/floors/S_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/S_1_bg.svg').default,
  }),
  T_B1: () => ({
    data: require('@assets/svgs/floors/T_B1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_B1_bg.svg').default,
  }),
  T_1: () => ({
    data: require('@assets/svgs/floors/T_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_1_bg.svg').default,
  }),
  T_2: () => ({
    data: require('@assets/svgs/floors/T_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_2_bg.svg').default,
  }),
  T_3: () => ({
    data: require('@assets/svgs/floors/T_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_3_bg.svg').default,
  }),
  T_4: () => ({
    data: require('@assets/svgs/floors/T_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_4_bg.svg').default,
  }),
  T_5: () => ({
    data: require('@assets/svgs/floors/T_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_5_bg.svg').default,
  }),
  T_6: () => ({
    data: require('@assets/svgs/floors/T_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_6_bg.svg').default,
  }),
  T_7: () => ({
    data: require('@assets/svgs/floors/T_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_7_bg.svg').default,
  }),
  T_8: () => ({
    data: require('@assets/svgs/floors/T_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_8_bg.svg').default,
  }),
  T_9: () => ({
    data: require('@assets/svgs/floors/T_9.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_9_bg.svg').default,
  }),
  T_10: () => ({
    data: require('@assets/svgs/floors/T_10.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_10_bg.svg').default,
  }),
  U_B2: () => ({
    data: require('@assets/svgs/floors/U_B2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_B2_bg.svg').default,
  }),
  U_B1: () => ({
    data: require('@assets/svgs/floors/U_B1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_B1_bg.svg').default,
  }),
  U_1: () => ({
    data: require('@assets/svgs/floors/U_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_1_bg.svg').default,
  }),
  U_2: () => ({
    data: require('@assets/svgs/floors/U_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_2_bg.svg').default,
  }),
  U_3: () => ({
    data: require('@assets/svgs/floors/U_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_3_bg.svg').default,
  }),
  U_4: () => ({
    data: require('@assets/svgs/floors/U_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_4_bg.svg').default,
  }),
  U_5: () => ({
    data: require('@assets/svgs/floors/U_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_5_bg.svg').default,
  }),
  U_6: () => ({
    data: require('@assets/svgs/floors/U_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_6_bg.svg').default,
  }),
  U_7: () => ({
    data: require('@assets/svgs/floors/U_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_7_bg.svg').default,
  }),
  Z1_1: () => ({
    data: require('@assets/svgs/floors/Z1_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z1_1_bg.svg').default,
  }),
  Z1_2: () => ({
    data: require('@assets/svgs/floors/Z1_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z1_2_bg.svg').default,
  }),
  Z2_1: () => ({
    data: require('@assets/svgs/floors/Z2_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z2_1_bg.svg').default,
  }),
  Z2_2: () => ({
    data: require('@assets/svgs/floors/Z2_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z2_2_bg.svg').default,
  }),
  Z2_3: () => ({
    data: require('@assets/svgs/floors/Z2_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z2_3_bg.svg').default,
  }),
  Z2_4: () => ({
    data: require('@assets/svgs/floors/Z2_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z2_4_bg.svg').default,
  }),
  Z2_5: () => ({
    data: require('@assets/svgs/floors/Z2_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z2_5_bg.svg').default,
  }),
  Z2_6: () => ({
    data: require('@assets/svgs/floors/Z2_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z2_6_bg.svg').default,
  }),
};

export interface FloorInfo {
  floorId: string;
  /** 층 번호. 지하는 음수(B1 = -1) */
  floorNum: number;
  /** 층 선택기에 보여줄 라벨 (예: "2", "B1") */
  label: string;
}

export function parseFloorId(floorId: string): FloorInfo & { building: string } {
  // R동 L층(B2층과 1층 사이, 방 번호는 B1xx)은 숫자가 아니라 "L"로 표기한다. 순서만 맞으면 되니 0층으로 둔다.
  const lobbyMatch = floorId.match(/^(.+)_L$/);
  if (lobbyMatch) return { floorId, building: lobbyMatch[1], floorNum: 0, label: 'L' };
  // Z1, Z2처럼 건물 이름 자체에 숫자가 들어가는 경우도 있어서, 끝의 "_(B)?숫자"만 층으로 떼어낸다.
  const match = floorId.match(/^(.+)_(B)?(\d+)$/);
  if (!match) return { floorId, building: floorId, floorNum: 0, label: floorId };
  const [, building, basement, num] = match;
  return {
    floorId,
    building,
    floorNum: basement ? -Number(num) : Number(num),
    label: basement ? `B${num}` : num,
  };
}

/** 다른 동 도면에 함께 그려진 층: 그 층이 그려진 도면과, 도면에서 이 동 부분만 남길 영역(도면 y가 minY 이상) */
interface HostedFloor {
  floorId: string;
  minY: number;
}

/**
 * 자기 도면 없이 다른 동 도면에 함께 그려진 층. J동(제3공학관)은 L동(와우관) 4~8층 도면 아래쪽(계단 통로 아래의
 * 복도와 J로 시작하는 호실 줄)에 같이 들어 있다. 서버는 이 호실을 "J동 101호"(J동 1층)처럼 J동 기준 층으로 주니,
 * "J_1" 같은 J동 층 키를 그 호실이 그려진 L동 도면으로 이어 준다. 지도(검색·길 안내)에는 J동 부분만 깔도록
 * renderFloorOverlay.js가 이 영역만 잘라 J동 층 PNG를 따로 굽는다 — 그래서 스크립트와 같이 쓰는 JSON에 둔다.
 */
const HOSTED_FLOORS = require('./hostedFloors.json') as Record<string, HostedFloor>;

/** 층 키를 실제 평면도 키로 바꾼다. 다른 동 도면에 함께 그려진 층("J_1")이면 그 도면("L_6"), 아니면 그대로. */
export function resolveFloorId(floorId: string): string {
  return HOSTED_FLOORS[floorId]?.floorId ?? floorId;
}

/** 다른 동 도면에 함께 그려진 층("J_1")이면 도면에서 그 동 부분의 경계(y ≥ minY). 아니면 undefined. */
export function getHostedArea(floorId: string): { minY: number } | undefined {
  const hosted = HOSTED_FLOORS[floorId];
  return hosted ? { minY: hosted.minY } : undefined;
}

/**
 * 평면도에서 탭한 방이 실제로 속한 동과 호실 번호. 보통은 도면의 동 그대로지만, L동 도면에 함께 그려진
 * J동 호실("J101")은 J동 101호로 돌려준다 — 카드·즐겨찾기·길찾기가 서버 이름("J동 101호")과 맞도록.
 */
export function getRoomOwner(floorId: string, roomLabel: string): { buildingCode: string; roomNumber: string } {
  const hosted = Object.keys(HOSTED_FLOORS)
    .filter(key => HOSTED_FLOORS[key].floorId === floorId)
    .map(key => parseFloorId(key).building)
    .find(building => new RegExp(`^${building}\\d`).test(roomLabel));
  if (hosted) return { buildingCode: `${hosted}동`, roomNumber: roomLabel.slice(hosted.length) };
  return { buildingCode: `${parseFloorId(floorId).building}동`, roomNumber: roomLabel };
}

/**
 * 건물 코드("T동" 또는 "T")의 층 목록을 엘리베이터 버튼처럼 높은 층이 위로 오게 내림차순으로
 * 돌려준다. 다른 동 도면에 함께 그려진 동(J동)은 그 도면을 자기 층 번호로 보여준다. 평면도가 없는 건물이면 빈 배열.
 */
export function getBuildingFloors(buildingCode: string): FloorInfo[] {
  const building = buildingCode.replace(/동$/, '');
  const own = Object.keys(FLOOR_MAPS)
    .map(parseFloorId)
    .filter(info => info.building === building);
  const hosted = Object.keys(HOSTED_FLOORS)
    .map(parseFloorId)
    .filter(info => info.building === building)
    .map(info => ({ ...info, floorId: resolveFloorId(info.floorId) }));
  return [...own, ...hosted]
    .sort((a, b) => b.floorNum - a.floorNum)
    .map(({ floorId, floorNum, label }) => ({ floorId, floorNum, label }));
}

/**
 * 건물 코드("C동" 또는 "C")와 호실 번호("816" 또는 "816호")로 그 호실이 있는 층과 방 도형들을 찾는다. 한 호실이
 * 도형 여러 개로 나뉜 경우가 있어 같은 번호의 방을 모두 돌려준다. 층을 이미 알면(서버 장소 상세) preferredFloorId를
 * 먼저 본다. 평면도에 없는 호실이면 null.
 * 돌려주는 floorId는 지도에 깔 층 키다 — 다른 동 도면에 함께 그려진 동(J동)이면 "J_1"처럼 그 동의 층 키라서,
 * FloorPlanOverlay가 L동 도면 중 J동 부분만 깐다. data는 실제 도면(L_6) 것이다.
 */
export function findRoomFloor(buildingCode: string, roomNumber: string, preferredFloorId?: string) {
  const building = buildingCode.replace(/동$/, '');
  const room = roomNumber.replace(/호$/, '');
  // H동처럼 평면도 방 번호에 건물 글자가 붙은 경우("H314")도 같은 호실로 본다.
  const prefixed = `${building}${room}`;
  const floorIds = [
    ...Object.keys(FLOOR_MAPS).filter(id => parseFloorId(id).building === building),
    ...Object.keys(HOSTED_FLOORS).filter(id => parseFloorId(id).building === building),
  ];
  const ordered =
    preferredFloorId && floorIds.includes(preferredFloorId) ? [preferredFloorId, ...floorIds] : floorIds;
  for (const floorId of ordered) {
    const data = FLOOR_MAPS[resolveFloorId(floorId)]().data;
    const rooms = data.rooms.filter(shape => [room, prefixed].includes(shape.label ?? shape.id));
    if (rooms.length > 0) return { floorId, data, rooms };
  }
  return null;
}
