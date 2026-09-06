import type { AddressResult } from '~/api/address';
import type { ApiResponse } from '~/types/api';

/**
 * 2루 매물 API.
 *
 * 매물 하나가 STEP 2(주택유형·면적) → 3(위반건축물) → 4(등기부) 를 지나며
 * 신호등이 바뀐다. 각 STEP 저장은 `expectedRevision` 을 실어 보내야 한다 —
 * 다른 기기가 먼저 고쳤는지 서버가 그걸로 안다.
 */
const BASE = '/api/v1/plans';

const properties = (planId: number) => `${BASE}/${planId}/properties`;

/** 매물 카드의 2루 진행 상태. 색만으로 구분하지 않으려고 한글 이름이 같이 온다. */
export type TrafficLight = 'RED' | 'YELLOW' | 'GREEN' | 'BLUE';

export type PropertyStep = 'BUILDING' | 'VIOLATION' | 'REGISTRY' | 'COMPLETE';

export interface PropertyCandidate {
  propertyId: number;
  address: string;
  roadAddress: string;
  buildingName: string | null;
  houseType: string | null;
  deposit: number | null;
  /** 확보하지 못했으면 `null` 이다 — 0 이 아니다. */
  exclusiveArea: number | null;
  selected: boolean;
  trafficLight: TrafficLight | null;
  trafficLightLabel: string | null;
  analyzedAt: string | null;
}

export interface PropertyWorkflow {
  propertyId: number;
  currentStep: PropertyStep;
  currentStepNumber: number;
  status: string;
  revision: number;
}

/** 매물 하나에 상품 하나가 되는가. 미충족 조건은 첫 실패에서 멈추지 않고 전부 모은다. */
export interface PropertyPolicyVerdict {
  policyCode: string | null;
  policyName: string | null;
  status: 'PASS' | 'NEED_INFO' | 'FAIL';
  failCodes: string[];
  /** 명세서 STEP 1~4 중 어디서 걸렸는가. 통과했거나 사람 조건에서 걸렸으면 `null`. */
  failStep: number | null;
}

export interface PropertyPolicyVerdicts {
  propertyId: number;
  results: PropertyPolicyVerdict[];
  evaluatedAt: string | null;
}

export interface PropertyAnalysis {
  propertyId: number;
  workflow: PropertyWorkflow;
}

export function usePropertyApi() {
  const { $api } = useNuxtApp();

  return {
    async candidates(planId: number) {
      const { data } = await $api.get<ApiResponse<PropertyCandidate[]>>(properties(planId));
      return data.data;
    },

    /**
     * 매물을 등록하고 건축물대장·실거래를 한 번에 조회한다.
     *
     * 주소 검색 결과를 통째로 넘긴다. 조회에 필요한 법정동 코드와 지번이
     * 거기 들어 있다.
     */
    async analyze(planId: number, address: AddressResult, deposit: number, dealYearMonth: string) {
      const { data } = await $api.post<ApiResponse<PropertyAnalysis>>(
        `${properties(planId)}/analysis`,
        {
          house: {
            legalDistrictCode: address.legalDistrictCode,
            mountain: address.mountain,
            mainLotNumber: address.mainLotNumber,
            subLotNumber: address.subLotNumber,
            roadAddress: address.roadAddress,
            jibunAddress: address.jibunAddress,
            buildingName: address.buildingName,
            dealYearMonth,
          },
          deposit,
        },
      );
      return data.data;
    },

    /** 저장된 판정을 읽기만 한다. 새로 판정하지 않는다. */
    async policyVerdicts(planId: number, propertyId: number) {
      const { data } = await $api.get<ApiResponse<PropertyPolicyVerdicts>>(
        `${properties(planId)}/${propertyId}/policy-verdicts`,
      );
      return data.data;
    },

    /** 마지막으로 저장한 STEP 과 `revision` 을 돌려준다. */
    async resume(planId: number, propertyId: number) {
      const { data } = await $api.get<ApiResponse<PropertyWorkflow>>(
        `${properties(planId)}/${propertyId}/resume`,
      );
      return data.data;
    },

    /** STEP 3. 정부24 건축물대장을 사람이 직접 보고 온 결과다. */
    async saveViolation(
      planId: number,
      propertyId: number,
      expectedRevision: number,
      violationBuilding: boolean,
    ) {
      const { data } = await $api.put<ApiResponse<{ workflow: PropertyWorkflow }>>(
        `${properties(planId)}/${propertyId}/steps/violation`,
        { expectedRevision, violationBuilding },
      );
      return data.data;
    },
  };
}
