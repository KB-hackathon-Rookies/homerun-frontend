import { defineStore } from 'pinia';

import { useAuthApi, type MemberResponse } from '~/api/auth';
import { useRequiredTerms } from '~/composables/useRequiredTerms';
import { tokenStorage } from '~/plugins/api';

/**
 * 로그인 상태.
 *
 * 액세스 토큰만 여기서 관리한다. 리프레시 토큰은 httpOnly 쿠키라 JS 가 손댈 수 없고,
 * 손대지 않는 것이 맞다.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null as string | null,
    user: null as MemberResponse | null,
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
      const { login } = useAuthApi();
      // 로그인 응답에 회원 정보까지 들어 있다. /me 를 또 부를 이유가 없다.
      this.apply(await login(email, password));

      /*
       * 동의 기록이 없으면 백엔드가 이후 요청을 전부 403 으로 막는다. 가입할
       * 때 남기지 못한 계정이 있을 수 있어 로그인 때도 확인한다.
       *
       * 여기서 실패해도 로그인 자체는 유지한다. 막히는 건 다음 화면이고,
       * 그때 서버 문구가 뜬다.
       */
      await useRequiredTerms()
        .ensure()
        .catch(() => {});
    },

    async fetchMe() {
      const { me } = useAuthApi();
      this.user = await me();
    },

    /** 로그인·가입 응답을 그대로 상태로 옮긴다. */
    apply(response: { accessToken: string; member: MemberResponse }) {
      this.setToken(response.accessToken);
      this.user = response.member;
    },

    setToken(token: string) {
      this.accessToken = token;
      tokenStorage.set(token);
    },

    async logout() {
      const { logout } = useAuthApi();
      try {
        await logout();
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
