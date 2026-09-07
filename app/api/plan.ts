import type { ApiResponse } from '~/types/api';

/**
 * 플랜 API.
 *
 * 플랜은 임대차 유형이 정해져야 만들어진다(`leaseType` 이 생성 파라미터다).
 * 그래서 문진은 답을 모아 두었다가 마지막에 플랜을 만들고, 나머지 답을
 * 입력값으로 이어 붙인다.
 */
const BASE = '/api/v1/plans';

/** 반전세는 백엔드에 있지만 문진에서는 묻지 않는다. */
export type LeaseType = 'JEONSE' | 'WOLSE' | 'BANJEONSE';

export interface PlanResponse {
  id: number;
  leaseType: LeaseType;
  stage: string;
  status: string;
  /** 이 계획을 판정할 때 쓰는 규칙 버전. 지침이 개정되면 올라간다. */
  ruleVersion: string | null;
}

/** 문진이 채우는 값만 추렸다. 입력값에는 이보다 훨씬 많은 필드가 있다. */
/** 백엔드 `DiagnosisInputStep` 중 문진이 다루는 것만 적었다. */
export type DiagnosisStep =
  | 'HOUSEHOLDER'
  | 'HOMELESS'
  | 'MARITAL_STATUS'
  | 'EMPLOYMENT_TYPE'
  | 'COMPANY_SIZE'
  | 'EMPLOYMENT_PERIOD'
  | 'FINANCIAL'
  | 'HOPE_DEPOSIT'
  | 'REGION';

export type HouseholderStatus = 'CURRENT' | 'EXPECTED' | 'NOT_HOUSEHOLDER';
export type MaritalStatus = 'SINGLE' | 'MARRIED';
export type EmploymentType =
  'FULL_TIME' | 'CONTRACT' | 'INTERN' | 'DAILY_WORKER' | 'FREELANCER' | 'UNEMPLOYED';
export type CompanySize = 'LARGE' | 'MID_SIZE' | 'SMALL' | 'PUBLIC' | 'STARTUP' | 'OTHER';

/** 조회값을 그대로 쓴 건지, 사용자가 고친 건지 구분한다. */
export type FinancialValueSource = 'OPEN_BANKING' | 'MANUAL';

/** 한 단계에서 보내는 값. 그 단계의 필드만 채워 보낸다. */
export interface DiagnosisStepPatch {
  householderStatus?: HouseholderStatus;
  isHomeless?: boolean;
  maritalStatus?: MaritalStatus;
  employmentType?: EmploymentType;
  companySize?: CompanySize;
  employmentMonths?: number;
  monthlyIncome?: number;
  netAssets?: number;
  incomeSource?: FinancialValueSource;
  assetSource?: FinancialValueSource;
  financialDataConfirmed?: boolean;
  hopeDeposit?: number;
  regionId?: number;
}

export interface DiagnosisStepResult {
  nextStep: DiagnosisStep | null;
  progressPercent: number;
  /** 다음 저장에 그대로 실어 보낸다. 다른 기기가 먼저 고쳤는지 서버가 이걸로 안다. */
  revision: number;
}

/** 저장된 입력 중 다른 화면이 되읽는 것만 추렸다. */
export interface PlanInput {
  planId: number;
  hopeDeposit: number | null;
  regionId: number | null;
  /** 4루가 주거비 비중(RIR)을 계산할 때 분모로 쓴다. */
  monthlyIncome: number | null;
  maintenanceFee: number | null;
  netAssets: number | null;
  /** 부모와 주민등록상 시·군이 다른가. 마이의 가구 항목이 이걸 뒤집어 보여준다. */
  livesApartFromParents: boolean | null;
  /** 1루 완료에 필요한 값들. 하나라도 비면 판정을 시작할 수 없다. */
  isHomeless: boolean | null;
  householderStatus: HouseholderStatus | null;
  employmentType: EmploymentType | null;
  companySize: CompanySize | null;
  employmentMonths: number | null;
  /** 오픈뱅킹에서 읽어온 값인가, 사용자가 적은 값인가. */
  incomeSource: FinancialValueSource | null;
  /** 조회값을 사용자가 확인했는가. 확인 전에는 판정에 쓰지 않는다. */
  financialDataConfirmed: boolean | null;
  revision: number;
}

export interface PlanInputPatch {
  /** 부모와 주민등록상 시·군이 다른가. 주소가 아니라 다른지 여부만 받는다. */
  livesApartFromParents?: boolean;
  /** 지금 살고 있는 집에 걸려 있는 보증금. */
  currentDeposit?: number;
}

export function usePlanApi() {
  const { $api } = useNuxtApp();

  return {
    async create(leaseType: LeaseType) {
      const { data } = await $api.post<ApiResponse<PlanResponse>>(BASE, { leaseType });
      return data.data;
    },

    /**
     * 진행 상태를 처음으로 돌린다.
     *
     * 입력값은 남고 관문·할 일만 되감긴다. 되돌릴 수 없으므로 화면에서 한 번
     * 더 묻고 부른다.
     */
    async get(planId: number) {
      const { data } = await $api.get<ApiResponse<PlanResponse>>(`${BASE}/${planId}`);
      return data.data;
    },

    async reset(planId: number) {
      await $api.post<ApiResponse<unknown>>(`${BASE}/${planId}/reset`);
    },

    /** 저장해 둔 입력을 되읽는다. 2루가 희망 보증금을 여기서 가져간다. */
    async input(planId: number) {
      const { data } = await $api.get<ApiResponse<PlanInput>>(`${BASE}/${planId}/input`);
      return data.data;
    },

    async saveInput(planId: number, patch: PlanInputPatch) {
      await $api.put<ApiResponse<unknown>>(`${BASE}/${planId}/input`, patch);
    },

    /** 한 단계만 저장한다. 서버가 다음 단계와 새 `revision` 을 돌려준다. */
    async saveStep(
      planId: number,
      step: DiagnosisStep,
      expectedRevision: number,
      patch: DiagnosisStepPatch,
    ) {
      const { data } = await $api.put<ApiResponse<DiagnosisStepResult>>(
        `${BASE}/${planId}/input/steps/${step}`,
        { expectedRevision, ...patch },
      );
      return data.data;
    },
  };
}
