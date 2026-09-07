import type { ApiResponse } from '~/types/api';

/**
 * 오픈뱅킹 연결 상태.
 *
 * 연결은 언제든 끊을 수 있고, 끊어도 진단은 돌아간다 — 값의 출처가
 * 자동에서 직접 입력으로 바뀔 뿐이다. 마이의 연결 관리가 그 말을 한다.
 */
const BASE = '/api/v1/open-banking';

export interface OpenBankingConnection {
  connected: boolean;
  scope: string | null;
  accessTokenExpiresAt: string | null;
  lastConnectedAt: string | null;
}

export function useOpenBankingConnectionApi() {
  const { $api } = useNuxtApp();

  return {
    async status() {
      const { data } = await $api.get<ApiResponse<OpenBankingConnection>>(`${BASE}/connection`);
      return data.data;
    },
  };
}
