<script setup lang="ts">
import { useOpenBankingApi, type OpenBankingAccount } from '~/api/openbanking';
import { useAuthStore } from '~/stores/auth';
import { messageFrom } from '~/utils/error';

/**
 * 오픈뱅킹 연동 완료.
 *
 * 가입 완료 화면과 같은 틀이다. 문구와 다음 순서만 다르다.
 *
 * ## 계좌 목록이 여기 있는 이유
 *
 * 연동은 금융결제원 인가 페이지에서 일어난다 — 우리 화면 밖이다. 돌아온 뒤
 * "완료!" 라고만 말하면 사용자는 무엇이 연결됐는지 끝내 확인하지 못한다. 자기가
 * 고른 계좌가 은행 이름과 계좌번호로 여기 보여야 연동됐다는 말이 성립한다.
 *
 * 시안(`오픈뱅킹 1 · 연동 안내`)은 은행 행에 `KB국민은행 · 입출금 2건` 을 적어
 * 두었지만 그것은 예시다. 어느 은행을 몇 개 고를지는 사용자가 인가 페이지에서
 * 정하므로 응답에 있는 것만 그린다.
 */
definePageMeta({ middleware: 'auth' });

const auth = useAuthStore();
const { accounts: fetchAccounts, balance: fetchBalance } = useOpenBankingApi();

const greeting = computed(() =>
  auth.user?.name ? `${auth.user.name}님, 준비는 끝났어요.` : '준비는 끝났어요.',
);

const accounts = ref<OpenBankingAccount[]>([]);
const pending = ref(true);
const error = ref('');

/**
 * 계좌별 잔액.
 *
 * 잔액은 계좌마다 은행을 한 번씩 더 다녀오는 값이라 목록과 함께 오지 않는다.
 * 목록을 먼저 세운 뒤 채우고, 실패한 계좌는 그 줄에서만 실패라고 말한다 —
 * 잔액 하나 때문에 목록이 비면 이 화면의 요점이 사라진다.
 */
type BalanceState = { status: 'loading' } | { status: 'ok'; amount: number } | { status: 'failed' };

const balances = ref<Record<string, BalanceState>>({});

/**
 * 화면에 쓸 은행 이름.
 *
 * 저축은행 계좌는 `bankName` 이 `저축은행` 으로 오고 실제 이름은
 * `savingsBankName` 에 들어온다. 둘 다 서버가 준 값이라 고르는 것일 뿐이다.
 */
function bankNameOf(account: OpenBankingAccount) {
  return account.savingsBankName?.trim() || account.bankName;
}

/**
 * 금융결제원 계좌종류 코드의 이름.
 *
 * 백엔드는 대출에만 이름을 붙여 주고(`OpenBankingLoanResponse.accountTypeName`)
 * 계좌에는 코드만 준다. 모르는 코드에는 아무 말도 하지 않는다 — 화면에 `1` 을
 * 띄우거나 없는 이름을 지어내느니 비워 두는 편이 낫다.
 */
const ACCOUNT_TYPE_NAME: Record<string, string> = {
  '1': '수시입출금',
  '2': '예적금',
  '6': '수익증권',
  T: '종합계좌',
};

/** 별칭이 있으면 별칭, 없으면 아는 계좌 종류. 둘 다 없으면 줄 자체를 그리지 않는다. */
function subtitleOf(account: OpenBankingAccount) {
  return account.alias?.trim() || ACCOUNT_TYPE_NAME[account.accountType] || '';
}

/** 잔액은 만 원 미만을 버리지 않는다. 통장에 찍힌 값과 달라 보이면 안 된다. */
const formatWon = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;

/** 아직 조회를 시작하지 않았으면 빈 문자열 — 자리만 비워 둔다. */
function balanceLabelOf(fintechUseNumber: string) {
  const state = balances.value[fintechUseNumber];
  if (!state) return '';
  if (state.status === 'loading') return '잔액 조회 중';
  if (state.status === 'failed') return '잔액 확인 못 함';
  return formatWon(state.amount);
}

const balanceReady = (fintechUseNumber: string) =>
  balances.value[fintechUseNumber]?.status === 'ok';

async function load() {
  pending.value = true;
  error.value = '';
  balances.value = {};

  try {
    accounts.value = await fetchAccounts();
  } catch (cause) {
    accounts.value = [];
    error.value = messageFrom(cause, '연결된 계좌를 불러오지 못했어요.');
    return;
  } finally {
    pending.value = false;
  }

  // 기다리지 않는다. 잔액이 오기 전에 목록이 먼저 서야 한다.
  void loadBalances(accounts.value);
}

async function loadBalances(targets: OpenBankingAccount[]) {
  for (const account of targets) {
    balances.value[account.fintechUseNumber] = { status: 'loading' };
  }

  await Promise.all(
    targets.map(async (account) => {
      try {
        const { balanceAmount } = await fetchBalance(account.fintechUseNumber);
        balances.value[account.fintechUseNumber] = { status: 'ok', amount: balanceAmount };
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

      <!-- 연결된 계좌. 무엇이 연결됐는지 눈으로 확인하는 자리다. -->
      <section class="flex w-full flex-col gap-2">
        <div class="flex items-center gap-1.5">
          <h2 class="text-caption1 text-ink-hero">연결된 계좌</h2>
          <span v-if="accounts.length" class="text-micro text-ink-muted">
            {{ accounts.length }}개
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
            <span class="text-caption1 text-ink-hero truncate">{{ bankNameOf(account) }}</span>
            <span class="text-micro text-ink-muted truncate">
              {{ account.accountNumberMasked }}
            </span>
            <span v-if="subtitleOf(account)" class="text-micro text-ink-muted truncate">
              {{ subtitleOf(account) }}
            </span>
          </div>

          <!-- 잔액은 늦게 온다. 오지 않아도 위의 계좌 정보는 그대로 서 있다. -->
          <span
            v-if="balanceLabelOf(account.fintechUseNumber)"
            class="text-micro shrink-0"
            :class="balanceReady(account.fintechUseNumber) ? 'text-ink-hero' : 'text-ink-subtle'"
          >
            {{ balanceLabelOf(account.fintechUseNumber) }}
          </span>
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
