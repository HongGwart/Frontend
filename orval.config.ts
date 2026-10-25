import { defineConfig, type InputTransformerFn } from 'orval';

/**
 * 백엔드 Swagger(OpenAPI)에서 요청 함수·타입·TanStack Query 훅·zod 스키마를 생성한다.
 *   npm run api:gen
 * 생성물(src/api/generated)은 손으로 고치지 않는다 — 서버 스펙이 바뀌면 다시 생성한다.
 * 관리자 API(/api/admin/**)는 앱에서 안 쓰므로 태그로 걸러 앱용 API만 만든다. 같은 태그에 관리자 API가 섞여 있는 경우
 * (예: "평면도 기준 꼭짓점"의 저장 API)도 있어서, 아래 transformer로 관리자 경로를 한 번 더 뺀다.
 */
const SPEC_URL = 'https://dev-api.honggwart.com/v3/api-docs';
const APP_TAGS = ['검색', '길찾기', '평면도 기준 꼭짓점', '장소 소개', '편의시설'];

// 서버 operationId가 "get"처럼 뜻이 안 드러나는 경우 생성 함수/훅 이름을 여기서 정한다(경로 → 이름).
const OPERATION_NAMES: Record<string, string> = {
  '/api/layers/{layerId}/floor-plan-corners': 'floorPlanCorners',
  '/api/facilities': 'facilities',
};

const keepAppApis: InputTransformerFn = spec => {
  const paths = Object.fromEntries(
    Object.entries(spec.paths ?? {})
      .filter(([path]) => !path.startsWith('/api/admin/'))
      .map(([path, item]) => {
        const name = OPERATION_NAMES[path];
        if (!name || !item?.get) return [path, item];
        return [path, { ...item, get: { ...item.get, operationId: name } }];
      }),
  );
  return { ...spec, paths };
};
const input = {
  target: SPEC_URL,
  filters: { mode: 'include' as const, tags: APP_TAGS },
  override: { transformer: keepAppApis },
};

export default defineConfig({
  honggwart: {
    input,
    output: {
      mode: 'split',
      // 서버에서 빠진 스키마 파일이 남지 않게 매번 비우고 다시 만든다.
      clean: true,
      target: 'src/api/generated/honggwart.ts',
      schemas: 'src/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        // 모든 요청이 공통 axios 인스턴스(baseURL·에러 정규화)를 거치게 한다.
        mutator: { path: 'src/api/client.ts', name: 'apiRequest' },
        query: { useQuery: true, signal: true },
      },
    },
  },
  honggwartZod: {
    input,
    output: {
      mode: 'single',
      target: 'src/api/generated/honggwart.zod.ts',
      client: 'zod',
    },
  },
});
