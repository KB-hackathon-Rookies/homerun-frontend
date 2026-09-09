import axios from 'axios';

import type { ApiErrorBody } from '~/types/api';

/**
 * 요청 실패를 화면에 띄울 한 줄로 바꾼다.
 *
 * 백엔드가 `GlobalExceptionHandler` 에서 사람이 읽을 문구를 이미 만들어 준다.
 * 화면에서 다시 지어내면 실제 원인과 다른 말을 하게 된다. 그래서 서버 문구를
 * 그대로 쓰고, 서버가 아무 말도 못 한 경우에만 `fallback` 으로 떨어진다.
 */
export function messageFrom(cause: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorBody>(cause)) {
    const body = cause.response?.data;
    return body?.fieldErrors?.[0]?.message || body?.message || fallback;
  }
  return fallback;
}

/**
 * 실패의 HTTP 상태 코드. 화면이 상태별로 다르게 대응해야 할 때 쓴다(예: 남의
 * 리소스라 403·404 면 에러 대신 없는 셈 친다). axios 에러가 아니거나 응답이
 * 오기 전에 끊겼으면 `null`.
 */
export function statusFrom(cause: unknown): number | null {
  return axios.isAxiosError(cause) ? (cause.response?.status ?? null) : null;
}

/**
 * 실패의 서버 오류 코드(`ApiErrorBody.code`).
 *
 * 같은 상태 코드가 서로 다른 일을 뜻할 때 쓴다. 403 은 대개 남의 리소스지만
 * 필수 약관 미동의(`TERMS_005`)도 403 으로 온다 — 상태만 보고 "남의 것" 으로
 * 처리하면 내 것을 남의 것으로 지우게 된다.
 */
export function codeFrom(cause: unknown): string | null {
  return axios.isAxiosError<ApiErrorBody>(cause) ? (cause.response?.data?.code ?? null) : null;
}
