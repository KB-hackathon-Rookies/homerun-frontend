<script setup lang="ts">
import { usePlanApi, type LeaseType, type PlanResponse } from '~/api/plan';
import { currentPlan } from '~/utils/currentPlan';
import { messageFrom } from '~/utils/error';

/**
 * 독립 준비 문진 3단계.
 *
 * 껍데기가 셋 다 같다 — 상단 바 · 카드 · 하단 버튼. 카드 안 질문만 다르다.
 * 그래서 파일을 셋으로 쪼개지 않고 한 화면에서 단계를 넘긴다. 답이 쌓여야
 * 하고 뒤로 가기도 자연스럽게 붙는다.
 *
 * 플랜은 임대차 유형(`leaseType`)이 생성 파라미터다. 이번 대회는 전세 전용이라
 * 월세는 선택지에서 빼고 전세(`JEONSE`)로 고정한다 — 월세 플랜이 만들어져 전세
 * 판정에서 400 이 나던 경로 자체를 없앤다. 나머지 답은 모아 두었다가 끝에서 함께 보낸다.
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

/** 이번 대회는 전세 전용이라 임대차 유형을 전세로 고정한다. 월세는 노출하지 않는다. */
const LEASE_TYPE: LeaseType = 'JEONSE';

const situation = ref<Situation | null>(null);
const deposit = ref('');

const step = ref(0);
const pending = ref(false);
const error = ref('');

/**
 * 이 화면에서 만든 계획.
 *
 * 저장은 계획 생성 · 입력 저장 · 준비 완료 세 번에 걸쳐 일어난다. 뒤쪽에서 한 번
 * 실패하면 사용자는 다음을 다시 누르는데, 그때 계획을 또 만들면 안 된다 — 실패할
 * 때마다 빈 계획이 하나씩 쌓이고, `GET /plans/active` 는 가장 최근 것을 주므로
 * 원래 쓰던 계획이 가려진다. 한 번 만든 계획을 들고 있다가 재시도 때 이어 쓴다.
 */
const created = ref<PlanResponse | null>(null);

/** 처음 독립하면 보증금 질문이 의미가 없다. */
const skipsDeposit = computed(() => situation.value === 'FIRST');
const lastStep = computed(() => (skipsDeposit.value ? 1 : 2));

const canProceed = computed(() => {
  if (step.value === 0) return !!situation.value;
  if (step.value === 1 && !skipsDeposit.value) return !!deposit.value;
  return true;
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
  const { create, saveInput, profilePrefill, completeStep } = usePlanApi();

  pending.value = true;
  error.value = '';
  try {
    // 앞선 시도에서 이미 만들었으면 그걸 쓴다. 재시도가 계획을 새로 만들지 않게 한다.
    const plan = (created.value ??= await create(LEASE_TYPE));
    // 홈이 이 번호로 대시보드를 읽는다. 캐시로 적어 두고, 없으면 서버에서 되살린다.
    currentPlan.set(plan.id);

    /*
     * 가입 때 받아 둔 생년월일을 진단 입력에 실어 정책 연령 조건까지 전달한다.
     * `PUT /input` 은 스냅샷을 통째로 덮으므로 다른 값이 아직 없는 지금 함께 보낸다.
     * 확정된 값(가입·저장)만 쓰고, 모름·미입력이나 병역처럼 회원 정보에 없을 수
     * 있는 값은 임의로 확정하지 않는다.
     */
    let birthDate: string | undefined;
    try {
      const prefill = await profilePrefill(plan.id);
      if (
        prefill.birthDate.value &&
        (prefill.birthDate.source === 'MEMBER_PROFILE' ||
          prefill.birthDate.source === 'SAVED_INPUT')
      ) {
        birthDate = prefill.birthDate.value;
      }
    } catch {
      // 프로필을 못 읽어도 진단은 진행한다. 생년월일은 뒤 단계에서 다시 받을 수 있다.
    }

    await saveInput(plan.id, {
      livesApartFromParents: situation.value === 'RENTING',
      ...(birthDate ? { birthDate } : {}),
      ...(skipsDeposit.value ? {} : { currentDeposit: depositAmount.value }),
    });

    /*
     * 준비 완료를 서버 진행 상태에 반영한다(BENCH → BENCH_ONBOARDING 완료).
     * 이걸 부르지 않으면 계획이 BENCH 에 남아, 진단을 진행해도 대시보드 단계·홈
     * 이어하기와 화면이 어긋난다. 서버가 완료를 승인한 뒤에 진단으로 넘어간다.
     */
    if (!plan.ruleVersion) throw new Error('계획 규칙 버전을 확인할 수 없어요.');
    await completeStep(plan.id, 'BENCH_ONBOARDING', plan.ruleVersion);

    await navigateTo(`/diagnosis/${plan.id}`, { replace: true });
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
        <QuestionCard question="전세로 진행할게요">
          <p class="text-label2 text-ink-hero-body">
            지금은 전세 계약을 기준으로 안내해드려요. 월세는 아직 준비 중이라, 전세로 이어서
            도와드릴게요.
          </p>
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

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton variant="strong" :disabled="!canProceed || pending" @click="next">
        {{ pending ? '저장 중…' : '다음' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
