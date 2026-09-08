import type { ApiResponse } from '~/types/api';

/**
 * 1루 최종 제출 API.
 *
 * 진단 결과 화면으로 넘어가기 전에 이걸 부른다. 서버가 REVIEW 완료·필수 입력·확인
 * 조건을 검사하고, 통과하면 진단을 저장한 뒤 계획을 2루로 넘긴다. 정책 평가 API 만
 * 부르면 이 처리가 실행되지 않아 계획 stage 가 1루에 남는다.
 */
const BASE = '/api/v1/plans';

/**
 * 진단 비용 입력. **모르는 항목은 보내지 않는다.**
 *
 * 전에는 전부 0 으로 보냈다. 0 은 "확인해서 0원" 이라는 뜻이라 그대로 계산에 들어갔고,
 * 초기 필요자금에서 중개보수·인지세·보증료·이사비·예비비가 통째로 빠져 **부족자금이
 * 실제보다 작게** 나왔다. 생활비 0 은 월 여유자금을 소득 전액에 가깝게 만들어 독립
 * 가능 시점까지 낙관적으로 밀었다.
 *
 * 중개보수·인지세·보증료는 대출금이 정해져야 나오는 값이라 화면이 알 수 없다. 생략하면
 * 서버가 `config_effective` 기준으로 계산하고, 계산할 근거가 없는 항목은 경고로 돌려준다.
 */
export interface FirstBaseCostInput {
  movingCost?: number | null;
  brokerageFee?: number | null;
  guaranteeFee?: number | null;
  stampTax?: number | null;
  emergencyReserve?: number | null;
  monthlyLivingExpense?: number | null;
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
