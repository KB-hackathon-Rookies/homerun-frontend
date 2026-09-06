<script setup lang="ts">
import type { LoanCard } from '~/api/policy';
import { formatKoreanMoney } from '~/utils/money';

/**
 * 매물 상세의 상품 한 줄.
 *
 * 이름과 한 줄 요약. 요약에 들어가는 **한도·금리는 판정 결과에서** 오고,
 * 상품 설명 표에서 오지 않는다 — 이 사람 · 이 매물로 계산된 값이라야 한다.
 */
const { card } = defineProps<{ card: LoanCard }>();

const summary = computed(() => {
  const estimate = card.estimate;
  if (!estimate) return card.notice;

  const parts: string[] = [];
  if (estimate.estimatedLoanAmount !== null) {
    parts.push(`한도 ${formatKoreanMoney(estimate.estimatedLoanAmount)}`);
  }
  if (estimate.rateMin !== null) {
    const rate =
      estimate.rateMax && estimate.rateMax !== estimate.rateMin
        ? `연 ${estimate.rateMin}~${estimate.rateMax}%`
        : `연 ${estimate.rateMin}%`;
    parts.push(rate);
  }
  if (estimate.monthlyInterestMin !== null) {
    parts.push(`월 이자 약 ${formatKoreanMoney(estimate.monthlyInterestMin)}`);
  }
  return parts.length ? parts.join(' · ') : card.notice;
});
</script>

<template>
  <div class="bg-surface border-line rounded-chip flex flex-col gap-1.5 border p-3">
    <div class="flex items-center gap-2">
      <span class="text-label2 text-ink-hero flex-1 font-bold">{{ card.name }}</span>
      <AppIcon name="chevron-right" class="text-ink-muted size-4 shrink-0" />
    </div>
    <p class="text-micro text-ink-hero-body">{{ summary }}</p>
  </div>
</template>
