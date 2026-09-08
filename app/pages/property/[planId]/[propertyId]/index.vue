<script setup lang="ts">
import { usePropertyApi, type PropertyPolicyVerdict, type PropertyStep } from '~/api/property';
import { useProperty } from '~/composables/useProperty';
import { messageFrom } from '~/utils/error';
import { propertyStepLabel, propertyStepRoute } from '~/utils/propertyStep';

/**
 * 2루 매물 진단 — 자동조회 판정.
 *
 * 등록하면서 건축물대장과 실거래를 이미 긁어 왔다. 여기서는 그 결과로
 * 상품마다 어떻게 됐는지만 보여준다. 사람이 할 일은 다음 단계부터다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

const { property, fullAddress, error: propertyError } = useProperty(planId, propertyId);
const verdicts = ref<PropertyPolicyVerdict[]>([]);
const pending = ref(true);
const error = ref('');

/**
 * 다음으로 갈 곳은 **서버가 정한다**.
 *
 * 자동조회가 주택유형·전용면적을 못 채우면 워크플로가 STEP 2(BUILDING)에 머물고,
 * 등기부까지 답한 매물은 이미 STEP 4 를 지나 있다. 어디쯤인지는 신호등으로도
 * 면적 값으로도 알 수 없어서 `resume` 이 준 단계를 그대로 표에 넣는다.
 *
 * 단계를 받기 전에는 `null` 이다. 그동안 하단 버튼이 잠겨 있어(`pending`) 아무 데도
 * 못 간다 — 예전처럼 기본값을 찍어 두면 그 값이 곧 잘못된 목적지가 된다.
 */
const step = ref<PropertyStep | null>(null);
const nextLabel = computed(() => (step.value ? propertyStepLabel(step.value) : '다음 단계로'));

function goNext() {
  if (!step.value) return;
  return navigateTo(propertyStepRoute(planId, propertyId, step.value));
}

/** "진행중 3개 · 불가 1개". 같은 판정끼리 세어 한 줄로 요약한다. */
const summary = computed(() => {
  const counts = { NEED_INFO: 0, FAIL: 0, PASS: 0 };
  verdicts.value.forEach((verdict) => (counts[verdict.status] += 1));

  return (
    [
      counts.PASS && `가능 ${counts.PASS}개`,
      counts.NEED_INFO && `진행중 ${counts.NEED_INFO}개`,
      counts.FAIL && `불가 ${counts.FAIL}개`,
    ]
      .filter(Boolean)
      .join(' · ') || '판정 없음'
  );
});

onMounted(async () => {
  const api = usePropertyApi();
  try {
    const [result, workflow] = await Promise.all([
      api.policyVerdicts(planId, propertyId),
      api.resume(planId, propertyId),
    ]);
    verdicts.value = result.results;
    step.value = workflow.currentStep;
  } catch (cause) {
    error.value = messageFrom(cause, '진단 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <StageShell title="매물 등록" base="2루" @back="navigateTo(`/property/${planId}`)">

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>매물 고르기 전에 미리 거를 수 있어. 여기 자동조회 판정부터 보고 시작하자</CoachTip>

      <!--
        주소는 판정과 따로 온다. 판정을 못 받아도 어느 집 이야기인지는
        보여야 한다 — 다시 시도할지 뒤로 갈지를 그걸 보고 정한다.
      -->
      <AppCard v-if="property">
        <p class="text-label2 text-ink-muted font-medium">검색한 주소</p>
        <p class="text-body2 text-ink-hero mt-2.5 font-bold">{{ fullAddress }}</p>
      </AppCard>
      <p v-else-if="propertyError" class="text-label2 text-danger">{{ propertyError }}</p>

      <p v-if="pending" class="text-label2 text-ink-muted">진단 결과를 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <template v-else>
        <AppCard class="flex flex-col gap-2.5">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-option text-ink-hero">자동조회 판정</h2>
            <span class="text-caption2 text-ink-muted shrink-0 font-medium">{{ summary }}</span>
          </div>

          <div class="bg-line h-px" />

          <VerdictRow
            v-for="verdict in verdicts"
            :key="verdict.policyCode ?? verdict.policyName ?? ''"
            :verdict="verdict"
          />
        </AppCard>
      </template>
    </div>

    <StepFooter
      :disabled="pending || !!error || !step"
      @back="navigateTo(`/property/${planId}`)"
      @next="goNext"
    >
      {{ nextLabel }}
    </StepFooter>
  </StageShell>
</template>
