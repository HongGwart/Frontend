import { ComponentType } from 'react';
import { SvgProps } from 'react-native-svg';
import { FloorMapData } from '@appTypes/room';

export interface FloorMapAssets {
  data: FloorMapData;
  /** 벽/방 박스 배경 SVG (IndoorMapView renderBackground) */
  Background: ComponentType<SvgProps>;
  /** 하이라이트 위에 다시 그리는 문 SVG (IndoorMapView renderForeground) */
  Doors: ComponentType<SvgProps>;
}

/**
 * 전 건물 층 평면도(processFloor.js 산출물) 목록. 키는 "{건물}_{층}"(지하는 "_B{n}").
 * 139개 층의 JSON/SVG를 앱 시작 때 한꺼번에 읽지 않도록, 층을 실제로 열 때 require하는
 * 로더 함수로 들고 있는다. 새 층을 추가하면 여기 한 줄 추가한다.
 */
export const FLOOR_MAPS: Record<string, () => FloorMapAssets> = {
  A_2: () => ({
    data: require('@assets/svgs/floors/A_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/A_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/A_2_doors.svg').default,
  }),
  B_1: () => ({
    data: require('@assets/svgs/floors/B_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/B_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/B_1_doors.svg').default,
  }),
  B_2: () => ({
    data: require('@assets/svgs/floors/B_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/B_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/B_2_doors.svg').default,
  }),
  B_3: () => ({
    data: require('@assets/svgs/floors/B_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/B_3_bg.svg').default,
    Doors: require('@assets/svgs/floors/B_3_doors.svg').default,
  }),
  C_1: () => ({
    data: require('@assets/svgs/floors/C_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/C_1_doors.svg').default,
  }),
  C_2: () => ({
    data: require('@assets/svgs/floors/C_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/C_2_doors.svg').default,
  }),
  C_3: () => ({
    data: require('@assets/svgs/floors/C_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_3_bg.svg').default,
    Doors: require('@assets/svgs/floors/C_3_doors.svg').default,
  }),
  C_4: () => ({
    data: require('@assets/svgs/floors/C_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_4_bg.svg').default,
    Doors: require('@assets/svgs/floors/C_4_doors.svg').default,
  }),
  C_5: () => ({
    data: require('@assets/svgs/floors/C_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_5_bg.svg').default,
    Doors: require('@assets/svgs/floors/C_5_doors.svg').default,
  }),
  C_6: () => ({
    data: require('@assets/svgs/floors/C_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_6_bg.svg').default,
    Doors: require('@assets/svgs/floors/C_6_doors.svg').default,
  }),
  C_7: () => ({
    data: require('@assets/svgs/floors/C_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_7_bg.svg').default,
    Doors: require('@assets/svgs/floors/C_7_doors.svg').default,
  }),
  C_8: () => ({
    data: require('@assets/svgs/floors/C_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_8_bg.svg').default,
    Doors: require('@assets/svgs/floors/C_8_doors.svg').default,
  }),
  C_9: () => ({
    data: require('@assets/svgs/floors/C_9.json') as FloorMapData,
    Background: require('@assets/svgs/floors/C_9_bg.svg').default,
    Doors: require('@assets/svgs/floors/C_9_doors.svg').default,
  }),
  D_B5: () => ({
    data: require('@assets/svgs/floors/D_B5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/D_B5_bg.svg').default,
    Doors: require('@assets/svgs/floors/D_B5_doors.svg').default,
  }),
  D_B4: () => ({
    data: require('@assets/svgs/floors/D_B4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/D_B4_bg.svg').default,
    Doors: require('@assets/svgs/floors/D_B4_doors.svg').default,
  }),
  D_B3: () => ({
    data: require('@assets/svgs/floors/D_B3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/D_B3_bg.svg').default,
    Doors: require('@assets/svgs/floors/D_B3_doors.svg').default,
  }),
  D_B2: () => ({
    data: require('@assets/svgs/floors/D_B2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/D_B2_bg.svg').default,
    Doors: require('@assets/svgs/floors/D_B2_doors.svg').default,
  }),
  D_B1: () => ({
    data: require('@assets/svgs/floors/D_B1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/D_B1_bg.svg').default,
    Doors: require('@assets/svgs/floors/D_B1_doors.svg').default,
  }),
  E_1: () => ({
    data: require('@assets/svgs/floors/E_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/E_1_doors.svg').default,
  }),
  E_2: () => ({
    data: require('@assets/svgs/floors/E_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/E_2_doors.svg').default,
  }),
  E_3: () => ({
    data: require('@assets/svgs/floors/E_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_3_bg.svg').default,
    Doors: require('@assets/svgs/floors/E_3_doors.svg').default,
  }),
  E_4: () => ({
    data: require('@assets/svgs/floors/E_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_4_bg.svg').default,
    Doors: require('@assets/svgs/floors/E_4_doors.svg').default,
  }),
  E_5: () => ({
    data: require('@assets/svgs/floors/E_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_5_bg.svg').default,
    Doors: require('@assets/svgs/floors/E_5_doors.svg').default,
  }),
  E_6: () => ({
    data: require('@assets/svgs/floors/E_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_6_bg.svg').default,
    Doors: require('@assets/svgs/floors/E_6_doors.svg').default,
  }),
  E_7: () => ({
    data: require('@assets/svgs/floors/E_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_7_bg.svg').default,
    Doors: require('@assets/svgs/floors/E_7_doors.svg').default,
  }),
  E_8: () => ({
    data: require('@assets/svgs/floors/E_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_8_bg.svg').default,
    Doors: require('@assets/svgs/floors/E_8_doors.svg').default,
  }),
  E_9: () => ({
    data: require('@assets/svgs/floors/E_9.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_9_bg.svg').default,
    Doors: require('@assets/svgs/floors/E_9_doors.svg').default,
  }),
  E_10: () => ({
    data: require('@assets/svgs/floors/E_10.json') as FloorMapData,
    Background: require('@assets/svgs/floors/E_10_bg.svg').default,
    Doors: require('@assets/svgs/floors/E_10_doors.svg').default,
  }),
  F_1: () => ({
    data: require('@assets/svgs/floors/F_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/F_1_doors.svg').default,
  }),
  F_2: () => ({
    data: require('@assets/svgs/floors/F_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/F_2_doors.svg').default,
  }),
  F_3: () => ({
    data: require('@assets/svgs/floors/F_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_3_bg.svg').default,
    Doors: require('@assets/svgs/floors/F_3_doors.svg').default,
  }),
  F_4: () => ({
    data: require('@assets/svgs/floors/F_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_4_bg.svg').default,
    Doors: require('@assets/svgs/floors/F_4_doors.svg').default,
  }),
  F_5: () => ({
    data: require('@assets/svgs/floors/F_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_5_bg.svg').default,
    Doors: require('@assets/svgs/floors/F_5_doors.svg').default,
  }),
  F_6: () => ({
    data: require('@assets/svgs/floors/F_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_6_bg.svg').default,
    Doors: require('@assets/svgs/floors/F_6_doors.svg').default,
  }),
  F_7: () => ({
    data: require('@assets/svgs/floors/F_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_7_bg.svg').default,
    Doors: require('@assets/svgs/floors/F_7_doors.svg').default,
  }),
  F_8: () => ({
    data: require('@assets/svgs/floors/F_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/F_8_bg.svg').default,
    Doors: require('@assets/svgs/floors/F_8_doors.svg').default,
  }),
  G_B1: () => ({
    data: require('@assets/svgs/floors/G_B1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/G_B1_bg.svg').default,
    Doors: require('@assets/svgs/floors/G_B1_doors.svg').default,
  }),
  G_1: () => ({
    data: require('@assets/svgs/floors/G_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/G_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/G_1_doors.svg').default,
  }),
  G_2: () => ({
    data: require('@assets/svgs/floors/G_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/G_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/G_2_doors.svg').default,
  }),
  G_3: () => ({
    data: require('@assets/svgs/floors/G_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/G_3_bg.svg').default,
    Doors: require('@assets/svgs/floors/G_3_doors.svg').default,
  }),
  G_4: () => ({
    data: require('@assets/svgs/floors/G_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/G_4_bg.svg').default,
    Doors: require('@assets/svgs/floors/G_4_doors.svg').default,
  }),
  I_1: () => ({
    data: require('@assets/svgs/floors/I_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/I_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/I_1_doors.svg').default,
  }),
  I_2: () => ({
    data: require('@assets/svgs/floors/I_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/I_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/I_2_doors.svg').default,
  }),
  I_3: () => ({
    data: require('@assets/svgs/floors/I_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/I_3_bg.svg').default,
    Doors: require('@assets/svgs/floors/I_3_doors.svg').default,
  }),
  I_4: () => ({
    data: require('@assets/svgs/floors/I_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/I_4_bg.svg').default,
    Doors: require('@assets/svgs/floors/I_4_doors.svg').default,
  }),
  I_5: () => ({
    data: require('@assets/svgs/floors/I_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/I_5_bg.svg').default,
    Doors: require('@assets/svgs/floors/I_5_doors.svg').default,
  }),
  I_6: () => ({
    data: require('@assets/svgs/floors/I_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/I_6_bg.svg').default,
    Doors: require('@assets/svgs/floors/I_6_doors.svg').default,
  }),
  K_B1: () => ({
    data: require('@assets/svgs/floors/K_B1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/K_B1_bg.svg').default,
    Doors: require('@assets/svgs/floors/K_B1_doors.svg').default,
  }),
  K_1: () => ({
    data: require('@assets/svgs/floors/K_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/K_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/K_1_doors.svg').default,
  }),
  K_2: () => ({
    data: require('@assets/svgs/floors/K_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/K_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/K_2_doors.svg').default,
  }),
  K_3: () => ({
    data: require('@assets/svgs/floors/K_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/K_3_bg.svg').default,
    Doors: require('@assets/svgs/floors/K_3_doors.svg').default,
  }),
  K_4: () => ({
    data: require('@assets/svgs/floors/K_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/K_4_bg.svg').default,
    Doors: require('@assets/svgs/floors/K_4_doors.svg').default,
  }),
  K_5: () => ({
    data: require('@assets/svgs/floors/K_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/K_5_bg.svg').default,
    Doors: require('@assets/svgs/floors/K_5_doors.svg').default,
  }),
  K_6: () => ({
    data: require('@assets/svgs/floors/K_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/K_6_bg.svg').default,
    Doors: require('@assets/svgs/floors/K_6_doors.svg').default,
  }),
  L_1: () => ({
    data: require('@assets/svgs/floors/L_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/L_1_doors.svg').default,
  }),
  L_2: () => ({
    data: require('@assets/svgs/floors/L_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/L_2_doors.svg').default,
  }),
  L_3: () => ({
    data: require('@assets/svgs/floors/L_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_3_bg.svg').default,
    Doors: require('@assets/svgs/floors/L_3_doors.svg').default,
  }),
  L_4: () => ({
    data: require('@assets/svgs/floors/L_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_4_bg.svg').default,
    Doors: require('@assets/svgs/floors/L_4_doors.svg').default,
  }),
  L_5: () => ({
    data: require('@assets/svgs/floors/L_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_5_bg.svg').default,
    Doors: require('@assets/svgs/floors/L_5_doors.svg').default,
  }),
  L_6: () => ({
    data: require('@assets/svgs/floors/L_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_6_bg.svg').default,
    Doors: require('@assets/svgs/floors/L_6_doors.svg').default,
  }),
  L_7: () => ({
    data: require('@assets/svgs/floors/L_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_7_bg.svg').default,
    Doors: require('@assets/svgs/floors/L_7_doors.svg').default,
  }),
  L_8: () => ({
    data: require('@assets/svgs/floors/L_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_8_bg.svg').default,
    Doors: require('@assets/svgs/floors/L_8_doors.svg').default,
  }),
  L_9: () => ({
    data: require('@assets/svgs/floors/L_9.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_9_bg.svg').default,
    Doors: require('@assets/svgs/floors/L_9_doors.svg').default,
  }),
  L_10: () => ({
    data: require('@assets/svgs/floors/L_10.json') as FloorMapData,
    Background: require('@assets/svgs/floors/L_10_bg.svg').default,
    Doors: require('@assets/svgs/floors/L_10_doors.svg').default,
  }),
  MH_1: () => ({
    data: require('@assets/svgs/floors/MH_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/MH_1_doors.svg').default,
  }),
  MH_3: () => ({
    data: require('@assets/svgs/floors/MH_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_3_bg.svg').default,
    Doors: require('@assets/svgs/floors/MH_3_doors.svg').default,
  }),
  MH_4: () => ({
    data: require('@assets/svgs/floors/MH_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_4_bg.svg').default,
    Doors: require('@assets/svgs/floors/MH_4_doors.svg').default,
  }),
  MH_5: () => ({
    data: require('@assets/svgs/floors/MH_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_5_bg.svg').default,
    Doors: require('@assets/svgs/floors/MH_5_doors.svg').default,
  }),
  MH_6: () => ({
    data: require('@assets/svgs/floors/MH_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_6_bg.svg').default,
    Doors: require('@assets/svgs/floors/MH_6_doors.svg').default,
  }),
  MH_7: () => ({
    data: require('@assets/svgs/floors/MH_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_7_bg.svg').default,
    Doors: require('@assets/svgs/floors/MH_7_doors.svg').default,
  }),
  MH_8: () => ({
    data: require('@assets/svgs/floors/MH_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_8_bg.svg').default,
    Doors: require('@assets/svgs/floors/MH_8_doors.svg').default,
  }),
  MH_9: () => ({
    data: require('@assets/svgs/floors/MH_9.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_9_bg.svg').default,
    Doors: require('@assets/svgs/floors/MH_9_doors.svg').default,
  }),
  MH_10: () => ({
    data: require('@assets/svgs/floors/MH_10.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_10_bg.svg').default,
    Doors: require('@assets/svgs/floors/MH_10_doors.svg').default,
  }),
  MH_12: () => ({
    data: require('@assets/svgs/floors/MH_12.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_12_bg.svg').default,
    Doors: require('@assets/svgs/floors/MH_12_doors.svg').default,
  }),
  MH_13: () => ({
    data: require('@assets/svgs/floors/MH_13.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_13_bg.svg').default,
    Doors: require('@assets/svgs/floors/MH_13_doors.svg').default,
  }),
  MH_14: () => ({
    data: require('@assets/svgs/floors/MH_14.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_14_bg.svg').default,
    Doors: require('@assets/svgs/floors/MH_14_doors.svg').default,
  }),
  MH_15: () => ({
    data: require('@assets/svgs/floors/MH_15.json') as FloorMapData,
    Background: require('@assets/svgs/floors/MH_15_bg.svg').default,
    Doors: require('@assets/svgs/floors/MH_15_doors.svg').default,
  }),
  P_B2: () => ({
    data: require('@assets/svgs/floors/P_B2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_B2_bg.svg').default,
    Doors: require('@assets/svgs/floors/P_B2_doors.svg').default,
  }),
  P_B1: () => ({
    data: require('@assets/svgs/floors/P_B1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_B1_bg.svg').default,
    Doors: require('@assets/svgs/floors/P_B1_doors.svg').default,
  }),
  P_1: () => ({
    data: require('@assets/svgs/floors/P_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/P_1_doors.svg').default,
  }),
  P_2: () => ({
    data: require('@assets/svgs/floors/P_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/P_2_doors.svg').default,
  }),
  P_3: () => ({
    data: require('@assets/svgs/floors/P_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_3_bg.svg').default,
    Doors: require('@assets/svgs/floors/P_3_doors.svg').default,
  }),
  P_4: () => ({
    data: require('@assets/svgs/floors/P_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_4_bg.svg').default,
    Doors: require('@assets/svgs/floors/P_4_doors.svg').default,
  }),
  P_5: () => ({
    data: require('@assets/svgs/floors/P_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_5_bg.svg').default,
    Doors: require('@assets/svgs/floors/P_5_doors.svg').default,
  }),
  P_6: () => ({
    data: require('@assets/svgs/floors/P_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_6_bg.svg').default,
    Doors: require('@assets/svgs/floors/P_6_doors.svg').default,
  }),
  P_7: () => ({
    data: require('@assets/svgs/floors/P_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_7_bg.svg').default,
    Doors: require('@assets/svgs/floors/P_7_doors.svg').default,
  }),
  P_8: () => ({
    data: require('@assets/svgs/floors/P_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/P_8_bg.svg').default,
    Doors: require('@assets/svgs/floors/P_8_doors.svg').default,
  }),
  Q_1: () => ({
    data: require('@assets/svgs/floors/Q_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/Q_1_doors.svg').default,
  }),
  Q_2: () => ({
    data: require('@assets/svgs/floors/Q_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/Q_2_doors.svg').default,
  }),
  Q_4: () => ({
    data: require('@assets/svgs/floors/Q_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_4_bg.svg').default,
    Doors: require('@assets/svgs/floors/Q_4_doors.svg').default,
  }),
  Q_5: () => ({
    data: require('@assets/svgs/floors/Q_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_5_bg.svg').default,
    Doors: require('@assets/svgs/floors/Q_5_doors.svg').default,
  }),
  Q_6: () => ({
    data: require('@assets/svgs/floors/Q_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_6_bg.svg').default,
    Doors: require('@assets/svgs/floors/Q_6_doors.svg').default,
  }),
  Q_7: () => ({
    data: require('@assets/svgs/floors/Q_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_7_bg.svg').default,
    Doors: require('@assets/svgs/floors/Q_7_doors.svg').default,
  }),
  Q_8: () => ({
    data: require('@assets/svgs/floors/Q_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_8_bg.svg').default,
    Doors: require('@assets/svgs/floors/Q_8_doors.svg').default,
  }),
  Q_9: () => ({
    data: require('@assets/svgs/floors/Q_9.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_9_bg.svg').default,
    Doors: require('@assets/svgs/floors/Q_9_doors.svg').default,
  }),
  Q_10: () => ({
    data: require('@assets/svgs/floors/Q_10.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Q_10_bg.svg').default,
    Doors: require('@assets/svgs/floors/Q_10_doors.svg').default,
  }),
  R_B4: () => ({
    data: require('@assets/svgs/floors/R_B4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_B4_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_B4_doors.svg').default,
  }),
  R_B3: () => ({
    data: require('@assets/svgs/floors/R_B3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_B3_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_B3_doors.svg').default,
  }),
  R_B2: () => ({
    data: require('@assets/svgs/floors/R_B2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_B2_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_B2_doors.svg').default,
  }),
  R_1: () => ({
    data: require('@assets/svgs/floors/R_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_1_doors.svg').default,
  }),
  R_2: () => ({
    data: require('@assets/svgs/floors/R_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_2_doors.svg').default,
  }),
  R_3: () => ({
    data: require('@assets/svgs/floors/R_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_3_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_3_doors.svg').default,
  }),
  R_4: () => ({
    data: require('@assets/svgs/floors/R_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_4_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_4_doors.svg').default,
  }),
  R_5: () => ({
    data: require('@assets/svgs/floors/R_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_5_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_5_doors.svg').default,
  }),
  R_6: () => ({
    data: require('@assets/svgs/floors/R_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_6_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_6_doors.svg').default,
  }),
  R_7: () => ({
    data: require('@assets/svgs/floors/R_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_7_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_7_doors.svg').default,
  }),
  R_8: () => ({
    data: require('@assets/svgs/floors/R_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_8_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_8_doors.svg').default,
  }),
  R_9: () => ({
    data: require('@assets/svgs/floors/R_9.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_9_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_9_doors.svg').default,
  }),
  R_10: () => ({
    data: require('@assets/svgs/floors/R_10.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_10_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_10_doors.svg').default,
  }),
  R_11: () => ({
    data: require('@assets/svgs/floors/R_11.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_11_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_11_doors.svg').default,
  }),
  R_12: () => ({
    data: require('@assets/svgs/floors/R_12.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_12_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_12_doors.svg').default,
  }),
  R_13: () => ({
    data: require('@assets/svgs/floors/R_13.json') as FloorMapData,
    Background: require('@assets/svgs/floors/R_13_bg.svg').default,
    Doors: require('@assets/svgs/floors/R_13_doors.svg').default,
  }),
  T_1: () => ({
    data: require('@assets/svgs/floors/T_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/T_1_doors.svg').default,
  }),
  T_2: () => ({
    data: require('@assets/svgs/floors/T_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/T_2_doors.svg').default,
  }),
  T_3: () => ({
    data: require('@assets/svgs/floors/T_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_3_bg.svg').default,
    Doors: require('@assets/svgs/floors/T_3_doors.svg').default,
  }),
  T_4: () => ({
    data: require('@assets/svgs/floors/T_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_4_bg.svg').default,
    Doors: require('@assets/svgs/floors/T_4_doors.svg').default,
  }),
  T_5: () => ({
    data: require('@assets/svgs/floors/T_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_5_bg.svg').default,
    Doors: require('@assets/svgs/floors/T_5_doors.svg').default,
  }),
  T_6: () => ({
    data: require('@assets/svgs/floors/T_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_6_bg.svg').default,
    Doors: require('@assets/svgs/floors/T_6_doors.svg').default,
  }),
  T_7: () => ({
    data: require('@assets/svgs/floors/T_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_7_bg.svg').default,
    Doors: require('@assets/svgs/floors/T_7_doors.svg').default,
  }),
  T_8: () => ({
    data: require('@assets/svgs/floors/T_8.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_8_bg.svg').default,
    Doors: require('@assets/svgs/floors/T_8_doors.svg').default,
  }),
  T_9: () => ({
    data: require('@assets/svgs/floors/T_9.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_9_bg.svg').default,
    Doors: require('@assets/svgs/floors/T_9_doors.svg').default,
  }),
  T_10: () => ({
    data: require('@assets/svgs/floors/T_10.json') as FloorMapData,
    Background: require('@assets/svgs/floors/T_10_bg.svg').default,
    Doors: require('@assets/svgs/floors/T_10_doors.svg').default,
  }),
  U_B2: () => ({
    data: require('@assets/svgs/floors/U_B2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_B2_bg.svg').default,
    Doors: require('@assets/svgs/floors/U_B2_doors.svg').default,
  }),
  U_B1: () => ({
    data: require('@assets/svgs/floors/U_B1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_B1_bg.svg').default,
    Doors: require('@assets/svgs/floors/U_B1_doors.svg').default,
  }),
  U_1: () => ({
    data: require('@assets/svgs/floors/U_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/U_1_doors.svg').default,
  }),
  U_2: () => ({
    data: require('@assets/svgs/floors/U_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/U_2_doors.svg').default,
  }),
  U_3: () => ({
    data: require('@assets/svgs/floors/U_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_3_bg.svg').default,
    Doors: require('@assets/svgs/floors/U_3_doors.svg').default,
  }),
  U_4: () => ({
    data: require('@assets/svgs/floors/U_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_4_bg.svg').default,
    Doors: require('@assets/svgs/floors/U_4_doors.svg').default,
  }),
  U_5: () => ({
    data: require('@assets/svgs/floors/U_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_5_bg.svg').default,
    Doors: require('@assets/svgs/floors/U_5_doors.svg').default,
  }),
  U_6: () => ({
    data: require('@assets/svgs/floors/U_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_6_bg.svg').default,
    Doors: require('@assets/svgs/floors/U_6_doors.svg').default,
  }),
  U_7: () => ({
    data: require('@assets/svgs/floors/U_7.json') as FloorMapData,
    Background: require('@assets/svgs/floors/U_7_bg.svg').default,
    Doors: require('@assets/svgs/floors/U_7_doors.svg').default,
  }),
  Z1_1: () => ({
    data: require('@assets/svgs/floors/Z1_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z1_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/Z1_1_doors.svg').default,
  }),
  Z1_2: () => ({
    data: require('@assets/svgs/floors/Z1_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z1_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/Z1_2_doors.svg').default,
  }),
  Z2_1: () => ({
    data: require('@assets/svgs/floors/Z2_1.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z2_1_bg.svg').default,
    Doors: require('@assets/svgs/floors/Z2_1_doors.svg').default,
  }),
  Z2_2: () => ({
    data: require('@assets/svgs/floors/Z2_2.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z2_2_bg.svg').default,
    Doors: require('@assets/svgs/floors/Z2_2_doors.svg').default,
  }),
  Z2_3: () => ({
    data: require('@assets/svgs/floors/Z2_3.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z2_3_bg.svg').default,
    Doors: require('@assets/svgs/floors/Z2_3_doors.svg').default,
  }),
  Z2_4: () => ({
    data: require('@assets/svgs/floors/Z2_4.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z2_4_bg.svg').default,
    Doors: require('@assets/svgs/floors/Z2_4_doors.svg').default,
  }),
  Z2_5: () => ({
    data: require('@assets/svgs/floors/Z2_5.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z2_5_bg.svg').default,
    Doors: require('@assets/svgs/floors/Z2_5_doors.svg').default,
  }),
  Z2_6: () => ({
    data: require('@assets/svgs/floors/Z2_6.json') as FloorMapData,
    Background: require('@assets/svgs/floors/Z2_6_bg.svg').default,
    Doors: require('@assets/svgs/floors/Z2_6_doors.svg').default,
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

/**
 * 건물 코드("T동" 또는 "T")의 층 목록을 엘리베이터 버튼처럼 높은 층이 위로 오게 내림차순으로
 * 돌려준다. 평면도가 없는 건물이면 빈 배열.
 */
export function getBuildingFloors(buildingCode: string): FloorInfo[] {
  const building = buildingCode.replace(/동$/, '');
  return Object.keys(FLOOR_MAPS)
    .map(parseFloorId)
    .filter(info => info.building === building)
    .sort((a, b) => b.floorNum - a.floorNum)
    .map(({ floorId, floorNum, label }) => ({ floorId, floorNum, label }));
}
