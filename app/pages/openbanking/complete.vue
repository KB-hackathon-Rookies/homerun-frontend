<script setup lang="ts">
import {
  useOpenBankingApi,
  type FinancialSummary,
  type OpenBankingAccount,
  type OpenBankingBalance,
} from '~/api/openbanking';
import { useAuthStore } from '~/stores/auth';
import { messageFrom } from '~/utils/error';

// 브라우저 탭 제목.
useHead({ title: '오픈뱅킹 연결 완료' });

/**
 * 오픈뱅킹 연동 완료.
 *
 * 가입 완료 화면과 같은 틀이다. 문구와 다음 순서만 다르다.
 *
 * ## 무엇을 보여주나
 *
 * 연동이 "완료" 라는 말만으로는 부족하다 — 무엇이 얼마나 연결됐는지 눈으로 봐야 한다.
 * 그래서 세 겹으로 보여준다: (1) 총 금융자산·월 평균 소득 요약, (2) 계좌별 상품명·잔액·
 * 출금가능액, (3) 다음 순서. 수치는 전부 서버가 목 데이터에서 계산해 돌려준 값이라
 * 진단 입력과 어긋나지 않는다.
 *
 * 계좌 목록·잔액·요약은 각각 다른 호출이라 도착 시점이 다르다. 목록을 먼저 세우고
 * 잔액·요약은 늦게 채운다. 하나가 실패해도 나머지는 그대로 선다.
 */
definePageMeta({ middleware: 'auth' });

const auth = useAuthStore();
const {
  accounts: fetchAccounts,
  balance: fetchBalance,
  financialSummary: fetchSummary,
} = useOpenBankingApi();

const greeting = computed(() =>
  auth.user?.name ? `${auth.user.name}님, 준비는 끝났어요.` : '준비는 끝났어요.',
);

const accounts = ref<OpenBankingAccount[]>([]);
const summary = ref<FinancialSummary | null>(null);
const pending = ref(true);
const error = ref('');

/**
 * 계좌별 잔액 상세.
 *
 * 잔액은 계좌마다 은행을 한 번씩 더 다녀오는 값이라 목록과 함께 오지 않는다. 목록을 먼저
 * 세운 뒤 채우고, 실패한 계좌는 그 줄에서만 실패라고 말한다. 금액뿐 아니라 상품명·출금가능액
 * 까지 이 응답에 들어 있어 통째로 들고 있는다.
 */
type BalanceState =
  { status: 'loading' } | { status: 'ok'; detail: OpenBankingBalance } | { status: 'failed' };

const balances = ref<Record<string, BalanceState>>({});

/**
 * 화면에 쓸 은행 이름.
 *
 * 저축은행 계좌는 `bankName` 이 `저축은행` 으로 오고 실제 이름은 `savingsBankName` 에
 * 들어온다. 둘 다 서버가 준 값이라 고르는 것일 뿐이다.
 */
function bankNameOf(account: OpenBankingAccount) {
  return account.savingsBankName?.trim() || account.bankName;
}

/**
 * 금융결제원 계좌종류 코드의 이름. 모르는 코드에는 아무 말도 하지 않는다 — 없는 이름을
 * 지어내느니 비워 두는 편이 낫다.
 */
const ACCOUNT_TYPE_NAME: Record<string, string> = {
  '1': '수시입출금',
  '2': '예적금',
  '6': '수익증권',
  T: '종합계좌',
};

const accountTypeName = (code: string) => ACCOUNT_TYPE_NAME[code] ?? '';

/**
 * 계좌 부제 — 상품명이 가장 구체적이다.
 *
 * 잔액 응답의 상품명(`샘플 직장인 우대통장`)이 왔으면 그걸 쓰고, 아직 안 왔으면 별칭,
 * 그것도 없으면 계좌 종류로 떨어진다. 셋 다 없으면 줄을 그리지 않는다.
 */
function productNameOf(account: OpenBankingAccount) {
  const state = balances.value[account.fintechUseNumber];
  if (state?.status === 'ok' && state.detail.productName?.trim()) return state.detail.productName;
  return account.alias?.trim() || accountTypeName(account.accountType) || '';
}

/** 잔액은 만 원 미만을 버리지 않는다. 통장에 찍힌 값과 달라 보이면 안 된다. */
const formatWon = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;

/** 월별 내역 칩은 좁아서 만원 단위로 줄인다(합계·평균 헤드라인은 원 단위 그대로). */
const formatManwon = (amount: number) =>
  `${Math.round(amount / 10000).toLocaleString('ko-KR')}만원`;

/** "2026-08" → "8월". */
const monthLabel = (month: string) => `${Number(month.slice(5, 7))}월`;

/** 아직 조회를 시작하지 않았으면 빈 문자열 — 자리만 비워 둔다. */
function balanceLabelOf(fintechUseNumber: string) {
  const state = balances.value[fintechUseNumber];
  if (!state) return '';
  if (state.status === 'loading') return '잔액 조회 중';
  if (state.status === 'failed') return '잔액 확인 못 함';
  return formatWon(state.detail.balanceAmount);
}

const balanceReady = (fintechUseNumber: string) =>
  balances.value[fintechUseNumber]?.status === 'ok';

/**
 * 출금 가능액이 잔액과 다를 때만 따로 말한다(예적금·묶인 금액). 같으면 군더더기라 숨긴다.
 */
function withdrawableNoteOf(fintechUseNumber: string) {
  const state = balances.value[fintechUseNumber];
  if (state?.status !== 'ok') return '';
  const { balanceAmount, availableAmount } = state.detail;
  if (availableAmount === balanceAmount) return '';
  return `출금 가능 ${formatWon(availableAmount)}`;
}

/** 잔액이 다 들어온 계좌들의 합. 하나라도 로딩·실패면 아직 합을 말하지 않는다. */
const totalBalance = computed(() => {
  if (!accounts.value.length) return null;
  let sum = 0;
  for (const account of accounts.value) {
    const state = balances.value[account.fintechUseNumber];
    if (state?.status !== 'ok') return null;
    sum += state.detail.balanceAmount;
  }
  return sum;
});

async function load() {
  pending.value = true;
  error.value = '';
  balances.value = {};
  summary.value = null;

  try {
    accounts.value = await fetchAccounts();
  } catch (cause) {
    accounts.value = [];
    error.value = messageFrom(cause, '연결된 계좌를 불러오지 못했어요.');
    return;
  } finally {
    pending.value = false;
  }

  // 기다리지 않는다. 잔액·요약이 오기 전에 목록이 먼저 서야 한다.
  void loadBalances(accounts.value);
  void loadSummary();
}

async function loadSummary() {
  try {
    summary.value = await fetchSummary();
  } catch {
    // 요약이 없어도 계좌 목록은 그대로 선다. 요약 카드만 접는다.
    summary.value = null;
  }
}

async function loadBalances(targets: OpenBankingAccount[]) {
  for (const account of targets) {
    balances.value[account.fintechUseNumber] = { status: 'loading' };
  }

  await Promise.all(
    targets.map(async (account) => {
      try {
        const detail = await fetchBalance(account.fintechUseNumber);
        balances.value[account.fintechUseNumber] = { status: 'ok', detail };
      } catch {
        // 이 줄의 잔액만 비운다. 목록도, 다른 계좌도 건드리지 않는다.
        balances.value[account.fintechUseNumber] = { status: 'failed' };
      }
    }),
  );
}

onMounted(load);
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />

    <div class="flex flex-1 flex-col items-center gap-4 overflow-y-auto px-6 py-6">
      <!-- 완료 배지. 배지에도 파란 원이 있어 둘레에 옅은 고리가 생긴다. -->
      <span class="bg-surface-info size-hero grid place-items-center overflow-hidden rounded-full">
        <img src="/illust/complete.png" alt="" class="h-25 w-auto" />
      </span>

      <h1 class="text-title3 text-ink-hero">오픈뱅킹 연동 완료!</h1>

      <p class="text-body3 text-ink-hero-body text-center whitespace-pre-line">
        {{ `${greeting}\n이제 메인 화면에서 본격적인 독립 플랜을 짜볼까요?` }}
      </p>

      <!-- 금융 요약. 진단 입력에 그대로 쓰이는 수치라, 여기서 미리 확인시킨다. -->
      <section
        v-if="
          summary &&
          (summary.totalAccountBalance !== null || summary.averageMonthlyNetIncome !== null)
        "
        class="bg-surface-info rounded-field flex w-full flex-col gap-3 p-4"
      >
        <div class="flex items-end justify-between">
          <span class="text-caption1 text-primary-strong">총 금융자산</span>
          <span class="text-body2 text-ink-hero font-bold">
            {{
              summary.totalAccountBalance !== null
                ? formatWon(summary.totalAccountBalance)
                : '확인 중'
            }}
          </span>
        </div>
        <div class="border-line flex items-end justify-between border-t pt-3">
          <div class="flex flex-col">
            <span class="text-caption1 text-primary-strong">월 평균 소득</span>
            <span v-if="summary.salaryDetectedMonths > 0" class="text-micro text-ink-muted">
              최근 {{ summary.salaryDetectedMonths }}개월 급여 기준
            </span>
          </div>
          <span class="text-body2 text-ink-hero font-bold">
            {{
              summary.averageMonthlyNetIncome !== null
                ? formatWon(summary.averageMonthlyNetIncome)
                : '급여 감지 안 됨'
            }}
          </span>
        </div>
        <!-- 월별 소득 내역 — 평균이 어느 달을 몇 번 잡아 나온 값인지 풀어 보여준다. -->
        <div v-if="summary.monthlyNetIncomes.length" class="flex flex-wrap gap-1.5">
          <span
            v-for="income in summary.monthlyNetIncomes"
            :key="income.month"
            class="text-micro text-ink-hero-body bg-surface rounded-full px-2 py-0.5"
          >
            {{ monthLabel(income.month) }} {{ formatManwon(income.amount) }}
          </span>
        </div>

        <p v-if="summary.incomplete" class="text-micro text-ink-muted">
          일부 계좌 정보를 아직 못 가져와 값이 바뀔 수 있어요
        </p>
      </section>

      <!-- 연결된 계좌. 무엇이 연결됐는지 눈으로 확인하는 자리다. -->
      <section class="flex w-full flex-col gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <h2 class="text-caption1 text-ink-hero">연결된 계좌</h2>
            <span v-if="accounts.length" class="text-micro text-ink-muted">
              {{ accounts.length }}개
            </span>
          </div>
          <span v-if="totalBalance !== null" class="text-micro text-ink-muted">
            합계 {{ formatWon(totalBalance) }}
          </span>
        </div>

        <p v-if="pending" class="text-caption2 text-ink-muted">계좌를 불러오는 중이에요…</p>

        <div v-else-if="error" class="flex flex-col items-start gap-2">
          <p class="text-caption2 text-danger">{{ error }}</p>
          <button type="button" class="text-caption1 text-primary-strong" @click="load">
            다시 시도
          </button>
        </div>

        <!-- 인가 페이지에서 계좌를 고르지 않고 나오면 연결은 됐는데 목록이 빈다. -->
        <p v-else-if="!accounts.length" class="text-caption2 text-ink-muted">
          연결은 됐지만 조회할 계좌가 없어요. 마이페이지에서 다시 연동할 수 있어요.
        </p>

        <div
          v-for="account in accounts"
          :key="account.fintechUseNumber"
          class="border-line rounded-field flex items-center gap-3 border p-3.5"
        >
          <span
            class="bg-surface-brand text-caption1 text-ink-hero grid size-8 shrink-0 place-items-center rounded-full"
            aria-hidden="true"
          >
            {{ bankNameOf(account).slice(0, 1) }}
          </span>

          <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <div class="flex items-center gap-1.5">
              <span class="text-caption1 text-ink-hero truncate">{{ bankNameOf(account) }}</span>
              <span
                v-if="accountTypeName(account.accountType)"
                class="text-micro text-primary-deep bg-surface-info shrink-0 rounded-full px-1.5 py-px"
              >
                {{ accountTypeName(account.accountType) }}
              </span>
            </div>
            <span v-if="productNameOf(account)" class="text-micro text-ink-hero-body truncate">
              {{ productNameOf(account) }}
            </span>
            <span class="text-micro text-ink-muted truncate">
              {{ account.accountNumberMasked }}
            </span>
          </div>

          <!-- 잔액은 늦게 온다. 오지 않아도 위의 계좌 정보는 그대로 서 있다. -->
          <div class="flex shrink-0 flex-col items-end gap-0.5">
            <span
              v-if="balanceLabelOf(account.fintechUseNumber)"
              class="text-caption1"
              :class="
                balanceReady(account.fintechUseNumber)
                  ? 'text-ink-hero font-bold'
                  : 'text-ink-subtle'
              "
            >
              {{ balanceLabelOf(account.fintechUseNumber) }}
            </span>
            <span
              v-if="withdrawableNoteOf(account.fintechUseNumber)"
              class="text-micro text-ink-muted"
            >
              {{ withdrawableNoteOf(account.fintechUseNumber) }}
            </span>
          </div>
        </div>
      </section>

      <div class="bg-surface-info rounded-field flex w-full flex-col gap-1.5 p-3.5">
        <span class="text-caption1 text-primary-strong">다음 순서</span>
        <span class="text-caption2 text-ink-hero-body">메인 화면에서 나만의 독립 플랜 짜기</span>
      </div>
    </div>

    <footer class="flex shrink-0 px-4 pb-cta-pad">
      <AppButton variant="strong" @click="navigateTo('/home', { replace: true })">
        메인 화면으로 이동
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
