<script setup lang="ts">
import { usePolicyApi, type JeonsePolicyVerdicts, type PolicyVerdict } from '~/api/policy';
import { currentPlan } from '~/utils/currentPlan';
import { messageFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';

// 브라우저 탭 제목.
useHead({ title: '저장한 정책' });

/**
 * MY-02 저장함.
 *
 * 백엔드에 "즐겨찾기" 라는 개념이 없다. 대신 이 계획에서 나온 판정을 모아
 * 두고 **지금 쓸 수 있는 것만** 걸러 볼 수 있게 한다 — 저장함이 결국
 * "내가 챙겨야 할 정책 목록" 이라서다.
 *
 * 착수 마감일은 아직 데이터가 없어 줄을 만들지 않는다. 날짜 없이 "마감 임박"
 * 만 적으면 언제까지인지 모르는 채로 재촉만 하는 셈이다.
 */
definePageMeta({ middleware: 'auth' });

const planId = ref<number | null>(null);
const verdicts = ref<JeonsePolicyVerdicts | null>(null);
const pending = ref(true);
const error = ref('');

const onlyPossible = ref(false);

const BADGE: Record<
  PolicyVerdict,
  { tone: 'positive' | 'cautionary' | 'negative'; label: string }
> = {
  PASS: { tone: 'positive', label: '가능' },
  NEED_INFO: { tone: 'cautionary', label: '추가 확인' },
  FAIL: { tone: 'negative', label: '해당 없음' },
};

/** 한도와 금리를 한 줄로. 규격이 없는 정책은 줄 자체를 만들지 않는다. */
function benefitOf(policyCode: string) {
  const estimate = verdicts.value?.cards.find((card) => card.code === policyCode)?.estimate;
  if (!estimate?.recommendedDepositLimit && !estimate?.rateMin) return null;

  const parts: string[] = [];
  if (estimate.recommendedDepositLimit) {
    parts.push(`한도 ${formatKoreanMoney(estimate.recommendedDepositLimit)}`);
  }
  if (estimate.rateMin) parts.push(`금리 ${estimate.rateMin}%`);
  return parts.join(' · ');
}

/** 아직 못 본 조건. NEED_INFO 를 풀려면 이걸 채워야 한다. */
function blockingOf(policyCode: string) {
  const found = verdicts.value?.results.find((result) => result.policyCode === policyCode);
  if (!found) return null;
  const unknown = found.basis.filter((condition) => condition.isMet === null).map((c) => c.label);
  return unknown.length ? unknown.join(' · ') : null;
}

/** 떨어진 이유. 첫 하나만 보여주고 나머지는 결과 화면에서 본다. */
function rejectionOf(policyCode: string) {
  const found = verdicts.value?.results.find((result) => result.policyCode === policyCode);
  return found?.rejectionReasons[0]?.reasonLabel ?? null;
}

const rows = computed(() => {
  const results = verdicts.value?.results ?? [];
  return results
    .filter((result) => !onlyPossible.value || result.verdict === 'PASS')
    .map((result) => ({
      code: result.policyCode,
      name: result.policyName,
      badge: BADGE[result.verdict],
      benefit: benefitOf(result.policyCode),
      blocking: result.verdict === 'NEED_INFO' ? blockingOf(result.policyCode) : null,
      rejection: result.verdict === 'FAIL' ? rejectionOf(result.policyCode) : null,
    }));
});

onMounted(async () => {
  planId.value = await currentPlan.resolve();
  if (!planId.value) {
    pending.value = false;
    return;
  }

  try {
    verdicts.value = await usePolicyApi().evaluateJeonse(planId.value);
  } catch (cause) {
    error.value = messageFrom(cause, '저장한 정책을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <PhoneFrame>
    <StatusBar title="저장함" @back="navigateTo('/my')" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <div class="flex gap-2">
        <button
          v-for="option in [false, true]"
          :key="String(option)"
          type="button"
          class="rounded-pill text-label2 border px-3.5 py-2"
          :class="
            onlyPossible === option
              ? 'bg-primary-strong border-primary-strong text-white'
              : 'bg-surface border-line text-ink'
          "
          @click="onlyPossible = option"
        >
          {{ option ? '가능만' : '전체' }}
        </button>
      </div>

      <p v-if="pending" class="text-label2 text-ink-muted">저장한 정책을 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <AppCard v-else-if="!planId" radius="button">
        <p class="text-label2 text-ink-muted">아직 시작한 계획이 없어요.</p>
      </AppCard>

      <AppCard v-else-if="!rows.length" radius="button">
        <p class="text-label2 text-ink-muted">
          {{ onlyPossible ? '지금 바로 되는 정책이 없어요.' : '판정한 정책이 아직 없어요.' }}
        </p>
      </AppCard>

      <SectionCard v-for="row in rows" :key="row.code" :title="row.name">
        <template #badge>
          <AppBadge :tone="row.badge.tone">{{ row.badge.label }}</AppBadge>
        </template>

        <FactRow v-if="row.benefit" label="예상 혜택" :value="row.benefit" />
        <FactRow v-if="row.blocking" label="막고 있는 값" :value="row.blocking" tone="warn" />
        <FactRow v-if="row.rejection" label="안 되는 이유" :value="row.rejection" tone="bad" />
      </SectionCard>
    </div>
  </PhoneFrame>
</template>
