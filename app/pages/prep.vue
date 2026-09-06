<script setup lang="ts">
import { usePlanApi, type LeaseType } from '~/api/plan';
import { messageFrom } from '~/utils/error';

/**
 * 독립 준비 문진 3단계.
 *
 * 껍데기가 셋 다 같다 — 상단 바 · 카드 · 하단 버튼. 카드 안 질문만 다르다.
 * 그래서 파일을 셋으로 쪼개지 않고 한 화면에서 단계를 넘긴다. 답이 쌓여야
 * 하고 뒤로 가기도 자연스럽게 붙는다.
 *
 * 마지막 답(전세·월세)이 나와야 플랜을 만들 수 있다. `leaseType` 이 생성
 * 파라미터라서다. 그래서 세 답을 모아 두었다가 끝에서 한 번에 보낸다.
 *
 * 처음 독립하는 사람에게는 지금 걸린 보증금이 없다. 그 경우 2단계를 건너뛴다.
 */
definePageMeta({ middleware: 'auth' });

const SITUATIONS = [
  {
    value: 'FIRST',
    title: '처음 독립해요',
    description: '부모님과 함께 살고 있으며 처음으로 자취를 시작해요',
  },
  {
    value: 'RENTING',
    title: '현재 월세 주거인가요?',
    description: '현재 원룸 등에 거주하고 있으며 계약 만료 등으로 새로운 집을 구해요',
  },
] as const;

type Situation = (typeof SITUATIONS)[number]['value'];

const LEASE_OPTIONS = [
  { value: 'JEONSE', label: '전세' },
  { value: 'WOLSE', label: '월세' },
];

const situation = ref<Situation | null>(null);
const deposit = ref('');
const leaseType = ref<string | null>(null);

const step = ref(0);
const pending = ref(false);
const error = ref('');

/** 처음 독립하면 보증금 질문이 의미가 없다. */
const skipsDeposit = computed(() => situation.value === 'FIRST');
const lastStep = computed(() => (skipsDeposit.value ? 1 : 2));

const canProceed = computed(() => {
  if (step.value === 0) return !!situation.value;
  if (step.value === 1 && !skipsDeposit.value) return !!deposit.value;
  return !!leaseType.value;
});

/** 숫자만 남긴다. "3,000" 처럼 쳐도 받는다. */
const depositAmount = computed(() => Number(deposit.value.replace(/\D/g, '')) || 0);

async function next() {
  if (!canProceed.value || pending.value) return;
  if (step.value < lastStep.value) {
    step.value += skipsDeposit.value && step.value === 0 ? 2 : 1;
    return;
  }
  await submit();
}

function back() {
  if (step.value === 0) {
    navigateTo('/');
    return;
  }
  step.value -= skipsDeposit.value && step.value === 2 ? 2 : 1;
}

async function submit() {
  const { create, saveInput } = usePlanApi();

  pending.value = true;
  error.value = '';
  try {
    const plan = await create(leaseType.value as LeaseType);
    await saveInput(plan.id, {
      livesApartFromParents: situation.value === 'RENTING',
      ...(skipsDeposit.value ? {} : { currentDeposit: depositAmount.value }),
    });
    await navigateTo('/onboarding', { replace: true });
  } catch (cause) {
    error.value = messageFrom(cause, '저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />

    <header
      class="h-topbar px-gutter-tight border-line bg-surface flex shrink-0 items-center gap-2.5 border-b"
    >
      <button type="button" class="text-ink -ml-1 p-1" aria-label="뒤로" @click="back">
        <AppIcon name="chevron-left" class="size-icon" />
      </button>
      <h1 class="text-headline2 text-ink-hero">독립 준비</h1>
    </header>

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 p-4">
      <QuestionCard v-if="step === 0" question="어떤 상황에서 독립을 준비하고 있나요?">
        <ChoiceOption
          v-for="option in SITUATIONS"
          :key="option.value"
          :title="option.title"
          :description="option.description"
          :selected="situation === option.value"
          @click="situation = option.value"
        />
      </QuestionCard>

      <QuestionCard v-else-if="step === 1" question="현재 월세 보증금이 얼마인가요?">
        <AppInput v-model="deposit" label="보증금" type="tel" placeholder="숫자만 입력해주세요" />
      </QuestionCard>

      <template v-else>
        <QuestionCard question="전세로 진행하시나요, 월세로 진행하시나요?">
          <PillGroup v-model="leaseType" :options="LEASE_OPTIONS" />
        </QuestionCard>

        <div class="bg-surface border-line rounded-field border p-4">
          <p class="text-caption2 text-ink-hero-body">
            이미 진행 중인 계약이 있다면 목록으로 보여드리고, 새로 시작하시는 거라면 바로 1루로
            안내해드려요
          </p>
        </div>
      </template>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-6">
      <AppButton variant="deep" :disabled="!canProceed || pending" @click="next">
        {{ pending ? '저장 중…' : '다음' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
