import type { ApiResponse } from '~/types/api';

/**
 * 홈(4루) 정착 API.
 *
 * 입주 후 현금흐름·연말정산 같은 정착 계산을 백엔드가 맡는다. 지금은 월간
 * 정착 체크인이 쓰는 현금흐름 종합만 감싼다 — 화면에서 값을 지어내지 않고
 * 서버가 센 월 이자·주거비·잔여금을 그대로 받는다.
 */
const BASE = '/api/v1/plans';

const settlement = (planId: number) => `${BASE}/${planId}/settlement`;

/** 월간 지표(BR-28). 계획값이든 실제값이든 같은 공식으로 서버가 센다. */
export interface MonthlyMetrics {
  /** 월 이자(원) = 대출금 × 금리 ÷ 12. */
  monthlyInterest: number;
  /** 월 주거비(원) = 관리비 + 월 이자. */
  housingCost: number;
  /** 월 잔여금(원) = 월 소득 − 주거비 − 생활비. 적자면 음수. */
  remaining: number;
}

/**
 * 현금흐름 종합(FR-H5-03).
 *
 * 저장된 대출·고정지출·소득·생활비로 월간 지표를 센다. **대출이 등록돼 있어야
 * 한다** — 없으면 404(`LOAN_ACCOUNT_NOT_FOUND`)라, 화면은 이걸 에러가 아니라
 * "아직 값이 없음" 으로 다뤄야 한다.
 */
export interface CashFlowSummary {
  /** 대출 원금(원). */
  loanPrincipal: number;
  /** 월 소득(원). 없으면 0. */
  monthlyIncome: number;
  /** 월 관리비(원, 고정지출 MGMT 합계). */
  managementFee: number;
  /** 월 생활비(원). 없으면 0. */
  livingCost: number;
  metrics: MonthlyMetrics;
}

export interface ReturnGuaranteeGuide {
  needed: boolean;
  summary: string;
  timing: string | null;
  channels: string[];
  documents: string[];
  reuseNote: string | null;
}

export interface PostAssetReview {
  applicable: boolean;
  summary: string;
  easyToMiss: string[];
  cautions: string[];
}

export interface RateCutRight {
  applicable: boolean;
  summary: string;
  applyReasons: string[];
  applyChannels: string[];
  alternativeNote: string | null;
}

export interface TaxDeduction {
  annualRepayment: number | null;
  deductionAmount: number | null;
  estimatedRefund: number | null;
  simplifiedRate: boolean;
}

export type ExpenseCategory = 'INTEREST' | 'MGMT' | 'OTHER';

export interface FixedExpense {
  id: number;
  name: string;
  category: ExpenseCategory;
  amount: number;
  dueDay: number | null;
  autopay: boolean;
}

export interface FixedExpenseList {
  items: FixedExpense[];
  monthlyTotal: number;
  delinquencyAlertActive: boolean;
}

export interface SettlementDashboard {
  daysSinceIndependence: number | null;
  items: { code: string; label: string; status: 'DONE' | 'PENDING' | 'UNTRACKED' }[];
  progressPercent: number;
}

export function useSettlementApi() {
  const { $api } = useNuxtApp();

  return {
    /** 정착 지표(월 이자·주거비·잔여금)를 서버 계산으로 읽는다. 대출 미등록이면 404. */
    async cashFlow(planId: number) {
      const { data } = await $api.get<ApiResponse<CashFlowSummary>>(
        `${settlement(planId)}/cash-flow`,
      );
      return data.data;
    },

    async dashboard(planId: number) {
      const { data } = await $api.get<ApiResponse<SettlementDashboard>>(
        `${settlement(planId)}/dashboard`,
      );
      return data.data;
    },

    async monthlyMetrics(
      planId: number,
      request: {
        loanAmount: number;
        annualRatePercent: number;
        managementFee: number;
        monthlyIncome: number;
        livingCost: number;
      },
    ) {
      const { data } = await $api.post<ApiResponse<MonthlyMetrics>>(
        `${settlement(planId)}/monthly-metrics`,
        request,
      );
      return data.data;
    },

    async returnGuarantee(planId: number) {
      const { data } = await $api.get<ApiResponse<ReturnGuaranteeGuide>>(
        `${settlement(planId)}/return-guarantee`,
      );
      return data.data;
    },

    async postAssetReview(planId: number) {
      const { data } = await $api.get<ApiResponse<PostAssetReview>>(
        `${settlement(planId)}/post-asset-review`,
      );
      return data.data;
    },

    async rateCutRight(planId: number) {
      const { data } = await $api.get<ApiResponse<RateCutRight>>(
        `${settlement(planId)}/rate-cut-right`,
      );
      return data.data;
    },

    async taxDeduction(
      planId: number,
      request: {
        loanAmount: number;
        annualRatePercent: number;
        maturityLumpSum: boolean;
        annualRepayment: number | null;
      },
    ) {
      const { data } = await $api.post<ApiResponse<TaxDeduction>>(
        `${settlement(planId)}/tax-deduction`,
        request,
      );
      return data.data;
    },

    async fixedExpenses(planId: number) {
      const { data } = await $api.get<ApiResponse<FixedExpenseList>>(
        `${BASE}/${planId}/fixed-expenses`,
      );
      return data.data;
    },

    async addFixedExpense(
      planId: number,
      request: {
        name: string;
        category: ExpenseCategory;
        amount: number;
        dueDay: number | null;
        autopay: boolean;
      },
    ) {
      const { data } = await $api.post<ApiResponse<FixedExpense>>(
        `${BASE}/${planId}/fixed-expenses`,
        request,
      );
      return data.data;
    },

    async deleteFixedExpense(planId: number, expenseId: number) {
      await $api.delete(`${BASE}/${planId}/fixed-expenses/${expenseId}`);
    },
  };
}
