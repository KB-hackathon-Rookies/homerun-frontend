import { defineStore } from 'pinia';

import { tokenStorage } from '~/plugins/api';
import type { ApiResponse, AuthTokens } from '~/types/api';

export interface AuthUser {
  memberId: number;
  nickname: string | null;
  email: string | null;
}

/**
 * 로그인 상태.
 *
 * 액세스 토큰만 여기서 관리한다. 리프레시 토큰은 httpOnly 쿠키라 JS 가 손댈 수 없고,
 * 손대지 않는 것이 맞다.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null as string | null,
    user: null as AuthUser | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },

  actions: {
    /**
     * 새로고침 후 브라우저에 남아 있던 토큰을 복구한다.
     *
     * SSR 중에는 `localStorage` 가 없으므로 아무 일도 하지 않는다. 클라이언트에서
     * 한 번 더 불러야 상태가 맞는다.
     */
    restore() {
      this.accessToken = tokenStorage.get();
    },

    async login(email: string, password: string) {
      const { $api } = useNuxtApp();
      // 로그인 실패(401)가 토큰 갱신을 부르지 않도록 막는다.
      const { data } = await $api.post<ApiResponse<AuthTokens>>(
        '/api/v1/auth/login',
        { email, password },
        { skipAuth: true, skipAuthRefresh: true },
      );
      this.setToken(data.data.accessToken);
      await this.fetchMe();
    },

    async fetchMe() {
      const { $api } = useNuxtApp();
      const { data } = await $api.get<ApiResponse<AuthUser>>('/api/v1/auth/me');
      this.user = data.data;
    },

    setToken(token: string) {
      this.accessToken = token;
      tokenStorage.set(token);
    },

    async logout() {
      const { $api } = useNuxtApp();
      try {
        // 서버가 리프레시 쿠키를 만료시켜야 진짜 로그아웃이다.
        await $api.post('/api/v1/auth/logout', null, { skipAuthRefresh: true });
      } finally {
        this.clear();
      }
    },

    clear() {
      this.accessToken = null;
      this.user = null;
      tokenStorage.clear();
    },
  },
});
