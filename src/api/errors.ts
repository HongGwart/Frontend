import { isAxiosError } from 'axios';

/** 화면에서 분기하기 위한 실패 종류 */
export type ApiErrorKind = 'network' | 'timeout' | 'canceled' | 'client' | 'server' | 'unknown';

/**
 * 모든 API 실패는 이 형태로 정규화돼서 throw된다. 화면은 kind로 분기하고, 사용자에게는 message를 보여준다.
 * 서버 실패 응답 형식: { error: { code, message } } (Swagger의 ErrorResponse)
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  /** 서버가 준 에러 코드 */
  readonly code?: string;
  /** 서버가 준 사용자용 메시지. 없으면 undefined — 이때는 호출부의 기본 문구를 쓴다. */
  readonly serverMessage?: string;

  constructor(params: { kind: ApiErrorKind; status?: number; code?: string; serverMessage?: string; cause?: unknown }) {
    super(params.serverMessage ?? params.kind, { cause: params.cause });
    this.name = 'ApiError';
    this.kind = params.kind;
    this.status = params.status;
    this.code = params.code;
    this.serverMessage = params.serverMessage;
  }
}

interface ServerErrorBody {
  error?: { code?: string; message?: string };
}

/** axios(또는 그 밖의) 에러를 ApiError로 바꾼다. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!isAxiosError<ServerErrorBody>(error)) return new ApiError({ kind: 'unknown', cause: error });

  if (error.code === 'ERR_CANCELED') return new ApiError({ kind: 'canceled', cause: error });
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return new ApiError({ kind: 'timeout', cause: error });

  const status = error.response?.status;
  if (status === undefined) return new ApiError({ kind: 'network', cause: error });

  const body = error.response?.data?.error;
  return new ApiError({
    kind: status >= 500 ? 'server' : 'client',
    status,
    code: body?.code,
    serverMessage: body?.message,
    cause: error,
  });
}

/** 사용자에게 보여줄 문구. 서버 메시지 > 호출부 기본 문구 > 종류별 기본 문구 순서. */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const apiError = toApiError(error);
  if (apiError.serverMessage) return apiError.serverMessage;
  if (fallback) return fallback;
  switch (apiError.kind) {
    case 'network':
      return '인터넷 연결을 확인해 주세요.';
    case 'timeout':
      return '응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.';
    case 'server':
      return '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
    default:
      return '요청을 처리하지 못했어요.';
  }
}

/** 다시 시도해서 나아질 수 있는 실패인지 (TanStack Query retry 판단용) */
export function isRetryableError(error: unknown): boolean {
  const { kind } = toApiError(error);
  return kind === 'network' || kind === 'timeout' || kind === 'server';
}
