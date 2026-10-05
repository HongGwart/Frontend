import { defineConfig } from 'orval';

/**
 * 백엔드 Swagger(OpenAPI)에서 요청 함수·타입·TanStack Query 훅·zod 스키마를 생성한다.
 *   npm run api:gen
 * 생성물(src/api/generated)은 손으로 고치지 않는다 — 서버 스펙이 바뀌면 다시 생성한다.
 * 관리자 API(/api/admin/**)는 앱에서 안 쓰므로 태그로 걸러 앱용 API만 만든다.
 */
const SPEC_URL = 'http://honggwart.duckdns.org:8081/v3/api-docs';
const APP_TAGS = ['검색', '길찾기'];

export default defineConfig({
  honggwart: {
    input: { target: SPEC_URL, filters: { mode: 'include', tags: APP_TAGS } },
    output: {
      mode: 'split',
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
    input: { target: SPEC_URL, filters: { mode: 'include', tags: APP_TAGS } },
    output: {
      mode: 'single',
      target: 'src/api/generated/honggwart.zod.ts',
      client: 'zod',
    },
  },
});
