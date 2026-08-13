import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import A_1_test_data from '@assets/svgs/floors/A_1_test.json';
import A_1_test_Background from '@assets/svgs/floors/A_1_test_bg.svg';
import A_1_test_Doors from '@assets/svgs/floors/A_1_test_doors.svg';
import A_2_data from '@assets/svgs/floors/A_2.json';
import A_2_Background from '@assets/svgs/floors/A_2_bg.svg';
import A_2_Doors from '@assets/svgs/floors/A_2_doors.svg';
import B_1_data from '@assets/svgs/floors/B_1.json';
import B_1_Background from '@assets/svgs/floors/B_1_bg.svg';
import B_1_Doors from '@assets/svgs/floors/B_1_doors.svg';
import B_2_data from '@assets/svgs/floors/B_2.json';
import B_2_Background from '@assets/svgs/floors/B_2_bg.svg';
import B_2_Doors from '@assets/svgs/floors/B_2_doors.svg';
import B_3_data from '@assets/svgs/floors/B_3.json';
import B_3_Background from '@assets/svgs/floors/B_3_bg.svg';
import B_3_Doors from '@assets/svgs/floors/B_3_doors.svg';
import C_1_data from '@assets/svgs/floors/C_1.json';
import C_1_Background from '@assets/svgs/floors/C_1_bg.svg';
import C_1_Doors from '@assets/svgs/floors/C_1_doors.svg';
import C_2_data from '@assets/svgs/floors/C_2.json';
import C_2_Background from '@assets/svgs/floors/C_2_bg.svg';
import C_2_Doors from '@assets/svgs/floors/C_2_doors.svg';
import C_3_data from '@assets/svgs/floors/C_3.json';
import C_3_Background from '@assets/svgs/floors/C_3_bg.svg';
import C_3_Doors from '@assets/svgs/floors/C_3_doors.svg';
import C_4_data from '@assets/svgs/floors/C_4.json';
import C_4_Background from '@assets/svgs/floors/C_4_bg.svg';
import C_4_Doors from '@assets/svgs/floors/C_4_doors.svg';
import C_5_data from '@assets/svgs/floors/C_5.json';
import C_5_Background from '@assets/svgs/floors/C_5_bg.svg';
import C_5_Doors from '@assets/svgs/floors/C_5_doors.svg';
import C_6_data from '@assets/svgs/floors/C_6.json';
import C_6_Background from '@assets/svgs/floors/C_6_bg.svg';
import C_6_Doors from '@assets/svgs/floors/C_6_doors.svg';
import C_7_data from '@assets/svgs/floors/C_7.json';
import C_7_Background from '@assets/svgs/floors/C_7_bg.svg';
import C_7_Doors from '@assets/svgs/floors/C_7_doors.svg';
import C_8_data from '@assets/svgs/floors/C_8.json';
import C_8_Background from '@assets/svgs/floors/C_8_bg.svg';
import C_8_Doors from '@assets/svgs/floors/C_8_doors.svg';
import C_9_data from '@assets/svgs/floors/C_9.json';
import C_9_Background from '@assets/svgs/floors/C_9_bg.svg';
import C_9_Doors from '@assets/svgs/floors/C_9_doors.svg';

import D_B1_data from '@assets/svgs/floors/D_B1.json';
import D_B1_Background from '@assets/svgs/floors/D_B1_bg.svg';
import D_B1_Doors from '@assets/svgs/floors/D_B1_doors.svg';
import D_B2_data from '@assets/svgs/floors/D_B2.json';
import D_B2_Background from '@assets/svgs/floors/D_B2_bg.svg';
import D_B2_Doors from '@assets/svgs/floors/D_B2_doors.svg';
import D_B3_data from '@assets/svgs/floors/D_B3.json';
import D_B3_Background from '@assets/svgs/floors/D_B3_bg.svg';
import D_B3_Doors from '@assets/svgs/floors/D_B3_doors.svg';
import D_B4_data from '@assets/svgs/floors/D_B4.json';
import D_B4_Background from '@assets/svgs/floors/D_B4_bg.svg';
import D_B4_Doors from '@assets/svgs/floors/D_B4_doors.svg';
import D_B5_data from '@assets/svgs/floors/D_B5.json';
import D_B5_Background from '@assets/svgs/floors/D_B5_bg.svg';
import D_B5_Doors from '@assets/svgs/floors/D_B5_doors.svg';

import E_1_data from '@assets/svgs/floors/E_1.json';
import E_1_Background from '@assets/svgs/floors/E_1_bg.svg';
import E_1_Doors from '@assets/svgs/floors/E_1_doors.svg';
import E_2_data from '@assets/svgs/floors/E_2.json';
import E_2_Background from '@assets/svgs/floors/E_2_bg.svg';
import E_2_Doors from '@assets/svgs/floors/E_2_doors.svg';
import E_3_data from '@assets/svgs/floors/E_3.json';
import E_3_Background from '@assets/svgs/floors/E_3_bg.svg';
import E_3_Doors from '@assets/svgs/floors/E_3_doors.svg';
import E_4_data from '@assets/svgs/floors/E_4.json';
import E_4_Background from '@assets/svgs/floors/E_4_bg.svg';
import E_4_Doors from '@assets/svgs/floors/E_4_doors.svg';
import E_5_data from '@assets/svgs/floors/E_5.json';
import E_5_Background from '@assets/svgs/floors/E_5_bg.svg';
import E_5_Doors from '@assets/svgs/floors/E_5_doors.svg';
import E_6_data from '@assets/svgs/floors/E_6.json';
import E_6_Background from '@assets/svgs/floors/E_6_bg.svg';
import E_6_Doors from '@assets/svgs/floors/E_6_doors.svg';
import E_7_data from '@assets/svgs/floors/E_7.json';
import E_7_Background from '@assets/svgs/floors/E_7_bg.svg';
import E_7_Doors from '@assets/svgs/floors/E_7_doors.svg';
import E_8_data from '@assets/svgs/floors/E_8.json';
import E_8_Background from '@assets/svgs/floors/E_8_bg.svg';
import E_8_Doors from '@assets/svgs/floors/E_8_doors.svg';
import E_9_data from '@assets/svgs/floors/E_9.json';
import E_9_Background from '@assets/svgs/floors/E_9_bg.svg';
import E_9_Doors from '@assets/svgs/floors/E_9_doors.svg';
import E_10_data from '@assets/svgs/floors/E_10.json';
import E_10_Background from '@assets/svgs/floors/E_10_bg.svg';
import E_10_Doors from '@assets/svgs/floors/E_10_doors.svg';

import F_1_data from '@assets/svgs/floors/F_1.json';
import F_1_Background from '@assets/svgs/floors/F_1_bg.svg';
import F_1_Doors from '@assets/svgs/floors/F_1_doors.svg';
import F_2_data from '@assets/svgs/floors/F_2.json';
import F_2_Background from '@assets/svgs/floors/F_2_bg.svg';
import F_2_Doors from '@assets/svgs/floors/F_2_doors.svg';
import F_3_data from '@assets/svgs/floors/F_3.json';
import F_3_Background from '@assets/svgs/floors/F_3_bg.svg';
import F_3_Doors from '@assets/svgs/floors/F_3_doors.svg';
import F_4_data from '@assets/svgs/floors/F_4.json';
import F_4_Background from '@assets/svgs/floors/F_4_bg.svg';
import F_4_Doors from '@assets/svgs/floors/F_4_doors.svg';
import F_5_data from '@assets/svgs/floors/F_5.json';
import F_5_Background from '@assets/svgs/floors/F_5_bg.svg';
import F_5_Doors from '@assets/svgs/floors/F_5_doors.svg';
import F_6_data from '@assets/svgs/floors/F_6.json';
import F_6_Background from '@assets/svgs/floors/F_6_bg.svg';
import F_6_Doors from '@assets/svgs/floors/F_6_doors.svg';
import F_7_data from '@assets/svgs/floors/F_7.json';
import F_7_Background from '@assets/svgs/floors/F_7_bg.svg';
import F_7_Doors from '@assets/svgs/floors/F_7_doors.svg';
import F_8_data from '@assets/svgs/floors/F_8.json';
import F_8_Background from '@assets/svgs/floors/F_8_bg.svg';
import F_8_Doors from '@assets/svgs/floors/F_8_doors.svg';

import G_B1_data from '@assets/svgs/floors/G_B1.json';
import G_B1_Background from '@assets/svgs/floors/G_B1_bg.svg';
import G_B1_Doors from '@assets/svgs/floors/G_B1_doors.svg';
import G_1_data from '@assets/svgs/floors/G_1.json';
import G_1_Background from '@assets/svgs/floors/G_1_bg.svg';
import G_1_Doors from '@assets/svgs/floors/G_1_doors.svg';
import G_2_data from '@assets/svgs/floors/G_2.json';
import G_2_Background from '@assets/svgs/floors/G_2_bg.svg';
import G_2_Doors from '@assets/svgs/floors/G_2_doors.svg';
import G_3_data from '@assets/svgs/floors/G_3.json';
import G_3_Background from '@assets/svgs/floors/G_3_bg.svg';
import G_3_Doors from '@assets/svgs/floors/G_3_doors.svg';
import G_4_data from '@assets/svgs/floors/G_4.json';
import G_4_Background from '@assets/svgs/floors/G_4_bg.svg';
import G_4_Doors from '@assets/svgs/floors/G_4_doors.svg';
import I_1_data from '@assets/svgs/floors/I_1.json';
import I_1_Background from '@assets/svgs/floors/I_1_bg.svg';
import I_1_Doors from '@assets/svgs/floors/I_1_doors.svg';
import I_2_data from '@assets/svgs/floors/I_2.json';
import I_2_Background from '@assets/svgs/floors/I_2_bg.svg';
import I_2_Doors from '@assets/svgs/floors/I_2_doors.svg';
import I_3_data from '@assets/svgs/floors/I_3.json';
import I_3_Background from '@assets/svgs/floors/I_3_bg.svg';
import I_3_Doors from '@assets/svgs/floors/I_3_doors.svg';
import I_4_data from '@assets/svgs/floors/I_4.json';
import I_4_Background from '@assets/svgs/floors/I_4_bg.svg';
import I_4_Doors from '@assets/svgs/floors/I_4_doors.svg';
import I_5_data from '@assets/svgs/floors/I_5.json';
import I_5_Background from '@assets/svgs/floors/I_5_bg.svg';
import I_5_Doors from '@assets/svgs/floors/I_5_doors.svg';
import I_6_data from '@assets/svgs/floors/I_6.json';
import I_6_Background from '@assets/svgs/floors/I_6_bg.svg';
import I_6_Doors from '@assets/svgs/floors/I_6_doors.svg';
import K_B1_data from '@assets/svgs/floors/K_B1.json';
import K_B1_Background from '@assets/svgs/floors/K_B1_bg.svg';
import K_B1_Doors from '@assets/svgs/floors/K_B1_doors.svg';
import K_1_data from '@assets/svgs/floors/K_1.json';
import K_1_Background from '@assets/svgs/floors/K_1_bg.svg';
import K_1_Doors from '@assets/svgs/floors/K_1_doors.svg';
import K_2_data from '@assets/svgs/floors/K_2.json';
import K_2_Background from '@assets/svgs/floors/K_2_bg.svg';
import K_2_Doors from '@assets/svgs/floors/K_2_doors.svg';
import K_3_data from '@assets/svgs/floors/K_3.json';
import K_3_Background from '@assets/svgs/floors/K_3_bg.svg';
import K_3_Doors from '@assets/svgs/floors/K_3_doors.svg';
import K_4_data from '@assets/svgs/floors/K_4.json';
import K_4_Background from '@assets/svgs/floors/K_4_bg.svg';
import K_4_Doors from '@assets/svgs/floors/K_4_doors.svg';
import K_5_data from '@assets/svgs/floors/K_5.json';
import K_5_Background from '@assets/svgs/floors/K_5_bg.svg';
import K_5_Doors from '@assets/svgs/floors/K_5_doors.svg';
import K_6_data from '@assets/svgs/floors/K_6.json';
import K_6_Background from '@assets/svgs/floors/K_6_bg.svg';
import K_6_Doors from '@assets/svgs/floors/K_6_doors.svg';
import L_2_data from '@assets/svgs/floors/L_2.json';
import L_2_Background from '@assets/svgs/floors/L_2_bg.svg';
import L_2_Doors from '@assets/svgs/floors/L_2_doors.svg';
import L_3_data from '@assets/svgs/floors/L_3.json';
import L_3_Background from '@assets/svgs/floors/L_3_bg.svg';
import L_3_Doors from '@assets/svgs/floors/L_3_doors.svg';
import L_4_data from '@assets/svgs/floors/L_4.json';
import L_4_Background from '@assets/svgs/floors/L_4_bg.svg';
import L_4_Doors from '@assets/svgs/floors/L_4_doors.svg';
import L_5_data from '@assets/svgs/floors/L_5.json';
import L_5_Background from '@assets/svgs/floors/L_5_bg.svg';
import L_5_Doors from '@assets/svgs/floors/L_5_doors.svg';
import L_6_data from '@assets/svgs/floors/L_6.json';
import L_6_Background from '@assets/svgs/floors/L_6_bg.svg';
import L_6_Doors from '@assets/svgs/floors/L_6_doors.svg';
import L_7_data from '@assets/svgs/floors/L_7.json';
import L_7_Background from '@assets/svgs/floors/L_7_bg.svg';
import L_7_Doors from '@assets/svgs/floors/L_7_doors.svg';
import L_8_data from '@assets/svgs/floors/L_8.json';
import L_8_Background from '@assets/svgs/floors/L_8_bg.svg';
import L_8_Doors from '@assets/svgs/floors/L_8_doors.svg';
import L_9_data from '@assets/svgs/floors/L_9.json';
import L_9_Background from '@assets/svgs/floors/L_9_bg.svg';
import L_9_Doors from '@assets/svgs/floors/L_9_doors.svg';
import L_10_data from '@assets/svgs/floors/L_10.json';
import L_10_Background from '@assets/svgs/floors/L_10_bg.svg';
import L_10_Doors from '@assets/svgs/floors/L_10_doors.svg';
import MH_1_data from '@assets/svgs/floors/MH_1.json';
import MH_1_Background from '@assets/svgs/floors/MH_1_bg.svg';
import MH_1_Doors from '@assets/svgs/floors/MH_1_doors.svg';
import MH_3_data from '@assets/svgs/floors/MH_3.json';
import MH_3_Background from '@assets/svgs/floors/MH_3_bg.svg';
import MH_3_Doors from '@assets/svgs/floors/MH_3_doors.svg';
import MH_4_data from '@assets/svgs/floors/MH_4.json';
import MH_4_Background from '@assets/svgs/floors/MH_4_bg.svg';
import MH_4_Doors from '@assets/svgs/floors/MH_4_doors.svg';
import MH_5_data from '@assets/svgs/floors/MH_5.json';
import MH_5_Background from '@assets/svgs/floors/MH_5_bg.svg';
import MH_5_Doors from '@assets/svgs/floors/MH_5_doors.svg';
import MH_6_data from '@assets/svgs/floors/MH_6.json';
import MH_6_Background from '@assets/svgs/floors/MH_6_bg.svg';
import MH_6_Doors from '@assets/svgs/floors/MH_6_doors.svg';
import MH_7_data from '@assets/svgs/floors/MH_7.json';
import MH_7_Background from '@assets/svgs/floors/MH_7_bg.svg';
import MH_7_Doors from '@assets/svgs/floors/MH_7_doors.svg';
import MH_8_data from '@assets/svgs/floors/MH_8.json';
import MH_8_Background from '@assets/svgs/floors/MH_8_bg.svg';
import MH_8_Doors from '@assets/svgs/floors/MH_8_doors.svg';
import MH_9_data from '@assets/svgs/floors/MH_9.json';
import MH_9_Background from '@assets/svgs/floors/MH_9_bg.svg';
import MH_9_Doors from '@assets/svgs/floors/MH_9_doors.svg';
import MH_10_data from '@assets/svgs/floors/MH_10.json';
import MH_10_Background from '@assets/svgs/floors/MH_10_bg.svg';
import MH_10_Doors from '@assets/svgs/floors/MH_10_doors.svg';
import MH_12_data from '@assets/svgs/floors/MH_12.json';
import MH_12_Background from '@assets/svgs/floors/MH_12_bg.svg';
import MH_12_Doors from '@assets/svgs/floors/MH_12_doors.svg';
import MH_13_data from '@assets/svgs/floors/MH_13.json';
import MH_13_Background from '@assets/svgs/floors/MH_13_bg.svg';
import MH_13_Doors from '@assets/svgs/floors/MH_13_doors.svg';
import MH_14_data from '@assets/svgs/floors/MH_14.json';
import MH_14_Background from '@assets/svgs/floors/MH_14_bg.svg';
import MH_14_Doors from '@assets/svgs/floors/MH_14_doors.svg';
import MH_15_data from '@assets/svgs/floors/MH_15.json';
import MH_15_Background from '@assets/svgs/floors/MH_15_bg.svg';
import MH_15_Doors from '@assets/svgs/floors/MH_15_doors.svg';
import P_B2_data from '@assets/svgs/floors/P_B2.json';
import P_B2_Background from '@assets/svgs/floors/P_B2_bg.svg';
import P_B2_Doors from '@assets/svgs/floors/P_B2_doors.svg';
import P_B1_data from '@assets/svgs/floors/P_B1.json';
import P_B1_Background from '@assets/svgs/floors/P_B1_bg.svg';
import P_B1_Doors from '@assets/svgs/floors/P_B1_doors.svg';
import P_1_data from '@assets/svgs/floors/P_1.json';
import P_1_Background from '@assets/svgs/floors/P_1_bg.svg';
import P_1_Doors from '@assets/svgs/floors/P_1_doors.svg';
import P_2_data from '@assets/svgs/floors/P_2.json';
import P_2_Background from '@assets/svgs/floors/P_2_bg.svg';
import P_2_Doors from '@assets/svgs/floors/P_2_doors.svg';
import P_3_data from '@assets/svgs/floors/P_3.json';
import P_3_Background from '@assets/svgs/floors/P_3_bg.svg';
import P_3_Doors from '@assets/svgs/floors/P_3_doors.svg';
import P_4_data from '@assets/svgs/floors/P_4.json';
import P_4_Background from '@assets/svgs/floors/P_4_bg.svg';
import P_4_Doors from '@assets/svgs/floors/P_4_doors.svg';
import P_5_data from '@assets/svgs/floors/P_5.json';
import P_5_Background from '@assets/svgs/floors/P_5_bg.svg';
import P_5_Doors from '@assets/svgs/floors/P_5_doors.svg';
import P_6_data from '@assets/svgs/floors/P_6.json';
import P_6_Background from '@assets/svgs/floors/P_6_bg.svg';
import P_6_Doors from '@assets/svgs/floors/P_6_doors.svg';
import P_7_data from '@assets/svgs/floors/P_7.json';
import P_7_Background from '@assets/svgs/floors/P_7_bg.svg';
import P_7_Doors from '@assets/svgs/floors/P_7_doors.svg';
import P_8_data from '@assets/svgs/floors/P_8.json';
import P_8_Background from '@assets/svgs/floors/P_8_bg.svg';
import P_8_Doors from '@assets/svgs/floors/P_8_doors.svg';
import Q_1_data from '@assets/svgs/floors/Q_1.json';
import Q_1_Background from '@assets/svgs/floors/Q_1_bg.svg';
import Q_1_Doors from '@assets/svgs/floors/Q_1_doors.svg';
import Q_2_data from '@assets/svgs/floors/Q_2.json';
import Q_2_Background from '@assets/svgs/floors/Q_2_bg.svg';
import Q_2_Doors from '@assets/svgs/floors/Q_2_doors.svg';
import Q_4_data from '@assets/svgs/floors/Q_4.json';
import Q_4_Background from '@assets/svgs/floors/Q_4_bg.svg';
import Q_4_Doors from '@assets/svgs/floors/Q_4_doors.svg';
import Q_5_data from '@assets/svgs/floors/Q_5.json';
import Q_5_Background from '@assets/svgs/floors/Q_5_bg.svg';
import Q_5_Doors from '@assets/svgs/floors/Q_5_doors.svg';
import Q_6_data from '@assets/svgs/floors/Q_6.json';
import Q_6_Background from '@assets/svgs/floors/Q_6_bg.svg';
import Q_6_Doors from '@assets/svgs/floors/Q_6_doors.svg';
import Q_7_data from '@assets/svgs/floors/Q_7.json';
import Q_7_Background from '@assets/svgs/floors/Q_7_bg.svg';
import Q_7_Doors from '@assets/svgs/floors/Q_7_doors.svg';
import Q_8_data from '@assets/svgs/floors/Q_8.json';
import Q_8_Background from '@assets/svgs/floors/Q_8_bg.svg';
import Q_8_Doors from '@assets/svgs/floors/Q_8_doors.svg';
import Q_9_data from '@assets/svgs/floors/Q_9.json';
import Q_9_Background from '@assets/svgs/floors/Q_9_bg.svg';
import Q_9_Doors from '@assets/svgs/floors/Q_9_doors.svg';
import Q_10_data from '@assets/svgs/floors/Q_10.json';
import Q_10_Background from '@assets/svgs/floors/Q_10_bg.svg';
import Q_10_Doors from '@assets/svgs/floors/Q_10_doors.svg';
import R_B4_data from '@assets/svgs/floors/R_B4.json';
import R_B4_Background from '@assets/svgs/floors/R_B4_bg.svg';
import R_B4_Doors from '@assets/svgs/floors/R_B4_doors.svg';
import R_B3_data from '@assets/svgs/floors/R_B3.json';
import R_B3_Background from '@assets/svgs/floors/R_B3_bg.svg';
import R_B3_Doors from '@assets/svgs/floors/R_B3_doors.svg';
import R_B2_data from '@assets/svgs/floors/R_B2.json';
import R_B2_Background from '@assets/svgs/floors/R_B2_bg.svg';
import R_B2_Doors from '@assets/svgs/floors/R_B2_doors.svg';
import R_1_data from '@assets/svgs/floors/R_1.json';
import R_1_Background from '@assets/svgs/floors/R_1_bg.svg';
import R_1_Doors from '@assets/svgs/floors/R_1_doors.svg';
import R_2_data from '@assets/svgs/floors/R_2.json';
import R_2_Background from '@assets/svgs/floors/R_2_bg.svg';
import R_2_Doors from '@assets/svgs/floors/R_2_doors.svg';
import R_3_data from '@assets/svgs/floors/R_3.json';
import R_3_Background from '@assets/svgs/floors/R_3_bg.svg';
import R_3_Doors from '@assets/svgs/floors/R_3_doors.svg';
import R_4_data from '@assets/svgs/floors/R_4.json';
import R_4_Background from '@assets/svgs/floors/R_4_bg.svg';
import R_4_Doors from '@assets/svgs/floors/R_4_doors.svg';
import R_5_data from '@assets/svgs/floors/R_5.json';
import R_5_Background from '@assets/svgs/floors/R_5_bg.svg';
import R_5_Doors from '@assets/svgs/floors/R_5_doors.svg';
import R_6_data from '@assets/svgs/floors/R_6.json';
import R_6_Background from '@assets/svgs/floors/R_6_bg.svg';
import R_6_Doors from '@assets/svgs/floors/R_6_doors.svg';
import R_7_data from '@assets/svgs/floors/R_7.json';
import R_7_Background from '@assets/svgs/floors/R_7_bg.svg';
import R_7_Doors from '@assets/svgs/floors/R_7_doors.svg';
import R_8_data from '@assets/svgs/floors/R_8.json';
import R_8_Background from '@assets/svgs/floors/R_8_bg.svg';
import R_8_Doors from '@assets/svgs/floors/R_8_doors.svg';
import R_9_data from '@assets/svgs/floors/R_9.json';
import R_9_Background from '@assets/svgs/floors/R_9_bg.svg';
import R_9_Doors from '@assets/svgs/floors/R_9_doors.svg';
import R_10_data from '@assets/svgs/floors/R_10.json';
import R_10_Background from '@assets/svgs/floors/R_10_bg.svg';
import R_10_Doors from '@assets/svgs/floors/R_10_doors.svg';
import R_11_data from '@assets/svgs/floors/R_11.json';
import R_11_Background from '@assets/svgs/floors/R_11_bg.svg';
import R_11_Doors from '@assets/svgs/floors/R_11_doors.svg';
import R_12_data from '@assets/svgs/floors/R_12.json';
import R_12_Background from '@assets/svgs/floors/R_12_bg.svg';
import R_12_Doors from '@assets/svgs/floors/R_12_doors.svg';
import R_13_data from '@assets/svgs/floors/R_13.json';
import R_13_Background from '@assets/svgs/floors/R_13_bg.svg';
import R_13_Doors from '@assets/svgs/floors/R_13_doors.svg';
import T_1_data from '@assets/svgs/floors/T_1.json';
import T_1_Background from '@assets/svgs/floors/T_1_bg.svg';
import T_1_Doors from '@assets/svgs/floors/T_1_doors.svg';
import T_2_data from '@assets/svgs/floors/T_2.json';
import T_2_Background from '@assets/svgs/floors/T_2_bg.svg';
import T_2_Doors from '@assets/svgs/floors/T_2_doors.svg';
import T_3_data from '@assets/svgs/floors/T_3.json';
import T_3_Background from '@assets/svgs/floors/T_3_bg.svg';
import T_3_Doors from '@assets/svgs/floors/T_3_doors.svg';
import T_4_data from '@assets/svgs/floors/T_4.json';
import T_4_Background from '@assets/svgs/floors/T_4_bg.svg';
import T_4_Doors from '@assets/svgs/floors/T_4_doors.svg';
import T_5_data from '@assets/svgs/floors/T_5.json';
import T_5_Background from '@assets/svgs/floors/T_5_bg.svg';
import T_5_Doors from '@assets/svgs/floors/T_5_doors.svg';
import T_6_data from '@assets/svgs/floors/T_6.json';
import T_6_Background from '@assets/svgs/floors/T_6_bg.svg';
import T_6_Doors from '@assets/svgs/floors/T_6_doors.svg';
import T_7_data from '@assets/svgs/floors/T_7.json';
import T_7_Background from '@assets/svgs/floors/T_7_bg.svg';
import T_7_Doors from '@assets/svgs/floors/T_7_doors.svg';
import T_8_data from '@assets/svgs/floors/T_8.json';
import T_8_Background from '@assets/svgs/floors/T_8_bg.svg';
import T_8_Doors from '@assets/svgs/floors/T_8_doors.svg';
import T_9_data from '@assets/svgs/floors/T_9.json';
import T_9_Background from '@assets/svgs/floors/T_9_bg.svg';
import T_9_Doors from '@assets/svgs/floors/T_9_doors.svg';
import T_10_data from '@assets/svgs/floors/T_10.json';
import T_10_Background from '@assets/svgs/floors/T_10_bg.svg';
import T_10_Doors from '@assets/svgs/floors/T_10_doors.svg';
import U_B2_data from '@assets/svgs/floors/U_B2.json';
import U_B2_Background from '@assets/svgs/floors/U_B2_bg.svg';
import U_B2_Doors from '@assets/svgs/floors/U_B2_doors.svg';
import U_B1_data from '@assets/svgs/floors/U_B1.json';
import U_B1_Background from '@assets/svgs/floors/U_B1_bg.svg';
import U_B1_Doors from '@assets/svgs/floors/U_B1_doors.svg';
import U_1_data from '@assets/svgs/floors/U_1.json';
import U_1_Background from '@assets/svgs/floors/U_1_bg.svg';
import U_1_Doors from '@assets/svgs/floors/U_1_doors.svg';
import U_2_data from '@assets/svgs/floors/U_2.json';
import U_2_Background from '@assets/svgs/floors/U_2_bg.svg';
import U_2_Doors from '@assets/svgs/floors/U_2_doors.svg';
import U_3_data from '@assets/svgs/floors/U_3.json';
import U_3_Background from '@assets/svgs/floors/U_3_bg.svg';
import U_3_Doors from '@assets/svgs/floors/U_3_doors.svg';
import U_4_data from '@assets/svgs/floors/U_4.json';
import U_4_Background from '@assets/svgs/floors/U_4_bg.svg';
import U_4_Doors from '@assets/svgs/floors/U_4_doors.svg';
import U_5_data from '@assets/svgs/floors/U_5.json';
import U_5_Background from '@assets/svgs/floors/U_5_bg.svg';
import U_5_Doors from '@assets/svgs/floors/U_5_doors.svg';
import U_6_data from '@assets/svgs/floors/U_6.json';
import U_6_Background from '@assets/svgs/floors/U_6_bg.svg';
import U_6_Doors from '@assets/svgs/floors/U_6_doors.svg';
import U_7_data from '@assets/svgs/floors/U_7.json';
import U_7_Background from '@assets/svgs/floors/U_7_bg.svg';
import U_7_Doors from '@assets/svgs/floors/U_7_doors.svg';
import Z1_1_data from '@assets/svgs/floors/Z1_1.json';
import Z1_1_Background from '@assets/svgs/floors/Z1_1_bg.svg';
import Z1_1_Doors from '@assets/svgs/floors/Z1_1_doors.svg';
import Z1_2_data from '@assets/svgs/floors/Z1_2.json';
import Z1_2_Background from '@assets/svgs/floors/Z1_2_bg.svg';
import Z1_2_Doors from '@assets/svgs/floors/Z1_2_doors.svg';
import Z2_1_data from '@assets/svgs/floors/Z2_1.json';
import Z2_1_Background from '@assets/svgs/floors/Z2_1_bg.svg';
import Z2_1_Doors from '@assets/svgs/floors/Z2_1_doors.svg';
import Z2_2_data from '@assets/svgs/floors/Z2_2.json';
import Z2_2_Background from '@assets/svgs/floors/Z2_2_bg.svg';
import Z2_2_Doors from '@assets/svgs/floors/Z2_2_doors.svg';
import Z2_3_data from '@assets/svgs/floors/Z2_3.json';
import Z2_3_Background from '@assets/svgs/floors/Z2_3_bg.svg';
import Z2_3_Doors from '@assets/svgs/floors/Z2_3_doors.svg';
import Z2_4_data from '@assets/svgs/floors/Z2_4.json';
import Z2_4_Background from '@assets/svgs/floors/Z2_4_bg.svg';
import Z2_4_Doors from '@assets/svgs/floors/Z2_4_doors.svg';
import Z2_5_data from '@assets/svgs/floors/Z2_5.json';
import Z2_5_Background from '@assets/svgs/floors/Z2_5_bg.svg';
import Z2_5_Doors from '@assets/svgs/floors/Z2_5_doors.svg';
import Z2_6_data from '@assets/svgs/floors/Z2_6.json';
import Z2_6_Background from '@assets/svgs/floors/Z2_6_bg.svg';
import Z2_6_Doors from '@assets/svgs/floors/Z2_6_doors.svg';

import { IndoorMapView } from '@components/map/IndoorMapView';
import { SearchBar } from '@components/common/SearchBar';
import { FloorMapData } from '@appTypes/room';

/**
 * 층 스위처 UI가 정식으로 나오기 전까지, 새로 뽑은 층 데이터를 눈으로 확인해보기 위한
 * 임시 토글. 층이 늘어날 때마다 여기 한 줄씩 추가하면 됨.
 */
const FLOORS: Record<string, { data: FloorMapData; Background: React.ComponentType<any>; Doors: React.ComponentType<any> }> = {
  A_1_test: {
    data: A_1_test_data as FloorMapData,
    Background: A_1_test_Background,
    Doors: A_1_test_Doors,
  },
  A_2: {
    data: A_2_data as FloorMapData,
    Background: A_2_Background,
    Doors: A_2_Doors,
  },
  B_1: {
    data: B_1_data as FloorMapData,
    Background: B_1_Background,
    Doors: B_1_Doors,
  },
  B_2: {
    data: B_2_data as FloorMapData,
    Background: B_2_Background,
    Doors: B_2_Doors,
  },
  B_3: {
    data: B_3_data as FloorMapData,
    Background: B_3_Background,
    Doors: B_3_Doors,
  },
  C_1: {
    data: C_1_data as FloorMapData,
    Background: C_1_Background,
    Doors: C_1_Doors,
  },
  C_2: {
    data: C_2_data as FloorMapData,
    Background: C_2_Background,
    Doors: C_2_Doors,
  },
  C_3: {
    data: C_3_data as FloorMapData,
    Background: C_3_Background,
    Doors: C_3_Doors,
  },
  C_4: {
    data: C_4_data as FloorMapData,
    Background: C_4_Background,
    Doors: C_4_Doors,
  },
  C_5: {
    data: C_5_data as FloorMapData,
    Background: C_5_Background,
    Doors: C_5_Doors,
  },
  C_6: {
    data: C_6_data as FloorMapData,
    Background: C_6_Background,
    Doors: C_6_Doors,
  },
  C_7: {
    data: C_7_data as FloorMapData,
    Background: C_7_Background,
    Doors: C_7_Doors,
  },
  C_8: {
    data: C_8_data as FloorMapData,
    Background: C_8_Background,
    Doors: C_8_Doors,
  },
  C_9: {
    data: C_9_data as FloorMapData,
    Background: C_9_Background,
    Doors: C_9_Doors,
  },
  D_B1: {
    data: D_B1_data as FloorMapData,
    Background: D_B1_Background,
    Doors: D_B1_Doors,
  },
  D_B2: {
    data: D_B2_data as FloorMapData,
    Background: D_B2_Background,
    Doors: D_B2_Doors,
  },
  D_B3: {
    data: D_B3_data as FloorMapData,
    Background: D_B3_Background,
    Doors: D_B3_Doors,
  },
  D_B4: {
    data: D_B4_data as FloorMapData,
    Background: D_B4_Background,
    Doors: D_B4_Doors,
  },
  D_B5: {
    data: D_B5_data as FloorMapData,
    Background: D_B5_Background,
    Doors: D_B5_Doors,
  },
  E_1: {
    data: E_1_data as FloorMapData,
    Background: E_1_Background,
    Doors: E_1_Doors,
  },
  E_2: {
    data: E_2_data as FloorMapData,
    Background: E_2_Background,
    Doors: E_2_Doors,
  },
  E_3: {
    data: E_3_data as FloorMapData,
    Background: E_3_Background,
    Doors: E_3_Doors,
  },
  E_4: {
    data: E_4_data as FloorMapData,
    Background: E_4_Background,
    Doors: E_4_Doors,
  },
  E_5: {
    data: E_5_data as FloorMapData,
    Background: E_5_Background,
    Doors: E_5_Doors,
  },
  E_6: {
    data: E_6_data as FloorMapData,
    Background: E_6_Background,
    Doors: E_6_Doors,
  },
  E_7: {
    data: E_7_data as FloorMapData,
    Background: E_7_Background,
    Doors: E_7_Doors,
  },
  E_8: {
    data: E_8_data as FloorMapData,
    Background: E_8_Background,
    Doors: E_8_Doors,
  },
  E_9: {
    data: E_9_data as FloorMapData,
    Background: E_9_Background,
    Doors: E_9_Doors,
  },
  E_10: {
    data: E_10_data as FloorMapData,
    Background: E_10_Background,
    Doors: E_10_Doors,
  },
  F_1: {
    data: F_1_data as FloorMapData,
    Background: F_1_Background,
    Doors: F_1_Doors,
  },
  F_2: {
    data: F_2_data as FloorMapData,
    Background: F_2_Background,
    Doors: F_2_Doors,
  },
  F_3: {
    data: F_3_data as FloorMapData,
    Background: F_3_Background,
    Doors: F_3_Doors,
  },
  F_4: {
    data: F_4_data as FloorMapData,
    Background: F_4_Background,
    Doors: F_4_Doors,
  },
  F_5: {
    data: F_5_data as FloorMapData,
    Background: F_5_Background,
    Doors: F_5_Doors,
  },
  F_6: {
    data: F_6_data as FloorMapData,
    Background: F_6_Background,
    Doors: F_6_Doors,
  },
  F_7: {
    data: F_7_data as FloorMapData,
    Background: F_7_Background,
    Doors: F_7_Doors,
  },
  F_8: {
    data: F_8_data as FloorMapData,
    Background: F_8_Background,
    Doors: F_8_Doors,
  },
  G_B1: {
    data: G_B1_data as FloorMapData,
    Background: G_B1_Background,
    Doors: G_B1_Doors,
  },
  G_1: {
    data: G_1_data as FloorMapData,
    Background: G_1_Background,
    Doors: G_1_Doors,
  },
  G_2: {
    data: G_2_data as FloorMapData,
    Background: G_2_Background,
    Doors: G_2_Doors,
  },
  G_3: {
    data: G_3_data as FloorMapData,
    Background: G_3_Background,
    Doors: G_3_Doors,
  },
  G_4: {
    data: G_4_data as FloorMapData,
    Background: G_4_Background,
    Doors: G_4_Doors,
  },
  I_1: {
    data: I_1_data as FloorMapData,
    Background: I_1_Background,
    Doors: I_1_Doors,
  },
  I_2: {
    data: I_2_data as FloorMapData,
    Background: I_2_Background,
    Doors: I_2_Doors,
  },
  I_3: {
    data: I_3_data as FloorMapData,
    Background: I_3_Background,
    Doors: I_3_Doors,
  },
  I_4: {
    data: I_4_data as FloorMapData,
    Background: I_4_Background,
    Doors: I_4_Doors,
  },
  I_5: {
    data: I_5_data as FloorMapData,
    Background: I_5_Background,
    Doors: I_5_Doors,
  },
  I_6: {
    data: I_6_data as FloorMapData,
    Background: I_6_Background,
    Doors: I_6_Doors,
  },
  K_B1: {
    data: K_B1_data as FloorMapData,
    Background: K_B1_Background,
    Doors: K_B1_Doors,
  },
  K_1: {
    data: K_1_data as FloorMapData,
    Background: K_1_Background,
    Doors: K_1_Doors,
  },
  K_2: {
    data: K_2_data as FloorMapData,
    Background: K_2_Background,
    Doors: K_2_Doors,
  },
  K_3: {
    data: K_3_data as FloorMapData,
    Background: K_3_Background,
    Doors: K_3_Doors,
  },
  K_4: {
    data: K_4_data as FloorMapData,
    Background: K_4_Background,
    Doors: K_4_Doors,
  },
  K_5: {
    data: K_5_data as FloorMapData,
    Background: K_5_Background,
    Doors: K_5_Doors,
  },
  K_6: {
    data: K_6_data as FloorMapData,
    Background: K_6_Background,
    Doors: K_6_Doors,
  },
  L_2: {
    data: L_2_data as FloorMapData,
    Background: L_2_Background,
    Doors: L_2_Doors,
  },
  L_3: {
    data: L_3_data as FloorMapData,
    Background: L_3_Background,
    Doors: L_3_Doors,
  },
  L_4: {
    data: L_4_data as FloorMapData,
    Background: L_4_Background,
    Doors: L_4_Doors,
  },
  L_5: {
    data: L_5_data as FloorMapData,
    Background: L_5_Background,
    Doors: L_5_Doors,
  },
  L_6: {
    data: L_6_data as FloorMapData,
    Background: L_6_Background,
    Doors: L_6_Doors,
  },
  L_7: {
    data: L_7_data as FloorMapData,
    Background: L_7_Background,
    Doors: L_7_Doors,
  },
  L_8: {
    data: L_8_data as FloorMapData,
    Background: L_8_Background,
    Doors: L_8_Doors,
  },
  L_9: {
    data: L_9_data as FloorMapData,
    Background: L_9_Background,
    Doors: L_9_Doors,
  },
  L_10: {
    data: L_10_data as FloorMapData,
    Background: L_10_Background,
    Doors: L_10_Doors,
  },
  MH_1: {
    data: MH_1_data as FloorMapData,
    Background: MH_1_Background,
    Doors: MH_1_Doors,
  },
  MH_3: {
    data: MH_3_data as FloorMapData,
    Background: MH_3_Background,
    Doors: MH_3_Doors,
  },
  MH_4: {
    data: MH_4_data as FloorMapData,
    Background: MH_4_Background,
    Doors: MH_4_Doors,
  },
  MH_5: {
    data: MH_5_data as FloorMapData,
    Background: MH_5_Background,
    Doors: MH_5_Doors,
  },
  MH_6: {
    data: MH_6_data as FloorMapData,
    Background: MH_6_Background,
    Doors: MH_6_Doors,
  },
  MH_7: {
    data: MH_7_data as FloorMapData,
    Background: MH_7_Background,
    Doors: MH_7_Doors,
  },
  MH_8: {
    data: MH_8_data as FloorMapData,
    Background: MH_8_Background,
    Doors: MH_8_Doors,
  },
  MH_9: {
    data: MH_9_data as FloorMapData,
    Background: MH_9_Background,
    Doors: MH_9_Doors,
  },
  MH_10: {
    data: MH_10_data as FloorMapData,
    Background: MH_10_Background,
    Doors: MH_10_Doors,
  },
  MH_12: {
    data: MH_12_data as FloorMapData,
    Background: MH_12_Background,
    Doors: MH_12_Doors,
  },
  MH_13: {
    data: MH_13_data as FloorMapData,
    Background: MH_13_Background,
    Doors: MH_13_Doors,
  },
  MH_14: {
    data: MH_14_data as FloorMapData,
    Background: MH_14_Background,
    Doors: MH_14_Doors,
  },
  MH_15: {
    data: MH_15_data as FloorMapData,
    Background: MH_15_Background,
    Doors: MH_15_Doors,
  },
  P_B2: {
    data: P_B2_data as FloorMapData,
    Background: P_B2_Background,
    Doors: P_B2_Doors,
  },
  P_B1: {
    data: P_B1_data as FloorMapData,
    Background: P_B1_Background,
    Doors: P_B1_Doors,
  },
  P_1: {
    data: P_1_data as FloorMapData,
    Background: P_1_Background,
    Doors: P_1_Doors,
  },
  P_2: {
    data: P_2_data as FloorMapData,
    Background: P_2_Background,
    Doors: P_2_Doors,
  },
  P_3: {
    data: P_3_data as FloorMapData,
    Background: P_3_Background,
    Doors: P_3_Doors,
  },
  P_4: {
    data: P_4_data as FloorMapData,
    Background: P_4_Background,
    Doors: P_4_Doors,
  },
  P_5: {
    data: P_5_data as FloorMapData,
    Background: P_5_Background,
    Doors: P_5_Doors,
  },
  P_6: {
    data: P_6_data as FloorMapData,
    Background: P_6_Background,
    Doors: P_6_Doors,
  },
  P_7: {
    data: P_7_data as FloorMapData,
    Background: P_7_Background,
    Doors: P_7_Doors,
  },
  P_8: {
    data: P_8_data as FloorMapData,
    Background: P_8_Background,
    Doors: P_8_Doors,
  },
  Q_1: {
    data: Q_1_data as FloorMapData,
    Background: Q_1_Background,
    Doors: Q_1_Doors,
  },
  Q_2: {
    data: Q_2_data as FloorMapData,
    Background: Q_2_Background,
    Doors: Q_2_Doors,
  },
  Q_4: {
    data: Q_4_data as FloorMapData,
    Background: Q_4_Background,
    Doors: Q_4_Doors,
  },
  Q_5: {
    data: Q_5_data as FloorMapData,
    Background: Q_5_Background,
    Doors: Q_5_Doors,
  },
  Q_6: {
    data: Q_6_data as FloorMapData,
    Background: Q_6_Background,
    Doors: Q_6_Doors,
  },
  Q_7: {
    data: Q_7_data as FloorMapData,
    Background: Q_7_Background,
    Doors: Q_7_Doors,
  },
  Q_8: {
    data: Q_8_data as FloorMapData,
    Background: Q_8_Background,
    Doors: Q_8_Doors,
  },
  Q_9: {
    data: Q_9_data as FloorMapData,
    Background: Q_9_Background,
    Doors: Q_9_Doors,
  },
  Q_10: {
    data: Q_10_data as FloorMapData,
    Background: Q_10_Background,
    Doors: Q_10_Doors,
  },
  R_B4: {
    data: R_B4_data as FloorMapData,
    Background: R_B4_Background,
    Doors: R_B4_Doors,
  },
  R_B3: {
    data: R_B3_data as FloorMapData,
    Background: R_B3_Background,
    Doors: R_B3_Doors,
  },
  R_B2: {
    data: R_B2_data as FloorMapData,
    Background: R_B2_Background,
    Doors: R_B2_Doors,
  },
  R_1: {
    data: R_1_data as FloorMapData,
    Background: R_1_Background,
    Doors: R_1_Doors,
  },
  R_2: {
    data: R_2_data as FloorMapData,
    Background: R_2_Background,
    Doors: R_2_Doors,
  },
  R_3: {
    data: R_3_data as FloorMapData,
    Background: R_3_Background,
    Doors: R_3_Doors,
  },
  R_4: {
    data: R_4_data as FloorMapData,
    Background: R_4_Background,
    Doors: R_4_Doors,
  },
  R_5: {
    data: R_5_data as FloorMapData,
    Background: R_5_Background,
    Doors: R_5_Doors,
  },
  R_6: {
    data: R_6_data as FloorMapData,
    Background: R_6_Background,
    Doors: R_6_Doors,
  },
  R_7: {
    data: R_7_data as FloorMapData,
    Background: R_7_Background,
    Doors: R_7_Doors,
  },
  R_8: {
    data: R_8_data as FloorMapData,
    Background: R_8_Background,
    Doors: R_8_Doors,
  },
  R_9: {
    data: R_9_data as FloorMapData,
    Background: R_9_Background,
    Doors: R_9_Doors,
  },
  R_10: {
    data: R_10_data as FloorMapData,
    Background: R_10_Background,
    Doors: R_10_Doors,
  },
  R_11: {
    data: R_11_data as FloorMapData,
    Background: R_11_Background,
    Doors: R_11_Doors,
  },
  R_12: {
    data: R_12_data as FloorMapData,
    Background: R_12_Background,
    Doors: R_12_Doors,
  },
  R_13: {
    data: R_13_data as FloorMapData,
    Background: R_13_Background,
    Doors: R_13_Doors,
  },
  T_1: {
    data: T_1_data as FloorMapData,
    Background: T_1_Background,
    Doors: T_1_Doors,
  },
  T_2: {
    data: T_2_data as FloorMapData,
    Background: T_2_Background,
    Doors: T_2_Doors,
  },
  T_3: {
    data: T_3_data as FloorMapData,
    Background: T_3_Background,
    Doors: T_3_Doors,
  },
  T_4: {
    data: T_4_data as FloorMapData,
    Background: T_4_Background,
    Doors: T_4_Doors,
  },
  T_5: {
    data: T_5_data as FloorMapData,
    Background: T_5_Background,
    Doors: T_5_Doors,
  },
  T_6: {
    data: T_6_data as FloorMapData,
    Background: T_6_Background,
    Doors: T_6_Doors,
  },
  T_7: {
    data: T_7_data as FloorMapData,
    Background: T_7_Background,
    Doors: T_7_Doors,
  },
  T_8: {
    data: T_8_data as FloorMapData,
    Background: T_8_Background,
    Doors: T_8_Doors,
  },
  T_9: {
    data: T_9_data as FloorMapData,
    Background: T_9_Background,
    Doors: T_9_Doors,
  },
  T_10: {
    data: T_10_data as FloorMapData,
    Background: T_10_Background,
    Doors: T_10_Doors,
  },
  U_B2: {
    data: U_B2_data as FloorMapData,
    Background: U_B2_Background,
    Doors: U_B2_Doors,
  },
  U_B1: {
    data: U_B1_data as FloorMapData,
    Background: U_B1_Background,
    Doors: U_B1_Doors,
  },
  U_1: {
    data: U_1_data as FloorMapData,
    Background: U_1_Background,
    Doors: U_1_Doors,
  },
  U_2: {
    data: U_2_data as FloorMapData,
    Background: U_2_Background,
    Doors: U_2_Doors,
  },
  U_3: {
    data: U_3_data as FloorMapData,
    Background: U_3_Background,
    Doors: U_3_Doors,
  },
  U_4: {
    data: U_4_data as FloorMapData,
    Background: U_4_Background,
    Doors: U_4_Doors,
  },
  U_5: {
    data: U_5_data as FloorMapData,
    Background: U_5_Background,
    Doors: U_5_Doors,
  },
  U_6: {
    data: U_6_data as FloorMapData,
    Background: U_6_Background,
    Doors: U_6_Doors,
  },
  U_7: {
    data: U_7_data as FloorMapData,
    Background: U_7_Background,
    Doors: U_7_Doors,
  },
  Z1_1: {
    data: Z1_1_data as FloorMapData,
    Background: Z1_1_Background,
    Doors: Z1_1_Doors,
  },
  Z1_2: {
    data: Z1_2_data as FloorMapData,
    Background: Z1_2_Background,
    Doors: Z1_2_Doors,
  },
  Z2_1: {
    data: Z2_1_data as FloorMapData,
    Background: Z2_1_Background,
    Doors: Z2_1_Doors,
  },
  Z2_2: {
    data: Z2_2_data as FloorMapData,
    Background: Z2_2_Background,
    Doors: Z2_2_Doors,
  },
  Z2_3: {
    data: Z2_3_data as FloorMapData,
    Background: Z2_3_Background,
    Doors: Z2_3_Doors,
  },
  Z2_4: {
    data: Z2_4_data as FloorMapData,
    Background: Z2_4_Background,
    Doors: Z2_4_Doors,
  },
  Z2_5: {
    data: Z2_5_data as FloorMapData,
    Background: Z2_5_Background,
    Doors: Z2_5_Doors,
  },
  Z2_6: {
    data: Z2_6_data as FloorMapData,
    Background: Z2_6_Background,
    Doors: Z2_6_Doors,
  },
};

/**
 * "C_2" -> { building: "C", floorNum: 2, label: "2F" }. "A_1_test"처럼 접미사가 붙어도 앞의 건물/층만 읽는다.
 * "D_B1"처럼 지하층은 floorNum을 음수(-1)로 둬서 1F보다 아래로 정렬되게 하고, label은 "B1"로 표시한다.
 */
function parseFloorId(id: string): { building: string; floorNum: number; label: string } {
  // Z1, Z2처럼 건물 이름 자체에 숫자가 들어가는 경우도 있어서(끝의 "_(B)?숫자층"만
  // 층 표시로 떼어내고 나머지를 건물명으로 삼는다) 건물명 부분은 [A-Za-z]+로 제한하지 않는다.
  const m = id.match(/^(.+)_(B)?(\d+)$/);
  if (!m) return { building: id, floorNum: 0, label: id };
  const [, building, basement, num] = m;
  const floorNum = basement ? -Number(num) : Number(num);
  const label = basement ? `B${num}` : `${num}F`;
  return { building, floorNum, label };
}

const FLOOR_IDS = Object.keys(FLOORS);
const BUILDINGS = Array.from(new Set(FLOOR_IDS.map((id) => parseFloorId(id).building))).sort();
/** 건물별 층 목록, 엘리베이터 버튼처럼 높은 층이 위로 오게 내림차순 정렬 */
const FLOORS_BY_BUILDING: Record<string, string[]> = Object.fromEntries(
  BUILDINGS.map((b) => [
    b,
    FLOOR_IDS.filter((id) => parseFloorId(id).building === b).sort(
      (a, c) => parseFloorId(c).floorNum - parseFloorId(a).floorNum
    ),
  ])
);

/** 층 전환 시 슬라이드 이동 거리(px). 위층으로 가면 아래에서, 아래층으로 가면 위에서 들어온다. */
const SLIDE_DISTANCE = 64;
const SLIDE_DURATION = 260;

export default function IndoorMapTestScreen() {
  const [query, setQuery] = useState('');
  const [floorId, setFloorId] = useState<keyof typeof FLOORS>('C_9');

  const building = parseFloorId(floorId).building;
  const floor = FLOORS[floorId];
  const mapData = useMemo(() => floor.data, [floor]);
  const Background = floor.Background;
  const Doors = floor.Doors;

  // 직전 층 번호를 기억해뒀다가, 층이 바뀔 때 위/아래 어느 방향에서 들어올지 결정한다.
  const prevFloorNumRef = useRef(parseFloorId(floorId).floorNum);
  const slideY = useSharedValue(0);

  useEffect(() => {
    const { floorNum } = parseFloorId(floorId);
    const goingUp = floorNum > prevFloorNumRef.current;
    slideY.value = goingUp ? SLIDE_DISTANCE : -SLIDE_DISTANCE;
    slideY.value = withTiming(0, { duration: SLIDE_DURATION, easing: Easing.out(Easing.cubic) });
    prevFloorNumRef.current = floorNum;
  }, [floorId, slideY]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.searchBarWrapper}>
        {/* <SearchBar value={query} onChangeText={setQuery} /> */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.buildingSwitcher}
        >
          {BUILDINGS.map((b) => (
            <Pressable
              key={b}
              onPress={() => setFloorId(FLOORS_BY_BUILDING[b][0])}
              style={[styles.buildingButton, b === building && styles.buildingButtonActive]}
            >
              <Text style={[styles.buildingButtonText, b === building && styles.buildingButtonTextActive]}>
                {b}동
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>

      <Animated.View style={[styles.mapArea, slideStyle]}>
        <IndoorMapView
          key={floorId}
          mapData={mapData}
          renderBackground={({ width, height }) => <Background width={width} height={height} />}
          renderForeground={({ width, height }) => <Doors width={width} height={height} />}
          onRoomSelect={(room) => {
            console.log('selected room:', room?.id, room?.placeId);
          }}
        />
      </Animated.View>

      {/* 엘리베이터 버튼처럼 세로로 쌓은 층 스위처. 위로 갈수록 높은 층.
          층이 많은 건물(R동, T동 등)은 화면 높이를 넘어서 아래쪽 버튼이 안 보이므로
          세로 스크롤 가능하게 감싼다. */}
      <View style={styles.floorSwitcher} pointerEvents="box-none">
        <ScrollView
          style={styles.floorSwitcherScroll}
          contentContainerStyle={styles.floorSwitcherContent}
          showsVerticalScrollIndicator={false}
        >
          {FLOORS_BY_BUILDING[building].map((id) => (
            <Pressable
              key={id}
              onPress={() => setFloorId(id)}
              style={[styles.floorButton, id === floorId && styles.floorButtonActive]}
            >
              <Text style={[styles.floorButtonText, id === floorId && styles.floorButtonTextActive]}>
                {parseFloorId(id).label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBarWrapper: { paddingHorizontal: 16, paddingVertical: 8 },
  mapArea: { flex: 1, overflow: 'hidden' },
  buildingSwitcher: { flexDirection: 'row', gap: 8 },
  buildingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EEE',
  },
  buildingButtonActive: { backgroundColor: '#1D2056' },
  buildingButtonText: { color: '#333', fontWeight: '600' },
  buildingButtonTextActive: { color: '#fff' },
  floorSwitcher: {
    position: 'absolute',
    right: 16,
    top: 80,
    bottom: 80,
    justifyContent: 'center',
  },
  floorSwitcherScroll: { flexGrow: 0 },
  floorSwitcherContent: { gap: 8, paddingVertical: 4 },
  floorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  floorButtonActive: { backgroundColor: '#1D2056' },
  floorButtonText: { color: '#333', fontWeight: '600' },
  floorButtonTextActive: { color: '#fff' },
});
