import { AppState } from 'react-native';
import * as Network from 'expo-network';
import { focusManager, MutationCache, onlineManager, QueryCache, QueryClient } from '@tanstack/react-query';
import { getErrorMessage, isRetryableError, toApiError } from './errors';
import { showErrorToast } from './errorToast';

/**
 * 쿼리/뮤테이션에 붙이는 meta. 이전 프로젝트의 handleAxiosError({ errorMessage })와 같은 역할.
 *   useQuery({ ..., meta: { errorMessage: '검색에 실패했어요' } })
 * 서버가 메시지를 주면 그걸, 원인을 알 수 있으면(인터넷 끊김·응답 지연·서버 오류) 원인별 문구를, 아니면 errorMessage를
 * 토스트로 띄운다(getErrorMessage).
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

/** 인터넷에 연결돼 있는지. 연결 상태를 모르면(값이 없으면) 연결된 것으로 본다 — 요청을 막아 두지 않게. */
const isOnline = (state: Network.NetworkState) => state.isConnected !== false && state.isInternetReachable !== false;

// 네트워크 연결 상태를 TanStack Query에 알린다(React Native에는 브라우저 online 이벤트가 없어서 직접 연결한다).
// 오프라인이면 요청을 보내지 않고 멈춰(fetchStatus 'paused') 뒀다가, 연결이 돌아오면 멈춘 요청을 이어서 보내고
// refetchOnReconnect인 쿼리를 다시 불러온다. 화면은 멈춘 동안 "인터넷 연결 없음"을 안내한다(useIsOffline).
// 처음 상태 조회보다 연결 변경 이벤트가 먼저 오면, 늦게 도착한 조회 결과(이전 상태)로 되돌리지 않는다.
onlineManager.setEventListener(setOnline => {
  let receivedChange = false;
  Network.getNetworkStateAsync()
    .then(state => {
      if (!receivedChange) setOnline(isOnline(state));
    })
    .catch(() => {});
  const subscription = Network.addNetworkStateListener(state => {
    receivedChange = true;
    setOnline(isOnline(state));
  });
  return () => subscription.remove();
});
