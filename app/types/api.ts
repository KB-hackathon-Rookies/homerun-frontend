/**
 * 백엔드 공통 응답 봉투.
 *
 * 백엔드가 모든 성공 응답을 이 형태로 감싼다(`global.response.ApiResponse`).
 * 실제 값은 항상 `data` 안에 있다.
 *
 * `.result` 가 아니라 `.data` 다. 잘못 쓰면 `undefined` 가 되고 화면에서는
 * "데이터가 없다"로 보인다.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

/** 실패 응답. `GlobalExceptionHandler` 가 내려주는 형태. */
export interface ApiErrorBody {
  code: string;
  message: string;
  fieldErrors?: { field: string; message: string }[];
}

/** 로그인·토큰 갱신 응답. */
export interface AuthTokens {
  accessToken: string;
}

declare module 'axios' {
  interface AxiosRequestConfig {
    /** 인증이 필요 없는 요청. 액세스 토큰을 붙이지 않는다. */
    skipAuth?: boolean;
    /**
     * 401 을 받아도 토큰 갱신을 시도하지 않는다.
     *
     * 로그인·갱신 요청 자체에 쓴다. 이게 없으면 로그인 실패(401)가
     * 갱신을 부르고, 갱신도 실패해서 무한히 돈다.
     */
    skipAuthRefresh?: boolean;
    /** 내부용 — 갱신 후 재시도한 요청인지. 무한 재시도를 막는다. */
    _retry?: boolean;
  }
}
