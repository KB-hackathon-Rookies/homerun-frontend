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

/** 공시가격을 어디서 봤는가. 주택 유형에 따라 보는 곳이 다르다. */
export type OfficialPriceSource =
  'REALTY_PRICE_APARTMENT' | 'REALTY_PRICE_DETACHED' | 'HOMETAX_STANDARD_VALUE';

/**
 * STEP 4 로 저장하는 등기부 확인값.
 *
 * 사실값이 전부 `boolean | null` 이다. **`null` 이 "모르겠어요"** 다 — 안 본 것을
 * `false` 로 채우면 백엔드가 확인된 사실로 받아 판정한다.
 */
export interface RegistryStepPatch {
  ownerMatches: boolean | null;
  trustRegistered: boolean | null;
  leaseholdRegistered: boolean | null;
  seizureOrDispositionRestricted: boolean | null;
  auctionInProgress: boolean | null;
  seniorDebt: number | null;
  /** 금액·기준연도·출처는 셋이 함께 가거나 셋 다 비어 있어야 한다. */
  officialPrice: number | null;
  officialPriceYear: number | null;
  officialPriceSource: OfficialPriceSource | null;
}

export interface PropertyAnalysis {
  propertyId: number;
  workflow: PropertyWorkflow;
}

/** 2루 끝에 고른 매물과 그 매물로 받기로 한 대출 조건. */
export interface PropertyDecision {
  decisionId: number;
  decisionRevision: number;
  property: PropertyCandidate;
  consultation: {
    consultationId: number;
    bankName: string;
    loanProduct: string;
    collateralMethod: string;
    approvedLimit: number | null;
    quotedRate: number | null;
  } | null;
  decidedAt: string;
}

export function usePropertyApi() {
  const { $api } = useNuxtApp();

  return {
    /**
     * 매물과 대출 조건을 확정한다.
     *
     * 3루가 여기서부터 시작한다 — 계약 초안(`contract/prefill`)이 이 값을
     * 찾지 못하면 일정도 서류도 만들 수 없다.
     */
    async decide(planId: number, propertyId: number, consultationId: number) {
      const { data } = await $api.put<ApiResponse<PropertyDecision>>(
        `${properties(planId)}/decision`,
        { propertyId, consultationId },
      );
      return data.data;
    },

    /** 최종 선택을 제출하고 서버 계획 단계를 3루로 넘긴다. */
    async completeSecondBase(
      planId: number,
      expectedDecisionRevision: number,
      ruleVersion: string,
    ) {
      const { data } = await $api.post<ApiResponse<unknown>>(
        `${BASE}/${planId}/second-base/complete`,
        { expectedDecisionRevision, ruleVersion },
      );
      return data.data;
    },

    /** 확정한 매물·대출 조건. 4루는 이걸 기준으로 담보와 상품을 말한다. */
    async decision(planId: number) {
      const { data } = await $api.get<ApiResponse<PropertyDecision>>(
        `${properties(planId)}/decision`,
      );
      return data.data;
    },

    async candidates(planId: number) {
      const { data } = await $api.get<ApiResponse<PropertyCandidate[]>>(properties(planId));
      return data.data;
    },

    /**
     * 매물 후보를 삭제한다.
     *
     * 최종 선택했거나 계약에 쓴 매물은 서버가 막는다(409). 그 경우는 화면에서
     * 에러 문구로 알린다 — 여기서 삼키면 사용자는 지워진 줄 안다.
     */
    async remove(planId: number, propertyId: number) {
      await $api.delete(`${properties(planId)}/${propertyId}`);
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

    /**
     * STEP 2. 자동조회로 주택유형·전용면적을 못 채웠을 때 사람이 직접 입력한다.
     * 저장하면 워크플로가 STEP 3(위반건축물)으로 넘어간다.
     */
    async saveBuilding(
      planId: number,
      propertyId: number,
      expectedRevision: number,
      houseType: string,
      exclusiveArea: number,
    ) {
      const { data } = await $api.put<ApiResponse<{ workflow: PropertyWorkflow }>>(
        `${properties(planId)}/${propertyId}/steps/building`,
        { expectedRevision, houseType, exclusiveArea },
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

    /** STEP 4. 사람이 등기부를 보고 온 결과다. 모르는 값은 `null` 로 그대로 보낸다. */
    async saveRegistry(
      planId: number,
      propertyId: number,
      expectedRevision: number,
      patch: RegistryStepPatch,
    ) {
      const { data } = await $api.put<ApiResponse<{ workflow: PropertyWorkflow }>>(
        `${properties(planId)}/${propertyId}/steps/registry`,
        { expectedRevision, ...patch },
      );
      return data.data;
    },
  };
}
