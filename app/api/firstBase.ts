import type { ApiResponse } from '~/types/api';

/**
 * 1루 최종 제출 API.
 *
 * 진단 결과 화면으로 넘어가기 전에 이걸 부른다. 서버가 REVIEW 완료·필수 입력·확인
 * 조건을 검사하고, 통과하면 진단을 저장한 뒤 계획을 2루로 넘긴다. 정책 평가 API 만
 * 부르면 이 처리가 실행되지 않아 계획 stage 가 1루에 남는다.
 */
const BASE = '/api/v1/plans';

/** 진단 비용 입력. 화면에서 따로 받지 않으므로 0 으로 보낸다 — 한도·이자는 서버가 정책 판정으로 계산한다. */
export interface FirstBaseCostInput {
  movingCost: number;
  brokerageFee: number;
  guaranteeFee: number;
  stampTax: number;
  emergencyReserve: number;
  monthlyLivingExpense: number;
  /** 생략하면 서버가 최근 오픈뱅킹 스냅샷을 쓴다. */
  monthlyDebtPayment?: number | null;
}

/**
 * COMPLETED 여야 1루가 닫히고 계획이 2루로 넘어간다. NEEDS_CONFIRMATION 은 아직
 * 확인하지 못한 입력이 남았다는 뜻이라(예: 자기자금) 화면을 넘기면 안 된다.
 */
export type FirstBaseCompletionStatus = 'COMPLETED' | 'NEEDS_CONFIRMATION';

export interface FirstBaseCompleteResult {
  status: FirstBaseCompletionStatus;
  replayed: boolean;
  inputRevision: number;
  /** NEEDS_CONFIRMATION 일 때 사용자가 확인해야 하는 입력 항목. */
  confirmationRequiredFields: string[];
}

export function useFirstBaseApi() {
  const { $api } = useNuxtApp();

  return {
    /**
     * 1루를 최종 제출한다.
     *
     * @param expectedRevision REVIEW 저장까지 반영된 최신 plan_input revision
     */
    async complete(
      planId: number,
      expectedRevision: number,
      ruleVersion: string,
      calculation: FirstBaseCostInput,
    ) {
      const { data } = await $api.post<ApiResponse<FirstBaseCompleteResult>>(
        `${BASE}/${planId}/first-base/complete`,
        { expectedRevision, ruleVersion, calculation },
      );
      return data.data;
    },
  };
}
