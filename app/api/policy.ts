import type { ApiResponse } from '~/types/api';

/**
 * 전세대출 정책 판정 API.
 *
 * 1루 결과 두 화면(매칭 확인 · 내 스펙)이 이 한 번의 판정으로 그려진다.
 * 판정은 사람 조건만 본 **예상** 결과다 — 대출 승인이 아니다. 집을 고른 뒤에
 * `propertyId` 를 붙여 다시 판정하면 집 조건까지 본다.
 */
const BASE = '/api/v1/plans';

export type PolicyVerdict = 'PASS' | 'NEED_INFO' | 'FAIL';

/** 조건 하나의 판정 근거. 화면의 체크리스트 한 줄이 이것이다. */
export interface ConditionBasis {
  code: string;
  /** 조건 이름. 그대로 화면에 쓴다. */
  label: string;
  /** 공고가 요구하는 값. */
  requiredText: string | null;
  /** 확인하지 못한 조건은 `null` 이다. 못 봤다는 뜻이지 틀렸다는 뜻이 아니다. */
  isMet: boolean | null;
  factCode: string | null;
  sourceUrl: string | null;
  eligibleUntil: string | null;
  daysRemaining: number | null;
  householdBasisLabel: string | null;
}

/** 금액·금리 규격이 없는 정책이거나 탈락이면 통째로 `null` 이다. */
export interface LoanEstimate {
  recommendedDepositLimit: number | null;
  estimatedLoanAmount: number | null;
  ownFundsRequired: number | null;
  rateMin: number | null;
  rateMax: number | null;
  monthlyInterestMin: number | null;
  monthlyInterestMax: number | null;
}

/** 판정 기록 원본. 정책 코드 순서 그대로다 — 감사 로그 성격이라 정렬하지 않는다. */
export interface PolicyVerdictDetail {
  policyCode: string;
  policyName: string;
  verdict: PolicyVerdict;
  /** 이 판정에 쓴 규칙 버전. 계획의 규칙 버전과 다르면 다시 판정해야 한다. */
  ruleVersion: number | null;
  basis: ConditionBasis[];
  missingFields: string[];
  /** 떨어진 이유. 첫 실패에서 멈추지 않고 전부 모아 온다. */
  rejectionReasons: RejectionReason[];
}

/** 왜 안 되는가. `alternativePolicy*` 가 있으면 대신 볼 상품이 있다는 뜻이다. */
export interface RejectionReason {
  reasonCode: string;
  reasonLabel: string;
  category: string;
  alternativePolicyCode: string | null;
  alternativePolicyName: string | null;
}

/**
 * 화면에 내보낼 카드. 백엔드가 PASS·NEED_INFO 만 골라 예상 혜택·총비용 순으로
 * 정렬해 두고, 은행 상담 안내를 맨 뒤에 붙인다. 화면에서 다시 정렬하지 않는다.
 */
export interface LoanCard {
  code: string;
  name: string;
  type: 'POLICY' | 'CONSULTATION';
  /** 상담 안내에는 판정이 없다. */
  verdict: PolicyVerdict | null;
  estimate: LoanEstimate | null;
  /** 지금 쓸 수 있는 현금. */
  availableCash: number | null;
  /** 자기자금이 얼마나 모자라는가. 모자라지 않으면 0 이다. */
  ownFundsShortfall: number | null;
  notice: string;
}

export interface JeonsePolicyVerdicts {
  planId: number;
  results: PolicyVerdictDetail[];
  evaluatedAt: string;
  cards: LoanCard[];
}

/** 새로 우대금리 대상이 된 조건 하나. `rateBonus` 단위는 %p — 기준금리에서 이만큼 뺀다. */
export interface PreferentialRateChange {
  code: string;
  label: string;
  rateBonus: number;
  requiredText: string | null;
  sourceUrl: string | null;
}

export function usePolicyApi() {
  const { $api } = useNuxtApp();

  return {
    /**
     * 청년·일반 버팀목과 서울시 이자지원을 판정한다.
     *
     * `propertyId` 를 주면 사람 조건 위에 **집 조건까지 얹어** 판정한다. 안 주면
     * 사람 조건만 본 예상 결과다. 1루 결과 화면이 앞, 2루 매물 상세가 뒤를 쓴다.
     */
    async evaluateJeonse(planId: number, propertyId?: number) {
      const { data } = await $api.post<ApiResponse<JeonsePolicyVerdicts>>(
        `${BASE}/${planId}/policies/jeonse/evaluate`,
        undefined,
        propertyId === undefined ? undefined : { params: { propertyId } },
      );
      return data.data;
    },

    /**
     * 담보별 반환보증 가입 가능성을 판정한다.
     *
     * 전세대출 판정과 달리 **집 기준**이다 — 공시가격이 있어야 판정이 나오므로
     * 매물 번호가 필수다.
     */
    async evaluateReturnGuarantees(planId: number, propertyId: number) {
      const { data } = await $api.post<ApiResponse<JeonsePolicyVerdicts>>(
        `${BASE}/${planId}/policies/jeonse/properties/${propertyId}/return-guarantees/evaluate`,
      );
      return data.data;
    },

    /**
     * 보증료 지원 자격을 판정한다.
     *
     * PASS 가 지원 확정이 아니다. 지자체 예산이 소진되면 자격이 있어도 못 받는다 —
     * 화면에서 그 말을 지우지 않는다.
     */
    async evaluateGuaranteeFeeSupport(planId: number) {
      const { data } = await $api.post<ApiResponse<JeonsePolicyVerdicts>>(
        `${BASE}/${planId}/policies/jeonse/guarantee-fee-support/evaluate`,
      );
      return data.data;
    },

    /** 직전 입력 대비 새로 우대금리 대상이 된 조건. 없으면 빈 배열이다. */
    async preferentialRateChanges(planId: number) {
      const { data } = await $api.get<
        ApiResponse<{ planId: number; changes: PreferentialRateChange[] }>
      >(`${BASE}/${planId}/policies/jeonse/preferential-rate-changes`);
      return data.data.changes;
    },
  };
}
