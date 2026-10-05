import { AppState } from 'react-native';
import { focusManager, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { getErrorMessage, isRetryableError, toApiError } from './errors';
import { showErrorToast } from './errorToast';

/**
 * 쿼리/뮤테이션에 붙이는 meta. 이전 프로젝트의 handleAxiosError({ errorMessage })와 같은 역할.
 *   useQuery({ ..., meta: { errorMessage: '검색에 실패했어요' } })
 * 서버가 메시지를 주면 그걸, 아니면 errorMessage를, 그것도 없으면 종류별 기본 문구를 토스트로 띄운다.
 */
interface ApiMeta extends Record<string, unknown> {
  errorMessage?: string;
  /** true면 전역 토스트를 띄우지 않는다(화면에서 직접 처리하거나 조용히 실패해도 될 때). */
  silent?: boolean;
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: ApiMeta;
    mutationMeta: ApiMeta;
  }
}

function notify(error: unknown, meta?: ApiMeta) {
  if (meta?.silent || toApiError(error).kind === 'canceled') return;
  showErrorToast(getErrorMessage(error, meta?.errorMessage));
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (error, query) => notify(error, query.meta) }),
  mutationCache: new MutationCache({ onError: (error, _vars, _ctx, mutation) => notify(error, mutation.meta) }),
  defaultOptions: {
    queries: {
      // 네트워크·타임아웃·서버 오류만 최대 2번 다시 시도(잘못된 요청 4xx는 다시 해도 같다)
      retry: (failureCount, error) => isRetryableError(error) && failureCount < 2,
      staleTime: 60_000,
    },
    mutations: { retry: false },
  },
});

// 앱이 백그라운드에서 돌아오면(포그라운드 전환) 오래된 쿼리를 다시 불러온다 — 웹의 창 포커스 대신 AppState.
focusManager.setEventListener(handleFocus => {
  const subscription = AppState.addEventListener('change', status => handleFocus(status === 'active'));
  return () => subscription.remove();
});
