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

export function useSettlementApi() {
  const { $api } = useNuxtApp();

  return {
    /** 정착 지표(월 이자·주거비·잔여금)를 서버 계산으로 읽는다. 대출 미등록이면 404. */
    async cashFlow(planId: number) {
      const { data } = await $api.get<ApiResponse<CashFlowSummary>>(`${settlement(planId)}/cash-flow`);
      return data.data;
    },
  };
}
