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
