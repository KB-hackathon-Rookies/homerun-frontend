<script setup lang="ts">
import { useAlternativeApi, type Cause, type RetryQueueItem } from '~/api/alternative';
import { usePlanApi } from '~/api/plan';
import { formatDotDate } from '~/utils/date';
import { messageFrom } from '~/utils/error';

/**
 * ST-02 적용 가능한 정책이 없습니다.
 *
 * 여기서 끝내지 않는다. 무엇 때문에 걸렸는지를 묶어 보여주고, 시간이 지나면
 * 다시 되는 것은 언제부터인지까지 같이 둔다.
 *
 * 판정은 규칙 버전에 매여 있다. 지침이 개정되면 다시 판정되므로, 지금 결과가
 * 영원한 답이 아니라는 말을 아래에 남긴다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const causes = ref<Cause[]>([]);
const retryable = ref<RetryQueueItem[]>([]);
const ruleVersion = ref<string | null>(null);
const pending = ref(true);
const error = ref('');

/** 같은 이유로 걸린 정책끼리 묶는다. 여섯 줄을 늘어놓으면 무엇이 진짜 벽인지 안 보인다. */
const grouped = computed(() => {
  const counts = new Map<string, number>();
  causes.value.forEach((cause) => {
    counts.set(cause.reasonLabel, (counts.get(cause.reasonLabel) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([label, count]) => ({ label, value: `${count}건` }));
});

onMounted(async () => {
  const api = useAlternativeApi();

  try {
    causes.value = await api.causes(planId);
  } catch (cause) {
    error.value = messageFrom(cause, '원인을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }

  api
    .retryQueue(planId)
    .then((items) => (retryable.value = items))
    .catch(() => {});

  usePlanApi()
    .get(planId)
    .then((plan) => (ruleVersion.value = plan.ruleVersion))
    .catch(() => {});
});
</script>

<template>
  <PhoneFrame>
    <StatusBar
      title="적용 가능한 정책이 없습니다"
      :badge="`${causes.length}건`"
      base="2루"
      @back="navigateTo(`/result/${planId}/match`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <p v-if="pending" class="text-label2 text-ink-muted">원인을 정리하는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <template v-else>
        <SectionCard title="모두 기준을 넘었습니다" tone="warn">
          <template #badge>
            <AppBadge tone="cautionary">{{ causes.length }}건 검토</AppBadge>
          </template>
          <FactRow
            v-for="group in grouped"
            :key="group.label"
            :label="group.label"
            :value="group.value"
            tone="bad"
          />
        </SectionCard>

        <!--
          다시 되는 날짜가 있는 것만 여기 온다. 없는 정책에 "기다리면 된다" 고
          적으면 근거 없는 위로가 된다.
        -->
        <SectionCard v-if="retryable.length" title="지금 할 수 있는 것">
          <RowStacked
            v-for="item in retryable"
            :key="item.policyCode"
            :label="item.policyName"
            :description="`${item.conditionLabel} · ${formatDotDate(item.eligibleFrom)}부터 · ${item.daysRemaining}일 남음`"
            @select="navigateTo(`/result/${planId}/match`)"
          />
        </SectionCard>

        <SectionCard v-else title="지금 할 수 있는 것">
          <p class="text-label2 text-ink-muted">
            기다리면 다시 되는 정책은 없어요. 조건을 바꿔 볼 수 있는지 결과 화면에서 확인해보세요.
          </p>
        </SectionCard>

        <p class="bg-surface-info rounded-cta text-label2 text-primary-strong px-3 py-2.5">
          현재 규칙 버전 {{ ruleVersion ?? '확인 중' }} 기준이에요. 지침이 개정되면 자동으로 다시
          판정합니다.
        </p>
      </template>
    </div>

    <footer class="px-gutter-tight bg-surface flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton @click="navigateTo(`/result/${planId}/match`)">판정 결과 보러 가기</AppButton>
    </footer>
  </PhoneFrame>
</template>
