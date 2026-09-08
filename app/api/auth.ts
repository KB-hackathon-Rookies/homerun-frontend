import type { ApiResponse } from '~/types/api';

/**
 * 인증 API.
 *
 * URL 은 여기에만 둔다. 스토어와 화면은 함수 이름만 안다. 백엔드 경로가 바뀌어도
 * 고칠 곳이 한 군데다.
 *
 * 이메일 계열은 `/api/v1/auth/email` 아래에 따로 모여 있다(`EmailAuthController`).
 * 로그인이 `/api/v1/auth/login` 이 아니라 `/api/v1/auth/email/login` 인 이유다.
 */
const BASE = '/api/v1/auth';
const EMAIL = `${BASE}/email`;
const PHONE = `${BASE}/phone`;

export interface MemberResponse {
  id: number;
  provider: string;
  email: string;
  nickname: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  member: MemberResponse;
}

export interface EmailVerificationResponse {
  verificationToken: string;
  expiresInSeconds: number;
}

/** 로그인·갱신 요청은 401 을 받아도 토큰 갱신을 부르면 안 된다. 무한히 돈다. */
const NO_REFRESH = { skipAuth: true, skipAuthRefresh: true } as const;

export function useAuthApi() {
  const { $api } = useNuxtApp();

  return {
    /** 이메일 로그인. */
    async login(email: string, password: string) {
      const { data } = await $api.post<ApiResponse<LoginResponse>>(
        `${EMAIL}/login`,
        { email, password },
        NO_REFRESH,
      );
      return data.data;
    },

    /** 인증번호 발송. 성공해도 본문이 없다. */
    async sendVerification(email: string) {
      await $api.post<ApiResponse<void>>(`${EMAIL}/verification/send`, { email }, NO_REFRESH);
    },

    /** 인증번호 확인. 여기서 받은 토큰이 있어야 가입할 수 있다. */
    async confirmVerification(email: string, code: string) {
      const { data } = await $api.post<ApiResponse<EmailVerificationResponse>>(
        `${EMAIL}/verification/confirm`,
        { email, code },
        NO_REFRESH,
      );
      return data.data;
    },

    /** 휴대전화 인증번호 발송. 성공해도 본문이 없다. */
    async sendPhoneVerification(phone: string) {
      await $api.post<ApiResponse<void>>(`${PHONE}/verification/send`, { phone }, NO_REFRESH);
    },

    /** 휴대전화 인증번호 확인. 여기서 받은 토큰이 있어야 가입할 수 있다. */
    async confirmPhoneVerification(phone: string, code: string) {
      const { data } = await $api.post<ApiResponse<EmailVerificationResponse>>(
        `${PHONE}/verification/confirm`,
        { phone, code },
        NO_REFRESH,
      );
      return data.data;
    },

    /**
     * 회원가입. 성공하면 곧바로 로그인 상태가 된다.
     *
     * 백엔드(`LocalSignupRequest`)는 이메일·휴대전화 인증 토큰을 모두 요구하고, 생년월일·
     * 휴대전화·지역(regionId)·상세주소까지 한 번에 받아 원자적으로 가입한다.
     */
    async signup(payload: {
      email: string;
      password: string;
      name: string;
      birthDate: string;
      phone: string;
      regionId: number;
      detailAddress?: string;
      emailVerificationToken: string;
      phoneVerificationToken: string;
    }) {
      const { data } = await $api.post<ApiResponse<LoginResponse>>(
        `${EMAIL}/signup`,
        payload,
        NO_REFRESH,
      );
      return data.data;
    },

    /** 현재 로그인한 회원. */
    async me() {
      const { data } = await $api.get<ApiResponse<MemberResponse>>(`${BASE}/me`);
      return data.data;
    },

    /** 로그아웃. 서버가 리프레시 쿠키를 만료시켜야 진짜로 끝난다. */
    async logout() {
      await $api.post(`${BASE}/logout`, null, { skipAuthRefresh: true });
    },
  };
}

/** 소셜 로그인은 백엔드가 302 로 넘겨주므로 브라우저를 통째로 보낸다. */
export function socialLoginUrl(provider: 'kakao' | 'google', apiBase: string) {
  return `${apiBase}${BASE}/${provider}/login`;
}
