import type { ApiResponse } from '~/types/api';

/**
 * 도로명주소 검색.
 *
 * 행정안전부 주소 API 를 백엔드가 감싼다. 검색 결과에는 주소 글자만 있는 게
 * 아니라 **법정동 코드 · 지번 본번 · 부번**이 함께 온다. 매물을 등록할 때
 * 건축물대장과 실거래를 이 코드로 조회하기 때문에, 사용자가 고른 결과를
 * 통째로 들고 다녀야 한다 — 주소 문자열만 남기면 조회를 못 한다.
 */
const BASE = '/api/v1/addresses';

export interface AddressResult {
  roadAddress: string;
  jibunAddress: string;
  zipCode: string;
  legalDistrictCode: string;
  buildingName: string;
  apartmentBuilding: boolean;
  mountain: boolean;
  mainLotNumber: string;
  subLotNumber: string;
}

export interface AddressSearch {
  currentPage: number;
  countPerPage: number;
  totalCount: number;
  addresses: AddressResult[];
}

export function useAddressApi() {
  const { $api } = useNuxtApp();

  return {
    /** 두 글자 이상이어야 백엔드가 받는다. */
    async search(keyword: string) {
      const { data } = await $api.get<ApiResponse<AddressSearch>>(`${BASE}/search`, {
        params: { keyword },
      });
      return data.data;
    },
  };
}
