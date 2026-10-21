/**
 * [개발용] 개발용 지도 모드가 찍은 값을 Metro 개발 서버(scripts/devSaveMiddleware.js)로 보내 프로젝트 JSON에
 * 바로 저장한다. 개발 서버 주소는 지금 번들을 받아온 주소에서 뽑는다. 실패해도 앱은 그대로 두고 로그만 남긴다.
 */
export type DevSaveTarget = 'buildingMasks';

interface DevSaveResponse {
  ok: boolean;
  file?: string;
  error?: string;
  log?: string;
}

export function getDevServerUrl(): string {
  try {
    // RN 내부 모듈이라 타입 없이 require로 꺼낸다 (번들 스크립트 URL → "http://호스트:8081/")
    const getDevServer = require('react-native/Libraries/Core/Devtools/getDevServer').default;
    return getDevServer().url;
  } catch {
    return 'http://localhost:8081/';
  }
}

export async function saveDevJson(target: DevSaveTarget, data: object): Promise<DevSaveResponse | null> {
  if (!__DEV__) return null;
  try {
    const res = await fetch(`${getDevServerUrl()}__dev/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, data }),
    });
    const body: DevSaveResponse | null = await res.json().catch(() => null);
    // 저장 엔드포인트가 없는 개발 서버(metro.config.js 바꾸기 전에 켠 Metro)는 Expo manifest 같은 엉뚱한 응답을 준다.
    if (!body || typeof body.ok !== 'boolean') {
      console.warn('[DEV_SAVE] 개발 서버에 저장 엔드포인트가 없어요 — Metro(expo start)를 껐다 켜세요');
      return null;
    }
    if (!body.ok) console.warn(`[DEV_SAVE] ${target} 저장 실패`, body.error ?? body.log);
    else console.log(`[DEV_SAVE] ${body.file} 저장`);
    return body;
  } catch (error) {
    console.warn(`[DEV_SAVE] ${target} 저장 요청 실패 — Metro를 다시 시작했는지 확인하세요`, error);
    return null;
  }
}
