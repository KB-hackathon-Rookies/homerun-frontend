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
  /** 지금 당장 쓸 수 있는 현금(자기자금). 1루 완료 시 확인 대상이라 실제 값을 받아야 한다. */
  availableCash?: number;
  /** 기존 전세자금대출 유무. 정책 판정에서 대출 중복 여부를 가른다. */
  existingJeonseLoan?: boolean;
  incomeSource?: FinancialValueSource;
  assetSource?: FinancialValueSource;
  financialDataConfirmed?: boolean;
  hopeDeposit?: number;
  regionId?: number;
  /**
   * 값을 모른다고 표시할 항목.
   *
   * 백엔드는 단계마다 "값이 있거나 모름으로 표시됐거나" 를 요구한다. 우리가
   * 묻지 않는 항목은 비워 두는 게 아니라 모름이라고 말해야 넘어간다.
   */
  unknownFields?: PlanInputUnknownField[];
}

/** 모름으로 표시할 수 있는 항목. 지금 쓰는 것만 적었다. */
export type PlanInputUnknownField = 'AVAILABLE_CASH';

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
  /** 지금 당장 쓸 수 있는 현금(자기자금). 1루 완료 확인과 결과 카드의 자기자금 부족분이 읽는다. */
  availableCash: number | null;
  /** 부모와 주민등록상 시·군이 다른가. 마이의 가구 항목이 이걸 뒤집어 보여준다. */
  livesApartFromParents: boolean | null;
  /** 1루 완료에 필요한 값들. 하나라도 비면 판정을 시작할 수 없다. */
  isHomeless: boolean | null;
  householderStatus: HouseholderStatus | null;
  /** 진단 이어하기가 답을 되살릴 때 읽는다. */
  maritalStatus: MaritalStatus | null;
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
  /**
   * 가입 때 받아 둔 생년월일(`YYYY-MM-DD`). 정책 연령 조건이 이 값을 읽는다.
   * `PUT /input` 은 스냅샷을 통째로 덮으므로, 다른 값이 아직 없는 계획 생성
   * 직후에만 이 자리에서 실어 보낸다. 이후 문진은 STEP 저장이 이 값을 물려받는다.
   */
  birthDate?: string;
}

/** 진단 이어하기(`/input/resume`). REVIEW 는 문진의 마지막 확인 단계다. */
export type DiagnosisResumeStep = DiagnosisStep | 'REVIEW';

export interface PlanInputResume {
  /** 다음에 보여줄 STEP. 서버가 분기·완료를 반영해 고른다. 다 끝났으면 null. */
  resumeStep: DiagnosisResumeStep | null;
  completedSteps: DiagnosisResumeStep[];
  /** 분기로 건너뛴 STEP(예: 프리랜서의 회사규모·재직기간). */
  skippedSteps: DiagnosisResumeStep[];
  progressPercent: number;
  revision: number;
  /** 지금까지 저장된 답. 화면이 이걸로 복원한다. 입력이 없으면 null. */
  input: PlanInput | null;
}

/** 초깃값 제안 출처. 확정값(가입·저장)만 골라 쓰고, 모름·미입력은 건드리지 않는다. */
export type PrefillSource = 'SAVED_INPUT' | 'MEMBER_PROFILE' | 'EXPLICIT_UNKNOWN' | 'UNAVAILABLE';

export interface PrefillValue<T> {
  value: T | null;
  source: PrefillSource;
}

/** 회원 프로필 기반 진단 초깃값. 조회만 하고 저장은 하지 않는다. */
export interface PlanProfilePrefill {
  planId: number;
  birthDate: PrefillValue<string>;
  militaryMonths: PrefillValue<number>;
}

export function usePlanApi() {
  const { $api } = useNuxtApp();

  return {
    async create(leaseType: LeaseType) {
      const { data } = await $api.post<ApiResponse<PlanResponse>>(BASE, { leaseType });
      return data.data;
    },

    /**
     * 진행 중인 계획을 이어한다.
     *
     * 로컬에 적어 둔 번호가 없거나(재로그인·기기 변경) 남의 것이라 막혔을 때,
     * 서버가 이 계정의 가장 최근 ACTIVE 계획을 돌려준다. 정말 없으면 404 다 —
     * 그때만 새로 시작 안내를 띄운다.
     */
    async getActive() {
      const { data } = await $api.get<ApiResponse<PlanResponse>>(`${BASE}/active`);
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

    /**
     * 진단 문진을 이어한다.
     *
     * 저장된 답·완료 단계·건너뛴 단계와 함께 다음에 보여줄 STEP 을 준다. 새로고침
     * 해도 처음부터 다시 묻지 않게 화면이 이걸로 복원한다.
     */
    async resume(planId: number) {
      const { data } = await $api.get<ApiResponse<PlanInputResume>>(
        `${BASE}/${planId}/input/resume`,
      );
      return data.data;
    },

    /** 회원 프로필 기반 진단 초깃값(생년월일 등). 조회만 한다. */
    async profilePrefill(planId: number) {
      const { data } = await $api.get<ApiResponse<PlanProfilePrefill>>(
        `${BASE}/${planId}/input/profile-prefill`,
      );
      return data.data;
    },

    /**
     * 한 단계만 저장한다. 서버가 다음 단계와 새 `revision` 을 돌려준다.
     *
     * REVIEW 는 문진 마지막 확인 단계다. 저장하면 서버가 1루 완료 필수 입력이 다
     * 찼는지 검증하므로, 1루 최종 제출 직전에 이 단계를 남긴다.
     */
    async saveStep(
      planId: number,
      step: DiagnosisStep | 'REVIEW',
      expectedRevision: number,
      patch: DiagnosisStepPatch,
    ) {
      const { data } = await $api.put<ApiResponse<DiagnosisStepResult>>(
        `${BASE}/${planId}/input/steps/${step}`,
        { expectedRevision, ...patch },
      );
      return data.data;
    },

    /**
     * 계획 단계(관문)를 완료한다. 서버가 완료를 승인해야 다음 단계가 열린다.
     *
     * BENCH_ONBOARDING 을 완료하지 않으면 계획이 BENCH 에 남아, 진단을 진행해도
     * 대시보드 단계·이어하기와 화면이 어긋난다. 준비 문진을 마친 뒤 이걸 부른다.
     */
    async completeStep(planId: number, stepCode: string, ruleVersion: string) {
      await $api.post<ApiResponse<unknown>>(`${BASE}/${planId}/steps/${stepCode}/complete`, {
        ruleVersion,
      });
    },
  };
}
