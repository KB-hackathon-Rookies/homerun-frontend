import type { ApiResponse } from '~/types/api';

/**
 * 추가 확인이 걸린 조건.
 *
 * 판정이 NEED_INFO 로 빠진 이유가 여기 모인다. "안 된다" 가 아니라 "아직
 * 못 봤다" 는 것이라, 무엇을 어디서 확인하면 되는지까지 같이 온다.
 */
const BASE = '/api/v1/plans';

export interface PendingCondition {
  policyCode: string;
  policyName: string;
  conditionCode: string;
  conditionLabel: string;
  requiredText: string | null;
  factCode: string | null;
  /** 확인할 수 있는 공식 안내 페이지. 근거가 없으면 `null` 이다 — 없는 링크를 지어내지 않는다. */
  sourceUrl: string | null;
}

export function useVerificationApi() {
  const { $api } = useNuxtApp();

  return {
    async pending(planId: number) {
      const { data } = await $api.get<ApiResponse<{ conditions: PendingCondition[] }>>(
        `${BASE}/${planId}/verifications`,
      );
      return data.data.conditions;
    },
  };
}
