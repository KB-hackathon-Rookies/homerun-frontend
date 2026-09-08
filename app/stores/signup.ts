import { defineStore } from 'pinia';

import { useAuthApi } from '~/api/auth';
import { useRequiredTerms } from '~/composables/useRequiredTerms';

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
    /** 이메일 인증번호 확인에 성공해야 생긴다. 이게 없으면 가입 요청을 보낼 수 없다. */
    verificationToken: '',
    /** 휴대전화 인증번호 확인에 성공해야 생긴다. 가입 요청에 함께 보낸다. */
    phoneVerificationToken: '',
    name: '',
    birthDate: '',
    phone: '',
    /** 정책 권역(서울·인천·경기·그 외). 백엔드가 regionId 로 받는다. */
    regionId: null as number | null,
    /** 도로명 + 상세주소를 합쳐 둔다. 선택값이다. */
    detailAddress: '',
    /** 약관 화면에서 사용자가 필수를 모두 직접 동의했는가. 코드가 채우지 않는다. */
    requiredTermsAgreed: false,
    /** 약관 화면에서 사용자가 선택 약관에 동의했는가. */
    optionalTermsAgreed: false,
  }),

  getters: {
    /** 이메일 인증을 마쳤는지. 다음 단계로 넘어갈 조건이다. */
    isEmailVerified: (state) => !!state.verificationToken,
    /** 휴대전화 인증을 마쳤는지. 가입 버튼을 열 조건이다. */
    isPhoneVerified: (state) => !!state.phoneVerificationToken,
  },

  actions: {
    /** 본인 확인까지 마친 뒤 실제 가입을 요청한다. 닉네임은 이름을 그대로 쓴다. */
    async submit() {
      const { signup } = useAuthApi();
      const auth = useAuthStore();

      if (this.regionId === null) throw new Error('지역이 선택되지 않았습니다.');

      /*
       * 약관 화면에서 사용자가 필수에 직접 동의하지 않았으면 계정을 만들지
       * 않는다. 자동 동의를 없앤 뒤로는 이 값이 있어야 가입이 성립한다.
       */
      if (!this.requiredTermsAgreed) {
        throw new Error('필수 약관에 동의해야 가입할 수 있어요.');
      }

      const response = await signup({
        email: this.email,
        password: this.password,
        name: this.name,
        birthDate: this.birthDate,
        phone: this.phone,
        regionId: this.regionId,
        detailAddress: this.detailAddress || undefined,
        emailVerificationToken: this.verificationToken,
        phoneVerificationToken: this.phoneVerificationToken,
      });

      auth.apply(response);

      /*
       * 약관 화면에서 사용자가 직접 고른 동의를 여기서 서버에 남긴다. 목록
       * 조회에 인증이 필요해 가입 전에는 부를 수 없어서다. 이걸 빠뜨리면
       * 백엔드가 이후 요청을 전부 403 으로 막는다.
       */
      await useRequiredTerms().ensure({
        requiredAgreed: this.requiredTermsAgreed,
        optionalAgreed: this.optionalTermsAgreed,
      });

      this.$reset();
      return response;
    },
  },
});
