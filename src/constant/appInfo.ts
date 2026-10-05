// 마이페이지 "서비스 정보" 섹션에 쓰는 앱 정보.

/**
 * 개인정보처리방침 페이지 주소(노션 "웹에 게시" 링크). 스토어 심사에 제출한 URL과 같은 값이어야 한다.
 * TODO: 노션에 게시한 뒤 실제 주소로 바꾼다.
 */
export const PRIVACY_POLICY_URL = 'https://www.notion.so/';

/** 사용자에게 보이는 앱 버전. app.json의 expo.version을 그대로 쓴다(스토어 버전과 같음). */
export const APP_VERSION: string = require('../../app.json').expo.version;
