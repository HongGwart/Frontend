// scripts/renderFloorOverlay.js가 생성하는 파일 — 직접 고치지 말고 스크립트를 다시 돌린다.
import { ImageRequireSource } from 'react-native';
import { Region } from '@mj-studio/react-native-naver-map';
import { FloorGeoAnchors } from '@utils/floorGeoTransform';

export interface FloorOverlayImage {
  /** 건물 기울기만큼 미리 돌려 구운 투명 배경 평면도 PNG */
  image: ImageRequireSource;
  /** PNG를 펴 붙일 남북 정렬 사각형 */
  region: Region;
  /** PNG를 구울 때 쓴 기준점. 지금 기준점과 다르면 PNG가 낡은 것이다 */
  anchors: FloorGeoAnchors;
}

/* DATA {"R_L":{"region":{"latitude":37.55232865271234,"longitude":126.92510553170646,"latitudeDelta":0.0003169625267744891,"longitudeDelta":0.00040799712975884923},"anchors":[{"latitude":37.55247597510666,"longitude":126.92510751647512},{"latitude":37.55264404164161,"longitude":126.92526667568137},{"latitude":37.552498293009144,"longitude":126.9255115440676},{"latitude":37.552330226145536,"longitude":126.9253523848613}]},"R_1":{"region":{"latitude":37.55225188154745,"longitude":126.92502750797075,"latitudeDelta":0.0004741568423440867,"longitudeDelta":0.0005962623338660468},"anchors":[{"latitude":37.552468380072106,"longitude":126.9250304059862},{"latitude":37.55272374067323,"longitude":126.92531398921574},{"latitude":37.5525095402321,"longitude":126.92562087228913},{"latitude":37.55225417889705,"longitude":126.9253372890596}]},"C_1":{"region":{"latitude":37.5490526618288,"longitude":126.9255602253872,"latitudeDelta":0.00020205327923150662,"longitudeDelta":0.0004737130414931113},"anchors":[{"latitude":37.54925148872008,"longitude":126.9255672166575},{"latitude":37.549239913763714,"longitude":126.92603339368918},{"latitude":37.54905622808375,"longitude":126.92602000520071},{"latitude":37.54906712330614,"longitude":126.92556771208444}]},"C_8":{"region":{"latitude":37.54905598161854,"longitude":126.92558995491025,"latitudeDelta":0.0008335794842153632,"longitudeDelta":0.000970202489952609},"anchors":[{"latitude":37.54905898796574,"longitude":126.92653389112388},{"latitude":37.54907536047316,"longitude":126.92559374689802},{"latitude":37.549886554666564,"longitude":126.9256162211866},{"latitude":37.54987018233713,"longitude":126.92655636541247}]}} DATA */
export const FLOOR_OVERLAY_IMAGES: Record<string, FloorOverlayImage> = {
  C_1: {
    image: require('@assets/floorOverlays/C_1.png'),
    region: {"latitude":37.5490526618288,"longitude":126.9255602253872,"latitudeDelta":0.00020205327923150662,"longitudeDelta":0.0004737130414931113},
    anchors: [{"latitude":37.54925148872008,"longitude":126.9255672166575},{"latitude":37.549239913763714,"longitude":126.92603339368918},{"latitude":37.54905622808375,"longitude":126.92602000520071},{"latitude":37.54906712330614,"longitude":126.92556771208444}] as FloorGeoAnchors,
  },
  C_8: {
    image: require('@assets/floorOverlays/C_8.png'),
    region: {"latitude":37.54905598161854,"longitude":126.92558995491025,"latitudeDelta":0.0008335794842153632,"longitudeDelta":0.000970202489952609},
    anchors: [{"latitude":37.54905898796574,"longitude":126.92653389112388},{"latitude":37.54907536047316,"longitude":126.92559374689802},{"latitude":37.549886554666564,"longitude":126.9256162211866},{"latitude":37.54987018233713,"longitude":126.92655636541247}] as FloorGeoAnchors,
  },
  R_1: {
    image: require('@assets/floorOverlays/R_1.png'),
    region: {"latitude":37.55225188154745,"longitude":126.92502750797075,"latitudeDelta":0.0004741568423440867,"longitudeDelta":0.0005962623338660468},
    anchors: [{"latitude":37.552468380072106,"longitude":126.9250304059862},{"latitude":37.55272374067323,"longitude":126.92531398921574},{"latitude":37.5525095402321,"longitude":126.92562087228913},{"latitude":37.55225417889705,"longitude":126.9253372890596}] as FloorGeoAnchors,
  },
  R_L: {
    image: require('@assets/floorOverlays/R_L.png'),
    region: {"latitude":37.55232865271234,"longitude":126.92510553170646,"latitudeDelta":0.0003169625267744891,"longitudeDelta":0.00040799712975884923},
    anchors: [{"latitude":37.55247597510666,"longitude":126.92510751647512},{"latitude":37.55264404164161,"longitude":126.92526667568137},{"latitude":37.552498293009144,"longitude":126.9255115440676},{"latitude":37.552330226145536,"longitude":126.9253523848613}] as FloorGeoAnchors,
  },
};
