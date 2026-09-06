import type { ApiResponse } from '~/types/api';

/**
 * 은행 사전상담 결과.
 *
 * 상담은 **승인이 아니라 그날 창구에서 들은 말**이다. 그래서 값마다 "못
 * 들었어요" 가 따로 있다 — 안 들은 것을 채워 넣으면 나중에 조건이 다르다고
 * 할 때 어디가 어긋났는지 못 짚는다.
 */
const BASE = '/api/v1/plans';

const consultations = (planId: number, propertyId: number) =>
  `${BASE}/${planId}/properties/${propertyId}/consultations`;

/** 대출이 되냐고 물었을 때 들은 답. */
export type ConsultationResult =
  'POSSIBLE' | 'DIFFICULT' | 'DOCUMENT_REVIEW_REQUIRED' | 'NOT_HEARD';

/** 어떤 상품으로 진행한다고 했는가. */
export type ConsultedProduct = 'YOUTH_BEOTIMMOK' | 'GENERAL_BEOTIMMOK' | 'BANK_LOAN' | 'UNKNOWN';

/** 어느 보증서로 진행되는가. 담보 방식에 따라 한도와 보증료가 갈린다. */
export type CollateralMethod =
  'HUG_SAFE_JEONSE' | 'HF' | 'SGI' | 'CLAIM_TRANSFER' | 'OTHER' | 'UNKNOWN';

export interface ConsultationPayload {
  bankName: string;
  resultStatus: ConsultationResult;
  loanProduct: ConsultedProduct;
  collateralMethod: CollateralMethod;
  /** 못 들었으면 `null`. */
  approvedLimit: number | null;
  quotedRate: number | null;
  /** 상담한 날. 화면에서 묻지 않아 오늘로 보낸다. */
  consultedAt: string;
}

export interface Consultation extends ConsultationPayload {
  consultationId: number;
  propertyId: number;
  branchName: string | null;
  memo: string | null;
  createdAt: string;
}

export function useConsultationApi() {
  const { $api } = useNuxtApp();

  return {
    async list(planId: number, propertyId: number) {
      const { data } = await $api.get<ApiResponse<Consultation[]>>(
        consultations(planId, propertyId),
      );
      return data.data;
    },

    /** 은행 한 곳의 상담 결과를 남긴다. 매물마다 여러 번 쌓인다. */
    async add(planId: number, propertyId: number, payload: ConsultationPayload) {
      const { data } = await $api.post<ApiResponse<Consultation>>(
        consultations(planId, propertyId),
        payload,
      );
      return data.data;
    },
  };
}
