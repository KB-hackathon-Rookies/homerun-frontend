import type { PlanInput } from '~/api/plan';
import type { ApiResponse } from '~/types/api';

/**
 * 오픈뱅킹 API.
 *
 * 연동은 금융결제원 인가 페이지를 거친다. 인가 URL 을 받아 사용자를 보내고,
 * 돌아왔는지 `connection` 으로 확인하고, 확인되면 `financial-summary` 로
 * 자산·소득을 가져온다.
 *
 * 요약은 숫자만 말한다 — 무엇이 연결됐는지는 `accounts` 가 말한다. 연동이
 * 정말 됐다는 것을 사용자가 눈으로 확인하는 곳이라 요약과 따로 둔다.
 */
const BASE = '/api/v1/open-banking';

export interface OpenBankingConnection {
  connected: boolean;
  scope: string | null;
  accessTokenExpiresAt: string | null;
  lastConnectedAt: string | null;
}

/** 화면에서 실제로 쓰는 값만 추렸다. 응답에는 이보다 많은 필드가 있다. */
export interface FinancialSummary {
  connectedAccountCount: number;
  totalAccountBalance: number | null;
  averageMonthlyNetIncome: number | null;
  salaryDetectedMonths: number;
  incomplete: boolean;
}

/**
 * 연결된 계좌 한 건(`OpenBankingAccountResponse`).
 *
 * 어느 은행을 몇 개 고를지는 금융결제원 인가 페이지에서 사용자가 정한다.
 * 여기 오는 것이 실제로 고른 계좌 전부다.
 */
export interface OpenBankingAccount {
  /** 은행이 붙여 둔 계좌 별칭. `급여통장` 처럼 온다. 없으면 빈 문자열. */
  alias: string;
  bankCode: string;
  bankName: string;
  /**
   * 저축은행일 때만 실제 은행 이름이 여기 들어온다. 그때 `bankName` 은
   * `저축은행` 이므로, 화면에는 이 값이 있으면 이쪽을 먼저 써야 한다.
   */
  savingsBankName: string;
  /** 잔액·거래 조회의 계좌 식별자. 계좌번호 대신 이것을 쓴다. */
  fintechUseNumber: string;
  accountNumberMasked: string;
  accountHolderName: string;
  /** 금융결제원 계좌종류 코드. 이름이 아니라 `1` 같은 숫자 문자열이다. */
  accountType: string;
}

/**
 * 계좌 한 건의 잔액(`OpenBankingBalanceResponse`).
 *
 * 목록에 실려 오지 않는다 — 계좌마다 은행에 따로 물어보는 값이라 호출도 따로다.
 * 날짜 셋은 상품에 따라 없을 수 있다(`BigDecimal` 은 JSON 에서 숫자로 온다).
 */
export interface OpenBankingBalance {
  bankName: string;
  savingsBankName: string;
  fintechUseNumber: string;
  balanceAmount: number;
  availableAmount: number;
  accountType: string;
  productName: string;
  accountIssueDate: string | null;
  maturityDate: string | null;
  lastTransactionDate: string | null;
  fetchedAt: string;
}

/**
 * 서버가 오픈뱅킹 소득을 계획 입력에 동기화한 결과. 화면에서 쓰는 값만 추렸다.
 *
 * 서버는 최근 3개월 급여가 모두 확인될 때만 월 실수령 추정값을 미확인 상태로
 * 저장한다(`APPLIED`). 계좌 잔액은 순자산·가용현금으로 자동 저장하지 않으므로
 * 여기서는 소득만 다룬다.
 */
export type OpenBankingIncomeSyncStatus =
  | 'APPLIED'
  | 'UNCHANGED'
  | 'NOT_APPLICABLE'
  | 'MANUAL_VALUE_PRESERVED'
  | 'CONFIRMED_VALUE_PRESERVED';

export interface PlanFinancialSync {
  /**
   * 오픈뱅킹 거래내역에서 뽑은 월 소득 **추정값**. 급여를 못 찾으면 `null`.
   *
   * **저장된 값이 아니다.** 사용자가 직접 적어 둔 소득이 있거나 이미 확인을 마친
   * 값이 있으면 서버는 그것을 지키고 이 추정값을 버린다. 그래서 화면에 올릴 금액은
   * 여기가 아니라 `input` 에서 읽어야 한다.
   */
  suggestedMonthlyIncome: number | null;
  /** 서버가 추정값을 실제로 반영했는지, 무엇을 지켰는지. 다음 행동이 여기서 갈린다. */
  monthlyIncomeSyncStatus: OpenBankingIncomeSyncStatus;
  /** 동기화 뒤 서버가 들고 있는 계획 입력. 적용할 소득도 기존 입력도 없으면 `null`. */
  input: PlanInput | null;
}

/**
 * 동기화 결과로 화면이 무엇을 해야 하는가.
 *
 * - `CONFIRM` — 추정값이 반영됐지만 아직 미확인이다. 확인을 받고 다음으로 간다.
 * - `READY` — 이미 확인된 오픈뱅킹 소득이 있다. **다시 확인하면 서버가 409 로 거절한다.**
 * - `MANUAL` — 오픈뱅킹 소득을 쓸 수 없다. 직접 입력으로 보낸다.
 */
export type IncomeSyncOutcome = 'CONFIRM' | 'READY' | 'MANUAL';

export function incomeSyncOutcome(sync: PlanFinancialSync): IncomeSyncOutcome {
  switch (sync.monthlyIncomeSyncStatus) {
    case 'APPLIED':
    case 'UNCHANGED':
      return 'CONFIRM';
    case 'CONFIRMED_VALUE_PRESERVED':
      // 확인은 끝났지만 출처가 오픈뱅킹이 아니면 STEP 저장에서 출처 검증에 걸린다.
      return sync.input?.incomeSource === 'OPEN_BANKING' ? 'READY' : 'MANUAL';
    default:
      // MANUAL_VALUE_PRESERVED — 사용자가 적은 값을 서버가 지켰다.
      // NOT_APPLICABLE — 급여를 못 찾았다.
      return 'MANUAL';
  }
}

/** 계획 입력 엔드포인트. 오픈뱅킹 동기화·소득 확인은 여기에 붙는다. */
const planInput = (planId: number) => `/api/v1/plans/${planId}/input`;

export function useOpenBankingApi() {
  const { $api } = useNuxtApp();

  return {
    /** 인가 URL 을 받는다. 이 주소를 열어야 계좌 등록·동의가 시작된다. */
    async connect() {
      const { data } = await $api.get<ApiResponse<{ authorizationUrl: string }>>(`${BASE}/connect`);
      return data.data.authorizationUrl;
    },

    /**
     * 데모용 가짜 연결. 금융결제원 인가(팝업·콜백) 없이 연결만 세운다.
     *
     * 실연동이 불가한 데모에서 인가 페이지를 거치지 않고 바로 연결해, 이후 계좌·요약이
     * 샘플 데이터로 답하게 한다. 연동 연출 지연은 화면(progress)이 만들고 이 호출은 즉시
     * 끝난다. 백엔드는 `mock-data=true` 일 때만 이 경로를 연다(운영은 404).
     */
    async mockConnect() {
      const { data } = await $api.post<ApiResponse<OpenBankingConnection>>(`${BASE}/mock-connect`);
      return data.data;
    },

    /** 연결됐는지 확인한다. 인가 페이지에서 돌아왔는지 알 방법이 이것뿐이다. */
    async connection() {
      const { data } = await $api.get<ApiResponse<OpenBankingConnection>>(`${BASE}/connection`);
      return data.data;
    },

    /**
     * 연결된 계좌 목록.
     *
     * 연결이 없으면 목록도 없다 — 인가를 거치지 않은 사용자에게는 실패로 온다.
     */
    async accounts() {
      const { data } = await $api.get<ApiResponse<OpenBankingAccount[]>>(`${BASE}/accounts`);
      return data.data;
    },

    /**
     * 계좌 한 건의 잔액.
     *
     * 계좌마다 은행을 한 번씩 더 다녀오는 호출이다. 목록을 그리는 일과 묶지 말 것 —
     * 한 계좌가 실패해도 나머지 목록은 그대로 서 있어야 한다.
     */
    async balance(fintechUseNumber: string) {
      const { data } = await $api.get<ApiResponse<OpenBankingBalance>>(
        `${BASE}/accounts/${encodeURIComponent(fintechUseNumber)}/balance`,
      );
      return data.data;
    },

    /** 자산·소득 요약. 대출 상세가 없으면 `incomplete` 가 참이다. */
    async financialSummary() {
      const { data } = await $api.get<ApiResponse<FinancialSummary>>(`${BASE}/financial-summary`);
      return data.data;
    },

    /**
     * 오픈뱅킹 소득을 계획 입력에 서버에서 동기화한다.
     *
     * 요약 GET 은 입력을 저장하지 않는다. 이 호출이 있어야 서버가 소득 출처를
     * `OPEN_BANKING` 으로 기록하고, 그다음에야 STEP 저장에서 같은 출처가 받아들여진다.
     */
    async syncPlanIncome(planId: number) {
      const { data } = await $api.post<ApiResponse<PlanFinancialSync>>(
        `${planInput(planId)}/open-banking-sync`,
      );
      return data.data;
    },

    /**
     * 서버에 동기화된 오픈뱅킹 소득을 그대로 확인한다.
     *
     * 금액은 서버가 들고 있는 값을 쓰므로 보내지 않는다. 확인 전에는 정책 자격
     * 판정에 쓰지 않는다.
     */
    async confirmPlanIncome(planId: number) {
      await $api.put<ApiResponse<unknown>>(`${planInput(planId)}/financial-income`, {
        action: 'CONFIRM_OPEN_BANKING',
      });
    },
  };
}
