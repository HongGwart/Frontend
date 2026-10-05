import { ImageSourcePropType } from 'react-native';

/**
 * 시설·건물 사진. 지금은 앱에 번들된 더미 JPG(require)이고, 나중에 서버 사진이면 { uri } 그대로 넣으면 된다.
 * 예전엔 Figma에서 내보낸 SVG(안에 PNG를 통째로 담은 12MB짜리)를 컴포넌트로 그렸는데, 카드가 뜰 때마다 그 큰
 * 문자열을 해석해서 느렸다 — 그래서 일반 이미지(Image)로 바꿨다.
 */
export type PhotoSource = ImageSourcePropType;
