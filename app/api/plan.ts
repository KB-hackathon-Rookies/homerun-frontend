import type { ApiResponse } from '~/types/api';

/**
 * 플랜 API.
 *
 * 플랜은 임대차 유형이 정해져야 만들어진다(`leaseType` 이 생성 파라미터다).
 * 그래서 문진은 답을 모아 두었다가 마지막에 플랜을 만들고, 나머지 답을
 * 입력값으로 이어 붙인다.
 */
const BASE = '/api/v1/plans';

/** 반전세는 백엔드에 있지만 문진에서는 묻지 않는다. */
export type LeaseType = 'JEONSE' | 'WOLSE' | 'BANJEONSE';

export interface PlanResponse {
  id: number;
  leaseType: LeaseType;
  stage: string;
  status: string;
}

/** 문진이 채우는 값만 추렸다. 입력값에는 이보다 훨씬 많은 필드가 있다. */
export interface PlanInputPatch {
  /** 부모와 주민등록상 시·군이 다른가. 주소가 아니라 다른지 여부만 받는다. */
  livesApartFromParents?: boolean;
  /** 지금 살고 있는 집에 걸려 있는 보증금. */
  currentDeposit?: number;
}

export function usePlanApi() {
  const { $api } = useNuxtApp();

  return {
    async create(leaseType: LeaseType) {
      const { data } = await $api.post<ApiResponse<PlanResponse>>(BASE, { leaseType });
      return data.data;
    },

    async saveInput(planId: number, patch: PlanInputPatch) {
      await $api.put<ApiResponse<unknown>>(`${BASE}/${planId}/input`, patch);
    },
  };
}
