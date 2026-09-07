import type { ApiResponse } from '~/types/api';

/**
 * 약관 동의 현황.
 *
 * 가입할 때 한 번 받고 끝이 아니다. 약관이 개정되면 버전이 올라가고
 * 다시 받아야 하므로, 마이에서 지금 무엇에 동의해 두었는지 볼 수 있어야 한다.
 */
export interface AgreementItem {
  code: string;
  version: string;
  required: boolean;
  agreed: boolean;
  agreedAt: string | null;
}

/** 서버가 들고 있는 약관 한 줄. 화면 목록이 아니라 이쪽이 기준이다. */
export interface Term {
  code: string;
  version: string;
  title: string;
  required: boolean;
  contentUrl: string;
  effectiveFrom: string;
}

export function useAgreementApi() {
  const { $api } = useNuxtApp();

  return {
    async mine() {
      const { data } =
        await $api.get<ApiResponse<{ allRequiredAgreed: boolean; agreements: AgreementItem[] }>>(
          '/api/v1/agreements/me',
        );
      return data.data;
    },

    /** 지금 유효한 약관 목록. 인증이 필요해서 가입 전에는 못 부른다. */
    async list() {
      const { data } = await $api.get<ApiResponse<Term[]>>('/api/v1/terms');
      return data.data;
    },

    async agree(items: { code: string; version: string; agreed: boolean }[]) {
      await $api.post<ApiResponse<unknown>>('/api/v1/agreements', { agreements: items });
    },
  };
}
