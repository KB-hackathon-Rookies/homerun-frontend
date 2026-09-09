import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import type { ApiErrorBody, ApiResponse, AuthTokens } from '~/types/api';
import { useAuthStore } from '~/stores/auth';
import { REQUIRED_TERMS_CODE, REQUIRED_TERMS_PATH } from '~/utils/requiredTerms';

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
 *
 * ## 403 TERMS_005 는 막힌 게 아니라 할 일이 남은 것이다
 *
 * 백엔드 `RequiredTermsAgreementFilter` 가 필수 약관 동의 기록이 없으면 **모든**
 * 요청을 403 `TERMS_005` 로 끊는다(약관이 개정되면 기존 사용자 전원이 동시에 그렇게
 * 된다). 여기서 안 잡으면 화면마다 제각각 서버 문구 한 줄만 띄우고 끝나서, 동의하러
 * 갈 길이 앱 어디에도 없다. 권한이 없는 게 아니라 아직 안 한 일이 있는 것이므로,
 * 401 을 로그인으로 보내듯 동의 화면으로 보낸다.
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
  // 플러그인 setup 안이라 여기서만 부를 수 있다. 인터셉터 안에서는 이미 늦다.
  const router = useRouter();

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

  /**
   * 갱신이 실패하면 세션을 되살릴 방법이 없다. 정리를 한 곳으로 모은다.
   *
   * 대기 중이던 요청을 한 번에 깨우고(전부 거절), 액세스 토큰을 지우고,
   * 메모리에 남은 로그인 상태까지 비운다. 저장소만 지우고 스토어를 두면
   * 화면은 여전히 로그인한 것처럼 굴어 세션 상태가 어긋난다.
   *
   * 마지막으로 로그인으로 보낸다 — 실패한 모든 요청이 같은 경로를 탄다.
   */
  const endSession = (error: unknown) => {
    flushQueue(error, null);
    tokenStorage.clear();
    if (import.meta.client) {
      useAuthStore().clear();
      navigateTo('/login');
    }
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

  /**
   * 필수 약관 동의 화면으로 보낸다.
   *
   * 되돌이표가 생길 수 없는 이유가 셋이다.
   *
   * 1. 동의 화면이 부르는 `/terms` · `/agreements/me` · `/agreements` 는 백엔드 필터의
   *    예외 경로라 `TERMS_005` 를 낼 수 없다.
   * 2. 그래도 이미 그 화면에 서 있으면 아무 데도 보내지 않는다. 여기서 또 보내면
   *    돌아갈 곳(`redirect`)이 자기 자신이 되어 동의해도 제자리에 남는다.
   * 3. 돌아갈 곳은 화면 쪽에서 다시 검사한다.
   *
   * 라우터는 플러그인이 세워질 때 잡아 둔다. 이 함수는 요청이 실패한 뒤에 도는
   * 비동기 콜백이라 그 시점에는 Nuxt 컨텍스트가 없어 `useRouter()` 를 부를 수 없다.
   */
  const sendToRequiredTerms = () => {
    if (!import.meta.client) return;
    const current = router.currentRoute.value;
    if (current.path === REQUIRED_TERMS_PATH) return;
    router.push({ path: REQUIRED_TERMS_PATH, query: { redirect: current.fullPath } });
  };

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorBody>) => {
      const original = error.config;

      // 약관은 갱신할 것이 없다. 화면을 옮기고, 부른 쪽은 실패로 받는다 — 실패를
      // 삼켜 버리면 화면이 빈 채로 남는데 그새 이동이 끝나 있어야 한다.
      if (error.response?.status === 403 && error.response.data?.code === REQUIRED_TERMS_CODE) {
        sendToRequiredTerms();
        return Promise.reject(error);
      }

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
        // 갱신까지 실패하면 되돌릴 방법이 없다. 대기 요청·토큰·로그인 상태를 한 경로로 정리한다.
        endSession(refreshError);
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
