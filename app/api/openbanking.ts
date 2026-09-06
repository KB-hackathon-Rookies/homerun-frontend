import type { ApiResponse } from '~/types/api';

/**
 * 오픈뱅킹 API.
 *
 * 연동은 금융결제원 인가 페이지를 거친다. 우리가 하는 일은 셋이다.
 * 인가 URL 을 받아 사용자를 보내고, 돌아왔는지 `connection` 으로 확인하고,
 * 확인되면 `financial-summary` 로 자산·소득을 가져온다.
 */
const BASE = '/api/v1/open-banking';

export interface OpenBankingConnection {
  connected: boolean;
  scope: string | null;
  accessTokenExpiresAt: string | null;
  lastConnectedAt: string | null;
}

/** 화면에서 실제로 쓰는 값만 추렸다. 응답에는 이보다 많은 필드가 있다. */
export interface FinancialSummary {
  connectedAccountCount: number;
  totalAccountBalance: number | null;
  averageMonthlyNetIncome: number | null;
  salaryDetectedMonths: number;
  incomplete: boolean;
}

export function useOpenBankingApi() {
  const { $api } = useNuxtApp();

  return {
    /** 인가 URL 을 받는다. 이 주소를 열어야 계좌 등록·동의가 시작된다. */
    async connect() {
      const { data } = await $api.get<ApiResponse<{ authorizationUrl: string }>>(
        `${BASE}/connect`,
      );
      return data.data.authorizationUrl;
    },

    /** 연결됐는지 확인한다. 인가 페이지에서 돌아왔는지 알 방법이 이것뿐이다. */
    async connection() {
      const { data } = await $api.get<ApiResponse<OpenBankingConnection>>(`${BASE}/connection`);
      return data.data;
    },

    /** 자산·소득 요약. 대출 상세가 없으면 `incomplete` 가 참이다. */
    async financialSummary() {
      const { data } = await $api.get<ApiResponse<FinancialSummary>>(`${BASE}/financial-summary`);
      return data.data;
    },
  };
}
