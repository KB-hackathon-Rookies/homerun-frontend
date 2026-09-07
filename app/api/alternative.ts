import type { ApiResponse } from '~/types/api';

/**
 * 안 되는 이유와 다음 수.
 *
 * 떨어졌다는 말만 하면 화면이 막다른 길이 된다. 무엇 때문에 걸렸는지를
 * 묶어 주고(`causes`), 시간이 지나면 다시 되는 것은 언제부터인지를 알려준다
 * (`retry-queue`).
 */
const BASE = '/api/v1/plans';

export interface Cause {
  policyCode: string;
  policyName: string;
  reasonCode: string;
  reasonLabel: string;
  /** 사람·집·한도 중 무엇 때문인가. 분류가 없으면 `null`. */
  category: string | null;
  alternativePolicyCode: string | null;
  alternativePolicyName: string | null;
}

export interface RetryQueueItem {
  policyCode: string;
  policyName: string;
  conditionLabel: string;
  /** 이 날짜부터 조건을 충족한다. */
  eligibleFrom: string;
  daysRemaining: number;
  sourceUrl: string | null;
}

export function useAlternativeApi() {
  const { $api } = useNuxtApp();

  return {
    async causes(planId: number) {
      const { data } = await $api.get<ApiResponse<{ causes: Cause[] }>>(
        `${BASE}/${planId}/alternatives/causes`,
      );
      return data.data.causes;
    },

    async retryQueue(planId: number) {
      const { data } = await $api.get<ApiResponse<{ items: RetryQueueItem[] }>>(
        `${BASE}/${planId}/alternatives/retry-queue`,
      );
      return data.data.items;
    },
  };
}
