import type { ApiResponse } from '~/types/api';

/**
 * 2루 최종 제출 API.
 *
 * 매물·상담 조건을 확정(decide)한 뒤 이걸 부른다. 서버가 최종 조건이 다 찼는지
 * 검사하고, 통과하면 2루를 닫고 계획을 3루로 넘긴다. 확정만 저장하고 넘어가면
 * 계획 stage 가 2루에 남아 대시보드·이어하기와 화면이 어긋난다.
 */
const BASE = '/api/v1/plans';

export interface SecondBaseCompleteResult {
  replayed: boolean;
  decisionRevision: number;
}

export function useSecondBaseApi() {
  const { $api } = useNuxtApp();

  return {
    /**
     * 2루를 최종 제출한다.
     *
     * @param expectedDecisionRevision 확정(decide) 응답이 준 최신 매물 결정 revision
     */
    async complete(planId: number, expectedDecisionRevision: number, ruleVersion: string) {
      const { data } = await $api.post<ApiResponse<SecondBaseCompleteResult>>(
        `${BASE}/${planId}/second-base/complete`,
        { expectedDecisionRevision, ruleVersion },
      );
      return data.data;
    },
  };
}
