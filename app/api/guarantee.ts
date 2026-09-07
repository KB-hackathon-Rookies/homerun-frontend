import type { ApiResponse } from '~/types/api';

/**
 * 보증기관 비교.
 *
 * 한도를 무엇으로 재느냐가 기관마다 다르다 — HF 는 사람(소득), HUG 는 집(공시가격),
 * SGI 는 자체 기준이다. 이 차이가 반환보증을 어디서 드느냐를 가른다.
 */
const BASE = '/api/v1/guarantee-agencies';

export interface GuaranteeAgency {
  code: string;
  name: string;
  agencyType: string;
  /** 한도를 무엇으로 재는지. 문장 그대로 보여준다. */
  limitBasis: string;
  feeRateMin: number | null;
  feeRateMax: number | null;
  /** 규칙에 안 들어가는 가입 제약. HF 가 그렇다. */
  note: string | null;
}

export function useGuaranteeApi() {
  const { $api } = useNuxtApp();

  return {
    async agencies() {
      const { data } = await $api.get<ApiResponse<GuaranteeAgency[]>>(BASE);
      return data.data;
    },
  };
}
