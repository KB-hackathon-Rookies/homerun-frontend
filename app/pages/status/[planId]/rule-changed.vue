<script setup lang="ts">
import { usePlanApi } from '~/api/plan';
import { usePolicyApi, type PolicyVerdictDetail } from '~/api/policy';
import { formatDotDate } from '~/utils/date';
import { messageFrom } from '~/utils/error';

// 브라우저 탭 제목.
useHead({ title: '규정 변경 안내' });

/**
 * ST-04 판정을 다시 계산해야 합니다.
 *
 * 지침이 개정되면 규칙 버전이 올라간다. 이전 버전으로 낸 판정은 참고용이
 * 되는데, 그렇다고 준비하던 것이 무효가 되지는 않는다 — **무엇이 남고 무엇이
 * 흔들리는지**를 나눠서 말한다.
 *
 * 이미 제출한 신청은 접수 시점 기준이라 영향을 받지 않는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const planRuleVersion = ref<string | null>(null);
const results = ref<PolicyVerdictDetail[]>([]);
const pending = ref(true);
const recalculating = ref(false);
const error = ref('');

/** 판정에 쓴 버전 중 가장 낮은 것. 이게 "이전 기준" 이다. */
const judgedVersion = computed(() => {
  const versions = results.value.map((result) => result.ruleVersion).filter(Boolean) as number[];
  return versions.length ? `v${Math.min(...versions)}` : null;
});

/** 계획의 규칙 버전과 다른 판정 수. 이만큼이 다시 계산된다. */
const affected = computed(() => {
  const current = judgedVersion.value;
  if (!current) return results.value.length;
  const highest = Math.max(...results.value.map((r) => r.ruleVersion ?? 0));
  return results.value.filter((result) => (result.ruleVersion ?? 0) < highest).length;
});

async function recalculate() {
  if (recalculating.value) return;
  recalculating.value = true;
  try {
    await usePolicyApi().evaluateJeonse(planId);
    await navigateTo(`/result/${planId}/match`);
  } catch (cause) {
    error.value = messageFrom(cause, '다시 판정하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    recalculating.value = false;
  }
}

onMounted(async () => {
  try {
    const verdicts = await usePolicyApi().evaluateJeonse(planId);
    results.value = verdicts.results;
  } catch (cause) {
    error.value = messageFrom(cause, '판정 이력을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }

  usePlanApi()
    .get(planId)
    .then((plan) => (planRuleVersion.value = plan.ruleVersion))
    .catch(() => {});
});
</script>

<template>
  <PhoneFrame>
    <StatusBar
      title="판정을 다시 계산해야 합니다"
      badge="규칙 변경"
      base="2루"
      @back="navigateTo(`/result/${planId}/match`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <p v-if="pending" class="text-label2 text-ink-muted">판정 이력을 확인하는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <template v-else>
        <SectionCard title="지침이 개정되었습니다" tone="warn">
          <template #badge>
            <AppBadge tone="cautionary">{{ planRuleVersion ?? '최신' }}</AppBadge>
          </template>
          <FactRow label="이전 판정 기준" :value="judgedVersion ?? '기록 없음'" />
          <FactRow label="영향 받는 판정" :value="`${affected}건`" tone="warn" />
        </SectionCard>

        <!-- 흔들리는 것과 그대로인 것을 나눈다. 다 흔들린다고 하면 준비를 멈춘다. -->
        <SectionCard title="재판정 전까지">
          <FactRow label="표시되는 판정" value="이전 버전 결과 · 참고용" tone="warn" />
          <FactRow label="준비 항목" value="그대로 유지" tone="good" />
          <FactRow label="제출한 신청" value="영향 없음 · 접수 시점 기준" tone="good" />
        </SectionCard>

        <p class="text-caption1 text-ink-muted">
          기준일 {{ formatDotDate(new Date().toISOString()) }}
        </p>
      </template>
    </div>

    <footer class="px-gutter-tight bg-surface flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton :disabled="recalculating" @click="recalculate">
        {{ recalculating ? '다시 판정하는 중…' : '지금 다시 판정' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
