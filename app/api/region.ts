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
    /**
     * 전세 진단에서 고를 수 있는 지역.
     *
     * 회원가입 중에도 부르므로 토큰을 붙이지 않는다(`skipAuth`). 이 경로는 백엔드가 permitAll 로
     * 열어 두었지만, 토큰이 붙으면 필수약관 필터가 동의 전 계정을 403 으로 막는다 — 아직 약관에
     * 동의하지 못한 소셜 신규 회원이 정확히 그 상태다.
     */
    async jeonseOptions() {
      const { data } = await $api.get<ApiResponse<RegionOption[]>>(
        '/api/v1/regions/jeonse-options',
        { skipAuth: true },
      );
      return data.data;
    },
  };
}
