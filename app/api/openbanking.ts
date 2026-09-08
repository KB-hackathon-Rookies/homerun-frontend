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

/**
 * 서버가 오픈뱅킹 소득을 계획 입력에 동기화한 결과. 화면에서 쓰는 값만 추렸다.
 *
 * 서버는 최근 3개월 급여가 모두 확인될 때만 월 실수령 추정값을 미확인 상태로
 * 저장한다(`APPLIED`). 계좌 잔액은 순자산·가용현금으로 자동 저장하지 않으므로
 * 여기서는 소득만 다룬다.
 */
export type OpenBankingIncomeSyncStatus =
  | 'APPLIED'
  | 'UNCHANGED'
  | 'NOT_APPLICABLE'
  | 'MANUAL_VALUE_PRESERVED'
  | 'CONFIRMED_VALUE_PRESERVED';

export interface PlanFinancialSync {
  /** 서버가 오픈뱅킹으로 확정해 저장한 월 소득. 확정하지 못하면 `null`. */
  suggestedMonthlyIncome: number | null;
  monthlyIncomeSyncStatus: OpenBankingIncomeSyncStatus;
}

/** 계획 입력 엔드포인트. 오픈뱅킹 동기화·소득 확인은 여기에 붙는다. */
const planInput = (planId: number) => `/api/v1/plans/${planId}/input`;

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

    /**
     * 오픈뱅킹 소득을 계획 입력에 서버에서 동기화한다.
     *
     * 요약 GET 은 입력을 저장하지 않는다. 이 호출이 있어야 서버가 소득 출처를
     * `OPEN_BANKING` 으로 기록하고, 그다음에야 STEP 저장에서 같은 출처가 받아들여진다.
     */
    async syncPlanIncome(planId: number) {
      const { data } = await $api.post<ApiResponse<PlanFinancialSync>>(
        `${planInput(planId)}/open-banking-sync`,
      );
      return data.data;
    },

    /**
     * 서버에 동기화된 오픈뱅킹 소득을 그대로 확인한다.
     *
     * 금액은 서버가 들고 있는 값을 쓰므로 보내지 않는다. 확인 전에는 정책 자격
     * 판정에 쓰지 않는다.
     */
    async confirmPlanIncome(planId: number) {
      await $api.put<ApiResponse<unknown>>(`${planInput(planId)}/financial-income`, {
        action: 'CONFIRM_OPEN_BANKING',
      });
    },
  };
}
