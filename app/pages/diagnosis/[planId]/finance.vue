<script setup lang="ts">
import { useFirstBaseApi } from '~/api/firstBase';
import { useOpenBankingApi, type FinancialSummary } from '~/api/openbanking';
import { type DiagnosisStep, type DiagnosisStepPatch, usePlanApi } from '~/api/plan';
import { useRegionApi, type RegionOption } from '~/api/region';
import { useInputRevision } from '~/composables/useInputRevision';
import { messageFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';

/**
 * 1루 추가 정보 입력.
 *
 * 앞 문진과 껍데기가 같아서 여기도 한 화면에서 단계를 넘긴다. 다만 단계가
 * 갈린다 — 오픈뱅킹으로 소득이 확인되면 소득 직접 입력을 건너뛴다.
 *
 * 소득은 서버가 오픈뱅킹으로 검증한 값만 `OPEN_BANKING` 출처로 쓴다. 그래서
 * 먼저 서버에 동기화·확인을 요청하고, 그다음 STEP 을 저장한다. 요약 GET 만으로는
 * 서버가 출처를 기록하지 않아, 그대로 `OPEN_BANKING` 을 보내면 409 로 막힌다.
 *
 * 순자산은 다르다. 계좌 잔액은 부채가 반영된 순자산이 아니므로 오픈뱅킹 값으로
 * 자동 저장하지 않고, 사용자가 직접 확인해 입력한 값(`MANUAL`)만 쓴다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

type Step = 'CONFIRM' | 'MANUAL' | 'ASSETS' | 'DEPOSIT' | 'REGION';

const step = ref<Step>('CONFIRM');
const { revision, load, saveStep } = useInputRevision(planId);
const pending = ref(false);
const error = ref('');

/** 진단 비용은 화면에서 따로 받지 않는다. 한도·이자는 서버가 정책 판정으로 계산한다. */
const ZERO_COSTS = {
  movingCost: 0,
  brokerageFee: 0,
  guaranteeFee: 0,
  stampTax: 0,
  emergencyReserve: 0,
  monthlyLivingExpense: 0,
} as const;

/** 오픈뱅킹 조회값. 못 가져오면 바로 직접 입력으로 보낸다. */
const summary = ref<FinancialSummary | null>(null);
const regions = ref<RegionOption[]>([]);

const useOpenBanking = ref<string | null>(null);
const income = ref('');
const assets = ref('');
/** 지금 당장 쓸 수 있는 현금(자기자금). 1루 완료 시 확인 대상이라 실제 값을 받는다. */
const availableCash = ref('');
/** 기존 전세자금대출 유무(YES/NO). 정책 판정에 쓰이므로 임의로 채우지 않고 직접 받는다. */
const existingJeonseLoan = ref<string | null>(null);
/**
 * 세대원 기금대출과 배우자의 전세·주택담보대출까지 없음을 사용자가 확인했는가.
 *
 * 버팀목 중복대출 금지는 본인 대출 하나로 판정할 수 없어서, 이 확인이 없으면 판정이
 * 추가확인으로 남는다. 사용자 진술이지 은행 확인이 아니라 진행을 막지는 않는다 —
 * 체크를 안 해도 다음으로 넘어가고, 결과에서 추가확인으로 안내된다.
 */
const prohibitedLoanConfirmed = ref(false);

// 기존 대출이 있다고 답을 바꾸면 앞서 한 확인은 더 이상 성립하지 않는다.
watch(existingJeonseLoan, (value) => {
  if (value !== 'NO') prohibitedLoanConfirmed.value = false;
});

/** 대출이 없다고 답한 경우에만 의미가 있다. 그 밖에는 확인하지 않은 것으로 보낸다. */
const prohibitedLoanAnswer = computed(
  () => existingJeonseLoan.value === 'NO' && prohibitedLoanConfirmed.value,
);
const deposit = ref('');
const regionId = ref<string | null>(null);

/** 서버가 오픈뱅킹으로 확정해 저장한 월 소득(원). STEP 저장에 그대로 실어 보낸다. */
const openBankingIncome = ref<number | null>(null);

const onlyDigits = (value: string) => Number(value.replace(/\D/g, '')) || 0;

/** 화면은 만 원 단위로 받고 백엔드는 원 단위로 받는다. */
const toWon = (value: string) => onlyDigits(value) * 10_000;

onMounted(async () => {
  // 문진에서 이어 오므로 서버가 들고 있는 판이 이미 여러 번 올라가 있다.
  await load();

  const { financialSummary } = useOpenBankingApi();
  const { jeonseOptions } = useRegionApi();

  try {
    regions.value = await jeonseOptions();
  } catch {
    // 지역 목록은 뒤 단계에서야 쓴다. 여기서 막지 않는다.
  }

  try {
    summary.value = await financialSummary();
  } catch {
    // 연동을 안 했거나 조회가 실패했다. 물어볼 값이 없으니 직접 입력부터 받는다.
    step.value = 'MANUAL';
  }
});

const canProceed = computed(() => {
  if (step.value === 'CONFIRM') return !!useOpenBanking.value;
  if (step.value === 'MANUAL')
    return !!income.value && !!assets.value && !!availableCash.value && !!existingJeonseLoan.value;
  if (step.value === 'ASSETS')
    return !!assets.value && !!availableCash.value && !!existingJeonseLoan.value;
  if (step.value === 'DEPOSIT') return !!deposit.value;
  return !!regionId.value;
});

const isLast = computed(() => step.value === 'REGION');

/** 3억을 넘으면 기금대출이 막힌다. 미리 알려준다. */
const depositNotice = computed(() =>
  toWon(deposit.value) > 300_000_000
    ? '3억 원을 초과하면 정부 지원 전세자금대출(기금대출)은 한정적일 수 있어요. 대신 은행 전세자금대출은 보증금 한도가 없어서 계속 진행할 수 있어요'
    : null,
);

async function save(code: DiagnosisStep, patch: DiagnosisStepPatch) {
  await saveStep(code, patch);
}

/**
 * 오픈뱅킹 소득을 서버에 동기화하고 확인받는다.
 *
 * 서버가 소득을 확정하지 못하면(연동 실패·급여 미확인 등) 오픈뱅킹 소득을 쓸 수
 * 없으므로 직접 입력으로 돌린다. 확정했으면 그 값을 확인 처리하고 순자산 입력으로
 * 넘어간다.
 */
async function confirmOpenBankingIncome() {
  const { syncPlanIncome, confirmPlanIncome } = useOpenBankingApi();

  const synced = await syncPlanIncome(planId);
  if (synced.suggestedMonthlyIncome === null) {
    useOpenBanking.value = 'MANUAL';
    income.value = '';
    step.value = 'MANUAL';
    return;
  }

  await confirmPlanIncome(planId);
  openBankingIncome.value = synced.suggestedMonthlyIncome;
  // 동기화·확인으로 서버 revision 이 올라갔으니 최신값을 물려받는다.
  await load();
  step.value = 'ASSETS';
}

async function next() {
  if (!canProceed.value || pending.value) return;

  pending.value = true;
  error.value = '';
  try {
    if (step.value === 'CONFIRM') {
      if (useOpenBanking.value === 'MANUAL') {
        step.value = 'MANUAL';
        return;
      }
      await confirmOpenBankingIncome();
      return;
    }

    if (step.value === 'MANUAL') {
      await save('FINANCIAL', {
        monthlyIncome: toWon(income.value),
        netAssets: toWon(assets.value),
        availableCash: toWon(availableCash.value),
        existingJeonseLoan: existingJeonseLoan.value === 'YES',
        prohibitedLoanConfirmed: prohibitedLoanAnswer.value,
        incomeSource: 'MANUAL',
        assetSource: 'MANUAL',
        financialDataConfirmed: true,
      });
      step.value = 'DEPOSIT';
      return;
    }

    if (step.value === 'ASSETS') {
      // 소득은 서버가 오픈뱅킹으로 확인한 값을 그대로, 순자산은 사용자가 직접
      // 넣은 값을 쓴다. 계좌 잔액을 순자산으로 자동 저장하지 않는다.
      await save('FINANCIAL', {
        monthlyIncome: openBankingIncome.value ?? undefined,
        netAssets: toWon(assets.value),
        availableCash: toWon(availableCash.value),
        existingJeonseLoan: existingJeonseLoan.value === 'YES',
        prohibitedLoanConfirmed: prohibitedLoanAnswer.value,
        incomeSource: 'OPEN_BANKING',
        assetSource: 'MANUAL',
        financialDataConfirmed: true,
      });
      step.value = 'DEPOSIT';
      return;
    }

    if (step.value === 'DEPOSIT') {
      await save('HOPE_DEPOSIT', { hopeDeposit: toWon(deposit.value) });
      step.value = 'REGION';
      return;
    }

    await save('REGION', { regionId: Number(regionId.value) });
    await submitFirstBase();
  } catch (cause) {
    error.value = messageFrom(cause, '저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
}

/**
 * 1루를 최종 제출한다.
 *
 * 결과 화면은 정책 평가 API 를 다시 부르므로, 여기서 평가만 해서는 계획 stage 가
 * 1루에 남는다. REVIEW 를 저장해 필수 입력이 다 찼음을 확정한 뒤, first-base 완료를
 * 호출해 서버가 진단을 저장하고 계획을 2루로 넘기게 한다. 서버가 완료를 승인한
 * 뒤에만 결과 화면으로 넘어간다.
 */
async function submitFirstBase() {
  await saveStep('REVIEW', {});

  const plan = await usePlanApi().get(planId);
  if (!plan.ruleVersion) throw new Error('계획 규칙 버전을 확인할 수 없어요.');

  const result = await useFirstBaseApi().complete(planId, revision.value, plan.ruleVersion, {
    ...ZERO_COSTS,
  });
  if (result.status !== 'COMPLETED') {
    // 아직 확인하지 못한 입력이 남았다(예: 자기자금). 화면을 넘기지 않는다.
    error.value =
      '입력을 한 번 더 확인해야 해요. 앞 단계로 돌아가 값을 확인하고 다시 시도해주세요.';
    return;
  }
  await navigateTo(`/result/${planId}/match`);
}

/**
 * 코치 TIME(시안 1루 3 모달 · 실제로 필요한 돈).
 *
 * 이 화면에서 보증금을 적는데, 보증금만 준비하면 되는 줄 알고 넘어가는 게
 * 여기서 제일 자주 나는 사고다. 시안은 부대비용을 모달로 따로 편다.
 *
 * 내용은 시안 문구 그대로다. 예시 계정의 금액이 박힌 항목은 빼고 규칙만 남긴다.
 */
const COACH = {
  title: '실제로 필요한 돈',
  intro:
    '보증금만 준비하면 되는 게 아니야. 중개보수, 이사비, 보증료 같은 게 따로 들어. 이걸 빼먹으면 잔금일에 돈이 모자라',
  qa: [
    {
      q: '부대비용 네 가지',
      a: '중개보수(보증금 × 0.3% + 부가세), 인지세(3만 5천~7만 5천원), 보증료(대출금 × 0.04~0.27%), 이사비(30만~100만원)',
    },
    {
      q: '계약금은 먼저 나가',
      a: '보증금의 5~10%를 계약할 때 내 돈으로 먼저 내. 대출 신청 조건이 보증금의 5% 이상 지급이야',
    },
    {
      q: '보증금이 3억원을 넘으면',
      a: '정부 지원 전세자금대출은 한정적일 수 있어. 대신 은행 전세자금대출은 보증금 한도가 없어서 계속 진행할 수 있어',
    },
  ],
  /** 시안 `더 알아보기` 칩. 실제로 있는 모듈만 건다. */
  related: [{ id: 'safe-contract-333', label: '안심계약 3·3·3 법칙' }],
};

const coachOpen = ref(false);

function back() {
  if (step.value === 'CONFIRM') {
    navigateTo(`/diagnosis/${planId}`);
    return;
  }
  // 소득을 직접 입력하러 온 사람과 오픈뱅킹으로 확인한 사람은 지나온 길이 다르다.
  if (step.value === 'MANUAL' || step.value === 'ASSETS') {
    step.value = 'CONFIRM';
    return;
  }
  if (step.value === 'DEPOSIT') {
    step.value = useOpenBanking.value === 'MANUAL' ? 'MANUAL' : 'ASSETS';
    return;
  }
  step.value = 'DEPOSIT';
}
</script>

<template>
  <PhoneFrame v-model:coach-open="coachOpen" :coach-sheets="[COACH]">
    <StageBar title="사용자 정보 입력" base="1루" @back="back" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 p-4">
      <!-- 코치 팁 전체가 코치 TIME 을 여는 자리다. 오른쪽 아래 코치 FAB 과 같은 시트를 연다. -->
      <button type="button" class="w-full text-left" @click="coachOpen = true">
        <CoachTip label="⚾ 코치 TIME · 눌러서 자세히 보기"
          >보증금 말고도 이사비·중개비까지, 실제로 필요한 돈을 같이 계산해줄게</CoachTip
        >
      </button>

      <QuestionCard
        v-if="step === 'CONFIRM'"
        question="오픈뱅킹으로 조회한 월 평균 소득이에요. 맞나요?"
      >
        <div class="border-line rounded-field flex flex-col gap-1 border p-4">
          <span class="text-micro text-ink-muted">월 평균 소득</span>
          <span class="text-numeric text-ink-hero">
            약 {{ formatKoreanMoney(summary?.averageMonthlyNetIncome) }}
          </span>
        </div>

        <PillGroup
          v-model="useOpenBanking"
          :options="[
            { value: 'OPEN_BANKING', label: '맞아요' },
            { value: 'MANUAL', label: '아니에요, 직접 입력할게요' },
          ]"
        />
      </QuestionCard>

      <QuestionCard v-else-if="step === 'MANUAL'" question="아래 정보를 직접 입력해주세요">
        <p class="text-caption2 text-ink-hero-body">오픈뱅킹 조회값이 틀린 경우에만 사용해요</p>
        <AppInput
          v-model="income"
          label="월 평균 소득 (만 원)"
          type="tel"
          placeholder="숫자만 입력해주세요"
        />
        <AppInput
          v-model="assets"
          label="금융자산 (만 원)"
          type="tel"
          placeholder="숫자만 입력해주세요"
        />
        <AppInput
          v-model="availableCash"
          label="지금 쓸 수 있는 현금 (만 원)"
          type="tel"
          placeholder="계약금·잔금에 보탤 자기자금"
        />
        <div class="flex flex-col gap-2">
          <span class="text-caption2 text-ink-hero-body">기존에 받은 전세자금대출이 있나요?</span>
          <PillGroup
            v-model="existingJeonseLoan"
            :options="[
              { value: 'YES', label: '있어요' },
              { value: 'NO', label: '없어요' },
            ]"
          />

          <div
            v-if="existingJeonseLoan === 'NO'"
            class="border-line rounded-field flex flex-col gap-1.5 border p-3.5"
          >
            <AppCheckbox v-model="prohibitedLoanConfirmed">
              세대원의 기금대출과 배우자의 전세·주택담보대출도 없는 것을 확인했어요
            </AppCheckbox>
            <p class="text-caption2 text-ink-muted">
              버팀목은 본인 대출만으로 판단할 수 없어요. 체크하지 않아도 다음으로 넘어갈 수 있고,
              그때는 결과에서 은행 확인이 필요하다고 안내해드려요
            </p>
          </div>
        </div>
      </QuestionCard>

      <QuestionCard v-else-if="step === 'ASSETS'" question="보유한 순자산을 입력해주세요">
        <p class="text-caption2 text-ink-hero-body">
          예금·적금·투자 등에서 대출 같은 부채를 뺀 실제 순자산을 만 원 단위로 입력해주세요
        </p>
        <p
          v-if="summary?.totalAccountBalance !== null && summary?.totalAccountBalance !== undefined"
          class="text-caption2 text-ink-muted"
        >
          참고로 오픈뱅킹 계좌 잔액은 약 {{ formatKoreanMoney(summary.totalAccountBalance) }}
          예요. 잔액이 곧 순자산은 아니라 직접 확인해서 넣어주세요
        </p>
        <AppInput
          v-model="assets"
          label="순자산 (만 원)"
          type="tel"
          placeholder="숫자만 입력해주세요"
        />
        <AppInput
          v-model="availableCash"
          label="지금 쓸 수 있는 현금 (만 원)"
          type="tel"
          placeholder="계약금·잔금에 보탤 자기자금"
        />
        <div class="flex flex-col gap-2">
          <span class="text-caption2 text-ink-hero-body">기존에 받은 전세자금대출이 있나요?</span>
          <PillGroup
            v-model="existingJeonseLoan"
            :options="[
              { value: 'YES', label: '있어요' },
              { value: 'NO', label: '없어요' },
            ]"
          />

          <div
            v-if="existingJeonseLoan === 'NO'"
            class="border-line rounded-field flex flex-col gap-1.5 border p-3.5"
          >
            <AppCheckbox v-model="prohibitedLoanConfirmed">
              세대원의 기금대출과 배우자의 전세·주택담보대출도 없는 것을 확인했어요
            </AppCheckbox>
            <p class="text-caption2 text-ink-muted">
              버팀목은 본인 대출만으로 판단할 수 없어요. 체크하지 않아도 다음으로 넘어갈 수 있고,
              그때는 결과에서 은행 확인이 필요하다고 안내해드려요
            </p>
          </div>
        </div>
      </QuestionCard>

      <template v-else-if="step === 'DEPOSIT'">
        <QuestionCard question="희망하는 전세 보증금을 입력해주세요">
          <AppInput
            v-model="deposit"
            label="희망 보증금 (만 원)"
            type="tel"
            placeholder="숫자만 입력해주세요"
          />
        </QuestionCard>

        <div v-if="depositNotice" class="bg-surface border-line rounded-field border p-3.5">
          <p class="text-caption2 text-ink-hero-body font-medium">{{ depositNotice }}</p>
        </div>
      </template>

      <QuestionCard v-else question="어디에서 거주하고 싶으신가요?">
        <PillGroup
          v-model="regionId"
          :options="regions.map((region) => ({ value: String(region.id), label: region.name }))"
        />
        <p v-if="!regions.length" class="text-caption2 text-ink-muted">
          지역 목록을 불러오지 못했어요.
        </p>
      </QuestionCard>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <!-- 시안(1루 3)은 이전·다음을 하단 CTA 줄에 나란히 둔다. -->
    <footer class="px-gutter-tight flex shrink-0 gap-2.5 pt-2.5 pb-cta-pad">
      <div class="w-28 shrink-0">
        <AppButton variant="white" :disabled="pending" @click="back">이전</AppButton>
      </div>

      <div class="flex-1">
        <AppButton variant="strong" :disabled="!canProceed || pending" @click="next">
          {{ pending ? '저장 중…' : isLast ? '매칭 확인' : '다음' }}
        </AppButton>
      </div>
    </footer>
  </PhoneFrame>
</template>
