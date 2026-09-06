import { defineStore } from 'pinia';

import { useAuthApi } from '~/api/auth';

import { useAuthStore } from './auth';

/**
 * 가입 절차 중에 모으는 값.
 *
 * 화면이 약관 → 이메일·비밀번호 → 본인 확인 → 완료로 넷이라 어딘가는 값을 들고
 * 있어야 한다. 쿼리스트링에 비밀번호를 실을 수는 없으니 스토어에 둔다.
 * 가입이 끝나면 바로 비운다.
 */
export const useSignupStore = defineStore('signup', {
  state: () => ({
    email: '',
    password: '',
    /** 인증번호 확인에 성공해야 생긴다. 이게 없으면 가입 요청을 보낼 수 없다. */
    verificationToken: '',
    name: '',
    birthDate: '',
    phone: '',
  }),

  getters: {
    /** 이메일 인증을 마쳤는지. 다음 단계로 넘어갈 조건이다. */
    isEmailVerified: (state) => !!state.verificationToken,
  },

  actions: {
    /** 본인 확인까지 마친 뒤 실제 가입을 요청한다. 닉네임은 이름을 그대로 쓴다. */
    async submit() {
      const { signup } = useAuthApi();
      const auth = useAuthStore();

      const response = await signup({
        email: this.email,
        password: this.password,
        nickname: this.name,
        verificationToken: this.verificationToken,
      });

      auth.apply(response);
      this.$reset();
      return response;
    },
  },
});
