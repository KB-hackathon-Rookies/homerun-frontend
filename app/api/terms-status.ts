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
  };
}
