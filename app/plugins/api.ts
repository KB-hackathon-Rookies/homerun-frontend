import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import type { ApiResponse, AuthTokens } from '~/types/api';

/**
 * 백엔드와 통신하는 유일한 통로.
 *
 * 화면이나 스토어가 `axios` 를 직접 만들지 않는다. 인증 처리가 갈라지면
 * 어떤 요청은 토큰이 붙고 어떤 요청은 안 붙는 상태가 된다.
 *
 * ## 리프레시 토큰은 쿠키다
 *
 * 백엔드가 `refresh_token` 을 httpOnly 쿠키로 내려준다. JS 가 읽을 수 없으므로
 * `withCredentials` 로 브라우저가 알아서 싣게 한다. 액세스 토큰만 우리가 들고 있다.
 *
 * ## 401 을 한 번만 갱신한다
 *
 * 화면 하나가 API 를 여러 개 동시에 부르면 만료된 토큰으로 401 이 여러 개 온다.
 * 각자 갱신을 시도하면 갱신 요청이 그만큼 나가고, 백엔드가 리프레시 토큰을
 * 한 번 쓰면 폐기하는 구조라 뒤따르는 갱신이 전부 실패한다.
 *
 * 그래서 첫 번째만 갱신하고 나머지는 큐에서 기다린다.
 */

const ACCESS_TOKEN_KEY = 'accessToken';

/** 액세스 토큰은 브라우저에만 둔다. SSR 중에는 없는 것으로 본다. */
export const tokenStorage = {
  get(): string | null {
    if (!import.meta.client) return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  set(token: string) {
    if (!import.meta.client) return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  clear() {
    if (!import.meta.client) return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};

type QueueEntry = {
  resolve: (token: string) => void;
  reject: (reason: unknown) => void;
};

function createApi(baseURL: string): AxiosInstance {
  const api = axios.create({
    baseURL,
    // 리프레시 쿠키를 싣기 위해 필요하다. 백엔드도 allowCredentials 로 열려 있다.
    withCredentials: true,
  });

  let isRefreshing = false;
  let queue: QueueEntry[] = [];

  const flushQueue = (error: unknown, token: string | null) => {
    queue.forEach(({ resolve, reject }) => {
      if (token) resolve(token);
      else reject(error);
    });
    queue = [];
  };

  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (config.skipAuth) {
      config.headers.delete?.('Authorization');
      return config;
    }
    const token = tokenStorage.get();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.delete?.('Authorization');
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config;
      const isAuthFailure = error.response?.status === 401;

      if (!original || !isAuthFailure || original._retry || original.skipAuthRefresh) {
        return Promise.reject(error);
      }

      original._retry = true;

      // 이미 누가 갱신 중이면 그 결과를 기다린다.
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.set('Authorization', `Bearer ${token}`);
          return api(original);
        });
      }

      isRefreshing = true;
      try {
        // 리프레시 토큰은 쿠키라 본문에 실을 것이 없다. 갱신 자체는 재시도하지 않는다.
        const { data } = await api.post<ApiResponse<AuthTokens>>('/api/v1/auth/refresh', null, {
          skipAuth: true,
          skipAuthRefresh: true,
        });

        const accessToken = data.data.accessToken;
        tokenStorage.set(accessToken);
        flushQueue(null, accessToken);

        original.headers.set('Authorization', `Bearer ${accessToken}`);
        return api(original);
      } catch (refreshError) {
        // 갱신까지 실패하면 되돌릴 방법이 없다. 토큰을 지우고 기다리던 요청을 모두 깨운다.
        flushQueue(refreshError, null);
        tokenStorage.clear();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );

  return api;
}

export default defineNuxtPlugin(() => {
  const { apiBase } = useRuntimeConfig().public;
  return {
    provide: { api: createApi(apiBase) },
  };
});
