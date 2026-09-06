import type { ApiResponse } from '~/types/api';

/**
 * 3루 계약 API.
 *
 * 계약 정보는 **계획당 한 건**이고 저장할 때 폼 전체를 덮어쓴다. 날짜를
 * 지우려면 `null` 을 보낸다.
 *
 * 일정은 화면이 계산하지 않는다. 상품·담보·신청방법·주택유형에 따라
 * 갈리고 절대 마감까지 걸려서, 규칙이 두 군데 있으면 반드시 어긋난다.
 */
const BASE = '/api/v1/plans';

const contract = (planId: number) => `${BASE}/${planId}/contract`;

export type LoanProductKind = 'FUND_YOUTH' | 'FUND_GENERAL' | 'BANK';
export type ApplicationMethod = 'BANK_VISIT' | 'ONLINE';
export type ContractCollateral =
  'HUG_SAFE_JEONSE' | 'HF' | 'SGI' | 'CLAIM_TRANSFER' | 'OTHER' | 'NONE';

/** 2루 최종 선택을 반영한 계약 초안. 매물·은행·상품이 여기서 온다. */
export interface ContractEntry {
  contractId: number;
  propertyId: number | null;
  propertyAddress: string | null;
  bankName: string | null;
  branchName: string | null;
  deposit: number;
  loanProductKind: LoanProductKind | null;
  collateralMethod: ContractCollateral | null;
  houseType: string | null;
}

/** 일정의 한 칸. `blocking` 이면 놓쳤을 때 뒤가 다 밀린다. */
export interface Milestone {
  code: string;
  label: string;
  dueDate: string;
  reason: string | null;
  blocking: boolean;
}

export interface ContractSchedule {
  balanceDate: string | null;
  /** 이 계약으로 정책자금을 받을 수 있는 마지막 날. */
  applicationDeadline: string | null;
  loanProductKind: LoanProductKind | null;
  collateralMethod: ContractCollateral | null;
  applicationMethod: ApplicationMethod | null;
  houseType: string | null;
  /** 잔금일까지 30일이 안 남아 일정을 압축했는가. */
  compressedSchedule: boolean;
  milestones: Milestone[];
  warnings: string[];
}

/** 등기부를 언제 뗀 것인가. 계약 때와 잔금일 것을 각각 남긴다. */
export type RegistryStage = 'CONTRACT_SIGNING' | 'SETTLEMENT_DAY';

/**
 * 등기부에서 읽은 사실.
 *
 * 모르는 값은 `null` 로 보낸다. 안 본 것을 "그대로다" 로 채우면 대조가
 * 통과해 버린다 — 이 화면은 돈을 보내도 되는지를 가르는 자리다.
 */
export interface RegistryFacts {
  ownerMatchesContractParty: boolean | null;
  seniorDebt: number | null;
  mortgageCount: number | null;
  leaseholdRegistered: boolean | null;
  seizureOrDispositionRestricted: boolean | null;
  auctionInProgress: boolean | null;
  trustRegistered: boolean | null;
}

export interface RegistryComparison {
  status: 'SAFE' | 'NEED_INFO' | 'BLOCK';
  /** 참이면 잔금을 보내면 안 된다. */
  stopPayment: boolean;
  signingRegistryIssuedAt: string | null;
  settlementRegistryIssuedAt: string | null;
  /** 계약 때와 달라진 것들. */
  changedRisks: string[];
  action: string | null;
}

export function useContractApi() {
  const { $api } = useNuxtApp();

  return {
    /** 2루 결과를 3루 초안으로 옮긴다. 3루에서 넣은 날짜·금액은 건드리지 않는다. */
    async prefill(planId: number) {
      const { data } = await $api.post<ApiResponse<ContractEntry>>(`${contract(planId)}/prefill`);
      return data.data;
    },

    /** 잔금 예정일만 고친다. 폼 전체를 덮어쓰므로 나머지는 초안 값을 그대로 실어 보낸다. */
    async saveBalanceDate(planId: number, entry: ContractEntry, balanceDate: string) {
      await $api.put<ApiResponse<unknown>>(contract(planId), {
        propertyId: entry.propertyId,
        leaseType: 'JEONSE',
        deposit: entry.deposit,
        monthlyRent: 0,
        maintenanceFee: 0,
        electronic: false,
        balanceDate,
        loanProductKind: entry.loanProductKind,
        collateralMethod: entry.collateralMethod,
        houseType: entry.houseType,
      });
    },

    /**
     * 등기부를 기록하고 곧바로 대조한다.
     *
     * 판정은 백엔드가 한다. 사용자가 눈으로 보고 "같다" 고 체크하는 것과
     * 값을 넣어 서버가 비교하는 것은 다르다.
     */
    async recordRegistry(
      planId: number,
      stage: RegistryStage,
      issuedAt: string,
      facts: RegistryFacts,
    ) {
      const { data } = await $api.post<ApiResponse<RegistryComparison>>(
        `${contract(planId)}/registry-snapshots`,
        { stage, issuedAt, ...facts },
      );
      return data.data;
    },

    async registryComparison(planId: number) {
      const { data } = await $api.get<ApiResponse<RegistryComparison>>(
        `${contract(planId)}/registry-comparison`,
      );
      return data.data;
    },

    async schedule(planId: number) {
      const { data } = await $api.get<ApiResponse<ContractSchedule>>(
        `${contract(planId)}/schedule`,
      );
      return data.data;
    },
  };
}
