<script setup lang="ts">
import { usePropertyApi, type PropertyPolicyVerdict } from '~/api/property';
import { useProperty } from '~/composables/useProperty';
import { messageFrom } from '~/utils/error';

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

const { property, fullAddress } = useProperty(planId, propertyId);
const verdicts = ref<PropertyPolicyVerdict[]>([]);
const pending = ref(true);
const error = ref('');

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
  try {
    const result = await usePropertyApi().policyVerdicts(planId, propertyId);
    verdicts.value = result.results;
  } catch (cause) {
    error.value = messageFrom(cause, '진단 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <PhoneFrame>
    <StageBar title="매물 등록" base="2루" @back="navigateTo(`/property/${planId}`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <p v-if="pending" class="text-label2 text-ink-muted">진단 결과를 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <template v-else>
        <AppCard v-if="property">
          <p class="text-label2 text-ink-muted font-medium">검색한 주소</p>
          <p class="text-body2 text-ink-hero mt-2.5 font-bold">{{ fullAddress }}</p>
        </AppCard>

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

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-6">
      <AppButton
        variant="strong"
        :disabled="pending || !!error"
        @click="navigateTo(`/property/${planId}/${propertyId}/violation`)"
      >
        STEP 3 위반건축물 확인하기
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
