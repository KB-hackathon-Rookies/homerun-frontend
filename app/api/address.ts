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

/**
 * 이 엔드포인트만 공통 봉투가 없다.
 *
 * 다른 컨트롤러는 전부 `ApiResponse` 로 감싸는데 `AddressController.search` 는
 * `AddressSearchResponse` 를 그대로 내보낸다(백엔드 #323). 벗기려 들면
 * `undefined` 가 되고, 화면에서는 검색 실패로 보인다 — 결과가 1,500건 와도
 * 마찬가지다.
 *
 * 봉투가 생기는 날 한쪽만 고치면 다시 깨지므로, 그때까지 둘 다 받는다.
 */
function unwrap(body: ApiResponse<AddressSearch> | AddressSearch): AddressSearch {
  return 'addresses' in body ? body : body.data;
}

export function useAddressApi() {
  const { $api } = useNuxtApp();

  return {
    /**
     * 두 글자 이상이어야 백엔드가 받는다.
     *
     * 지역 조회와 같은 이유로 토큰을 붙이지 않는다. 회원가입 중에 부르는데, 토큰이 붙으면
     * 필수약관 필터가 동의 전 계정을 403 으로 막는다.
     */
    async search(keyword: string) {
      const { data } = await $api.get<ApiResponse<AddressSearch> | AddressSearch>(
        `${BASE}/search`,
        { params: { keyword }, skipAuth: true },
      );
      return unwrap(data);
    },
  };
}
