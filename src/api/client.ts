import axios, { AxiosRequestConfig } from 'axios';
import { ApiError, toApiError } from './errors';

/**
 * 앱의 모든 서버 요청이 거치는 axios 인스턴스. orval이 생성한 요청 함수(src/api/generated)도 아래 apiRequest를
 * 통해 이 인스턴스를 쓴다(orval.config.ts의 mutator).
 * - baseURL: .env의 EXPO_PUBLIC_API_URL (예: https://dev-api.honggwart.com). 경로는 Swagger 그대로 /api/... 로 붙는다.
 * - 성공 응답은 래핑 없이 본문 그대로라 response.data만 돌려준다.
 * - 실패는 전부 ApiError로 정규화해서 throw한다. 토스트는 여기서 띄우지 않는다(queryClient의 전역 핸들러 담당).
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  // 캠퍼스 지하·건물 안처럼 신호가 약한 곳을 고려해 10초
  timeout: 10_000,
});

api.interceptors.response.use(
  response => {
    if (__DEV__) console.log(`[api] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  error => {
    const apiError = toApiError(error);
    if (__DEV__ && apiError.kind !== 'canceled') {
      console.warn(`[api] ${apiError.kind} ${apiError.status ?? ''} ${error?.config?.url ?? ''} ${apiError.message}`);
    }
    return Promise.reject(apiError);
  },
);

/** orval mutator — 생성된 요청 함수가 호출한다. 응답 본문(T)만 돌려준다. */
export const apiRequest = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> =>
  api.request<T>({ ...config, ...options }).then(response => response.data);

/**
 * orval이 생성 코드의 에러 타입으로 쓴다. 서버 스펙의 에러 본문(ErrorResponse) 대신, 인터셉터가 실제로 throw하는
 * ApiError로 고정한다 — 그래야 useQuery의 error가 실제 값과 같은 타입이 된다.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ErrorType<_ServerError> = ApiError;
