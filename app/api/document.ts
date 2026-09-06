import type { ApiResponse } from '~/types/api';

/**
 * 서류 발급 안내.
 *
 * 같은 서류라도 어디서 떼느냐에 따라 수수료와 챙길 것이 다르다. 온라인으로
 * 되는 건 온라인을 먼저 권한다 — 주민센터를 두 번 가는 게 제일 아깝다.
 */
const BASE = '/api/v1/documents';

export interface IssueMethod {
  label: string;
  agency: string;
  url: string | null;
  fee: number;
  feeNote: string | null;
  requirements: string | null;
  note: string | null;
  /** 이 서류에서 먼저 권하는 방법인가. */
  recommended: boolean;
}

export interface DocumentSummary {
  code: string;
  name: string;
  issuer: string;
  onlineAvailable: boolean;
  cheapestFee: number;
  validityDays: number | null;
}

export interface DocumentGuide extends Omit<DocumentSummary, 'onlineAvailable' | 'cheapestFee'> {
  validityNote: string | null;
  note: string | null;
  /** 온라인으로는 못 떼는 서류인가. 전입세대확인서가 그렇다. */
  onlineOnlyBlocked: boolean;
  methods: IssueMethod[];
}

export function useDocumentApi() {
  const { $api } = useNuxtApp();

  return {
    async list() {
      const { data } = await $api.get<ApiResponse<{ documents: DocumentSummary[] }>>(BASE);
      return data.data.documents;
    },

    async guide(code: string) {
      const { data } = await $api.get<ApiResponse<DocumentGuide>>(`${BASE}/${code}`);
      return data.data;
    },
  };
}
