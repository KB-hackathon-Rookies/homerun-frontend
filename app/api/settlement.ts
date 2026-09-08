import type { CollateralMethod, ConsultedProduct } from '~/api/consultation';
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

/** 실행 대출은 정착 계산의 뿌리다. 계획당 1건이라 경로에 식별자가 없다. */
const loanAccount = (planId: number) => `${BASE}/${planId}/loan-account`;

const enrollment = (planId: number) => `${BASE}/${planId}/return-guarantee/enrollment`;

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

/**
 * 대출 상환 방식(DR-20).
 *
 * 전세대출 대부분은 만기일시상환이라 매달 이자만 낸다. 연말정산 소득공제
 * (BR-29)가 이 값으로 갈려서 "모름" 을 따로 둔다 — 창구에서 못 들었으면
 * 원리금균등으로 지어내지 않는다.
 */
export type RepaymentType = 'MATURITY_LUMP_SUM' | 'EQUAL_INSTALLMENT' | 'UNKNOWN';

/**
 * 실행 대출 등록 입력(DR-20). 계획당 1건이라 다시 보내면 덮어쓴다.
 *
 * 상담(2루)에서 들은 조건과 **실제로 실행된 조건은 다를 수 있다**. 그래서
 * 이 값들을 상담에서 가져와 미리 채우되 사용자가 전부 고칠 수 있게 둔다.
 */
export interface LoanAccountPayload {
  product: ConsultedProduct;
  /** 보증 방식. 못 들었거나 해당 없으면 `null`. */
  guarantee: CollateralMethod | null;
  /** 대출 원금(원). 화면은 만 원 단위로 받아 ×10,000 해서 보낸다. */
  principal: number;
  /** 연 금리(퍼센트). 2.2% 는 `2.2` — 금액이 아니라 비율이라 그대로 보낸다. */
  rate: number;
  repaymentType: RepaymentType;
  /** 대출 실행일(YYYY-MM-DD). */
  executedAt: string;
  maturityAt: string | null;
  preferentialUntil: string | null;
  extensionCount: number | null;
}

/** 저장된 실행 대출. 월 이자(원금 × 금리 ÷ 12, BR-28)는 서버가 세 준다. */
export interface LoanAccount extends Omit<LoanAccountPayload, 'extensionCount'> {
  planId: number;
  extensionCount: number;
  /** 월 이자(원). 화면에서 다시 계산하지 않는다. */
  monthlyInterest: number;
}

/**
 * 반환보증 가입 상태 입력(FR-H1-03). 계획당 1건이라 다시 보내면 덮어쓴다.
 */
export interface ReturnGuaranteeEnrollmentPayload {
  enrolled: boolean;
  feePaid: boolean;
  /** 가입일(YYYY-MM-DD). 아직 안 들었으면 `null`. */
  enrolledAt: string | null;
}

export interface ReturnGuaranteeEnrollment extends ReturnGuaranteeEnrollmentPayload {
  /** 보증료 지원(4-2) 신청이 열리는가 = 가입 ∧ 납부. 서버가 판단한다. */
  feeSupportApplicable: boolean;
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

    /**
     * 실행된 대출을 등록한다(계획당 1건, 덮어쓰기).
     *
     * 정착 화면 대부분이 이 한 건에 매달려 있다 — 현금흐름·금리인하요구권·
     * 사후자산심사가 모두 대출이 없으면 404 다.
     */
    async saveLoanAccount(planId: number, payload: LoanAccountPayload) {
      const { data } = await $api.put<ApiResponse<LoanAccount>>(loanAccount(planId), payload);
      return data.data;
    },

    /** 저장된 실행 대출과 월 이자. 등록 전이면 404(`LOAN_ACCOUNT_NOT_FOUND`). */
    async loanAccount(planId: number) {
      const { data } = await $api.get<ApiResponse<LoanAccount>>(loanAccount(planId));
      return data.data;
    },

    /** 반환보증 가입·보증료 납부 사실을 남긴다(계획당 1건, 덮어쓰기). */
    async saveReturnGuaranteeEnrollment(planId: number, payload: ReturnGuaranteeEnrollmentPayload) {
      const { data } = await $api.put<ApiResponse<ReturnGuaranteeEnrollment>>(
        enrollment(planId),
        payload,
      );
      return data.data;
    },

    /** 저장된 반환보증 가입 상태. 기록 전이면 404(`RETURN_GUARANTEE_NOT_FOUND`). */
    async returnGuaranteeEnrollment(planId: number) {
      const { data } = await $api.get<ApiResponse<ReturnGuaranteeEnrollment>>(enrollment(planId));
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
