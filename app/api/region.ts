import type { ApiResponse } from '~/types/api';

/**
 * 지역 API.
 *
 * 지역은 화면에 박아 두지 않는다. 정책 권역(수도권·광역시 등)이 정책마다 다르게
 * 걸리고 그 판정은 백엔드가 한다. 목록도 백엔드가 준다.
 */
export interface RegionOption {
  id: number;
  code: string;
  name: string;
  policyArea: string;
}

export function useRegionApi() {
  const { $api } = useNuxtApp();

  return {
    /** 전세 진단에서 고를 수 있는 지역. */
    async jeonseOptions() {
      const { data } = await $api.get<ApiResponse<RegionOption[]>>(
        '/api/v1/regions/jeonse-options',
      );
      return data.data;
    },
  };
}
