<script setup lang="ts">
import type { PillOption } from '~/components/prep/PillGroup.vue';
import { usePlanApi, type LeaseType, type PlanResponse } from '~/api/plan';
import { parseManwon } from '~/utils/amount';
import { currentPlan } from '~/utils/currentPlan';
import { messageFrom } from '~/utils/error';

// 브라우저 탭 제목.
useHead({ title: '준비 중' });

/**
 * 독립 준비 문진(시안 벤치 1~4).
 *
 * 껍데기가 셋 다 같다 — 상단 바 · 진행 표시 · 질문 · 하단 버튼. 가운데 답할 것만
 * 다르다. 그래서 파일을 셋으로 쪼개지 않고 한 화면에서 단계를 넘긴다. 답이 쌓여야
 * 하고 뒤로 가기도 자연스럽게 붙는다.
 *
 * 순서는 상황 → 전세·월세 → 보증금 이다. 보증금은 지금 월세에 살고 있는 사람에게만
 * 묻는다 — 부모님과 사는 사람에게는 지금 걸린 보증금이 없다. 그래서 진행 표시의
 * 단계 수도 답에 따라 셋에서 둘로 줄어든다.
 *
 * 플랜은 임대차 유형(`leaseType`)이 생성 파라미터다. 월세 경로는 아직 없어서
 * 고르면 준비 중 안내를 띄우고 되돌린다 — 알약은 보여주되 월세 플랜은 끝내
 * 만들어지지 않는다. 전세 판정에서 400 이 나던 경로는 그대로 막혀 있다.
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

const LEASES: PillOption[] = [
  { value: 'JEONSE', label: '전세' },
  { value: 'WOLSE', label: '월세' },
];

const STEP_LABELS = ['독립 상황', '전세·월세', '보증금'] as const;

const situation = ref<Situation | null>(null);
const lease = ref<string | null>(null);
const deposit = ref('');

const step = ref(0);
const pending = ref(false);
const error = ref('');

/** 월세 준비 중 안내. 알약을 고르면 열린다. */
const wolseNotice = ref(false);
/**
 * 이 화면에서 만든 계획.
 *
 * 저장은 계획 생성 · 입력 저장 · 준비 완료 세 번에 걸쳐 일어난다. 뒤쪽에서 한 번
 * 실패하면 사용자는 다음을 다시 누르는데, 그때 계획을 또 만들면 안 된다 — 실패할
 * 때마다 빈 계획이 하나씩 쌓이고, `GET /plans/active` 는 가장 최근 것을 주므로
 * 원래 쓰던 계획이 가려진다. 한 번 만든 계획을 들고 있다가 재시도 때 이어 쓴다.
 */
const created = ref<PlanResponse | null>(null);

/*
 * 앞선 시도가 계획을 만든 뒤에 끊겼으면 그 계획을 이어 쓴다.
 *
 * 같은 화면 안에서의 재시도는 `created` 가 막아 준다. 그런데 새로고침하거나 화면을
 * 나갔다 오면 그 기억이 사라져서, 다시 문진을 마치는 순간 계획이 하나 더 생긴다.
 * 서버 `create` 에는 중복 방지가 없어 부르는 대로 만들고, `GET /plans/active` 는
 * 가장 최근 것을 주므로 **앞서 만든 계획이 그대로 가려진다.**
 *
 * 벤치에 남아 있는 계획만 이어 쓴다. 진단을 이미 시작한 계획까지 여기서 집어 오면
 * 새로 시작하려던 사람의 계획을 덮어쓰게 된다.
 */
onMounted(async () => {
  try {
    const active = await usePlanApi().getActive();
    if (active.stage === 'BENCH') created.value = active;
  } catch {
    // 진행 중인 계획이 없으면 404 다. 그때는 새로 만드는 게 맞다.
  }
});

/** 처음 독립하면 보증금 질문이 의미가 없다. */
const asksDeposit = computed(() => situation.value === 'RENTING');
/*
 * 아직 안 골랐으면 셋 다 보여준다(시안 벤치 1). 처음 독립하는 사람만 보증금을
 * 건너뛰므로, 그걸 고른 순간 둘로 줄어든다.
 */
const steps = computed(() => (situation.value === 'FIRST' ? STEP_LABELS.slice(0, 2) : STEP_LABELS));
const lastStep = computed(() => steps.value.length - 1);

const TITLES = [
  '어떤 상황에서 독립을 준비하고 있나요?',
  '전세로 진행하시나요, 월세로 진행하시나요?',
  '현재 월세 보증금이 얼마인가요?',
] as const;

/** `noUncheckedIndexedAccess` 때문에 색인 접근이 undefined 를 물고 온다. 여기서 털어낸다. */
const title = computed(() => TITLES[step.value] ?? '');

/**
 * 검사한 뒤에 단위를 바꾼다. 숫자가 아닌 글자를 지워서 값을 만들면 `abc` 가 0원이 되고
 * `-100` 이 100만 원으로 뒤집힌다.
 */
const parsedDeposit = computed(() => parseManwon(deposit.value));
const depositAmount = computed(() => parsedDeposit.value.value ?? 0);

const canProceed = computed(() => {
  if (step.value === 0) return !!situation.value;
  // 월세를 고른 채로는 넘어가지 않는다. 준비 중 안내가 전세로 되돌릴 때까지 막는다.
  if (step.value === 1) return lease.value === 'JEONSE';
  // 형식이 틀린 보증금은 채워진 것이 아니다. 그대로 두면 0원으로 저장된다.
  return !!deposit.value && !parsedDeposit.value.error;
});

function chooseLease(value: string | null) {
  lease.value = value;
  if (value === 'WOLSE') wolseNotice.value = true;
}

/** 준비 중 안내에서 전세로 되돌린다. */
function fallBackToJeonse() {
  lease.value = 'JEONSE';
  wolseNotice.value = false;
}

async function next() {
  if (!canProceed.value || pending.value) return;
  if (step.value < lastStep.value) {
    step.value += 1;
    return;
  }
  await submit();
}

function back() {
  if (step.value === 0) {
    navigateTo('/');
    return;
  }
  step.value -= 1;
}

async function submit() {
  const { create, saveInput, profilePrefill, completeStep } = usePlanApi();

  pending.value = true;
  error.value = '';
  try {
    // 여기까지 오면 전세다. 월세는 앞 단계에서 막힌다.
    const leaseType: LeaseType = 'JEONSE';
    // 앞선 시도에서 이미 만들었으면 그걸 쓴다. 재시도가 계획을 새로 만들지 않게 한다.
    const plan = (created.value ??= await create(leaseType));
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
      ...(asksDeposit.value ? { currentDeposit: depositAmount.value } : {}),
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
  <PhoneFrame fill>
    <div class="h-statusbar bg-surface shrink-0" />
    <BrandBar bordered />

    <div class="px-gutter-tight flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-4">
      <SubStep :steps="steps" :current="step" />

      <div class="flex flex-col gap-4">
        <p class="text-overline text-ink-label">독립 준비</p>
        <h1 class="text-question text-ink-card">{{ title }}</h1>
      </div>

      <div v-if="step === 0" class="flex flex-col gap-3">
        <ChoiceOption
          v-for="option in SITUATIONS"
          :key="option.value"
          :title="option.title"
          :description="option.description"
          :selected="situation === option.value"
          @click="situation = option.value"
        />
      </div>

      <template v-else-if="step === 1">
        <PillGroup
          :model-value="lease"
          :options="LEASES"
          variant="block"
          @update:model-value="chooseLease"
        />

        <div class="bg-canvas-soft rounded-field p-4">
          <p class="text-caption2 text-ink-card-body">
            이미 진행 중인 계약이 있다면 목록으로 보여드리고, 새로 시작하시는 거라면 바로 1루로
            안내해드려요
          </p>
        </div>
      </template>

      <AppInput
        v-else
        v-model="deposit"
        label="현재 보증금"
        type="tel"
        placeholder="금액을 입력해 주세요"
        :error="parsedDeposit.error ?? ''"
      />

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <footer class="px-gutter-tight border-line pt-2.5 pb-cta-pad flex shrink-0 gap-2.5 border-t">
      <!-- 첫 단계에는 돌아갈 앞 질문이 없다. 나가려면 상단 바의 홈을 쓴다. -->
      <div v-if="step > 0" class="w-29 shrink-0">
        <AppButton variant="white" :disabled="pending" @click="back">이전</AppButton>
      </div>
      <AppButton variant="strong" :disabled="!canProceed || pending" @click="next">
        {{ pending ? '저장 중…' : '다음' }}
      </AppButton>
    </footer>

    <DimOverlay v-if="wolseNotice" placement="center" @close="wolseNotice = false">
      <PreparingNotice
        title="월세 경로는 준비 중이에요"
        body="지금은 전세 경로만 도와드릴 수 있어요. 청년월세 특별지원과 세액공제 안내는 곧 열려요"
        link-label="전세로 진행하기"
        @link="fallBackToJeonse"
      />
    </DimOverlay>
  </PhoneFrame>
</template>
