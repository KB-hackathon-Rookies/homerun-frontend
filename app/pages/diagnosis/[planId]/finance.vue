<script setup lang="ts">
import { useOpenBankingApi, type FinancialSummary } from '~/api/openbanking';
import type { DiagnosisStep, DiagnosisStepPatch } from '~/api/plan';
import { useRegionApi, type RegionOption } from '~/api/region';
import { useInputRevision } from '~/composables/useInputRevision';
import { messageFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';

/**
 * 1루 추가 정보 입력.
 *
 * 앞 문진과 껍데기가 같아서 여기도 한 화면에서 단계를 넘긴다. 다만 단계가
 * 갈린다 — 오픈뱅킹 조회값이 맞으면 직접 입력을 건너뛴다.
 *
 * 조회값을 그대로 쓸 때와 사용자가 고쳤을 때를 출처로 구분해 보낸다. 나중에
 * 판정이 틀렸을 때 어느 값을 믿고 계산했는지 알 수 있어야 한다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const STEPS = ['CONFIRM', 'MANUAL', 'DEPOSIT', 'REGION'] as const;
type Step = (typeof STEPS)[number];

const step = ref<Step>('CONFIRM');
const { load, saveStep } = useInputRevision(planId);
const pending = ref(false);
const error = ref('');

/** 오픈뱅킹 조회값. 못 가져오면 바로 직접 입력으로 보낸다. */
const summary = ref<FinancialSummary | null>(null);
const regions = ref<RegionOption[]>([]);

const useOpenBanking = ref<string | null>(null);
const income = ref('');
const assets = ref('');
const deposit = ref('');
const regionId = ref<string | null>(null);

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
    // 지역 목록은 4단계에서야 쓴다. 여기서 막지 않는다.
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
  if (step.value === 'MANUAL') return !!income.value && !!assets.value;
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
      await save('FINANCIAL', {
        monthlyIncome: summary.value?.averageMonthlyNetIncome ?? undefined,
        netAssets: summary.value?.totalAccountBalance ?? undefined,
        incomeSource: 'OPEN_BANKING',
        assetSource: 'OPEN_BANKING',
        financialDataConfirmed: true,
        unknownFields: ['AVAILABLE_CASH'],
      });
      step.value = 'DEPOSIT';
      return;
    }

    if (step.value === 'MANUAL') {
      await save('FINANCIAL', {
        monthlyIncome: toWon(income.value),
        netAssets: toWon(assets.value),
        incomeSource: 'MANUAL',
        assetSource: 'MANUAL',
        financialDataConfirmed: true,
        unknownFields: ['AVAILABLE_CASH'],
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
    await navigateTo(`/result/${planId}/match`);
  } catch (cause) {
    error.value = messageFrom(cause, '저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
}

function back() {
  const at = STEPS.indexOf(step.value);
  if (at <= 0) {
    navigateTo(`/diagnosis/${planId}`);
    return;
  }
  // 조회값을 그대로 쓴 사람은 직접 입력을 지나온 적이 없다.
  if (step.value === 'DEPOSIT' && useOpenBanking.value !== 'MANUAL') {
    step.value = 'CONFIRM';
    return;
  }
  step.value = STEPS[at - 1]!;
}
</script>

<template>
  <PhoneFrame>
    <StageBar title="사용자 정보 입력" base="1루" @back="back" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 p-4">
      <CoachTip>보증금 말고도 이사비·중개비까지, 실제로 필요한 돈을 같이 계산해줄게</CoachTip>

      <QuestionCard v-if="step === 'CONFIRM'" question="오픈뱅킹으로 조회한 정보예요. 맞나요?">
        <div class="border-line rounded-field flex gap-8 border p-4">
          <span class="flex flex-col gap-1">
            <span class="text-micro text-ink-muted">금융자산</span>
            <span class="text-numeric text-ink-hero">
              약 {{ formatKoreanMoney(summary?.totalAccountBalance) }}
            </span>
          </span>
          <span class="flex flex-col gap-1">
            <span class="text-micro text-ink-muted">월 평균 소득</span>
            <span class="text-numeric text-ink-hero">
              약 {{ formatKoreanMoney(summary?.averageMonthlyNetIncome) }}
            </span>
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

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton variant="strong" :disabled="!canProceed || pending" @click="next">
        {{ pending ? '저장 중…' : isLast ? '스펙 매칭 확인하러 가기' : '다음' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
