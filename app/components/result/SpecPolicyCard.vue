<script setup lang="ts">
import type { LoanCard } from '~/api/policy';
import { specBadge } from '~/components/result/badge';
import { formatKoreanMoney } from '~/utils/money';

/**
 * 1-4 내 스펙 카드.
 *
 * 같은 카드를 금액으로 다시 본다. 한도만 크게 띄우면 "빌릴 수 있는 돈" 으로
 * 읽히는데, 실제로 부딪히는 벽은 **보증금에서 대출을 뺀 나머지를 내가 낼 수
 * 있느냐**다. 그래서 한도 아래에 필요한 돈 · 내 돈 · 차액을 나란히 둔다.
 */
const { card } = defineProps<{ card: LoanCard }>();

const badge = computed(() => specBadge(card));
const short = computed(() => (card.ownFundsShortfall ?? 0) > 0);

/** 모자라지 않으면 0 원이다. 모자라면 음수로 적어 부족분을 그대로 드러낸다. */
const gap = computed(() =>
  card.ownFundsShortfall === null ? null : -Math.abs(card.ownFundsShortfall),
);

/**
 * 금리는 범위로 온다. 담보 방식과 우대 항목이 은행에서 정해지기 때문이다.
 * 위아래가 같으면 한 값으로 접는다.
 */
const rateText = computed(() => {
  const { rateMin, rateMax } = card.estimate ?? {};
  if (rateMin === null || rateMin === undefined) return null;
  return rateMax && rateMax !== rateMin ? `연 ${rateMin}~${rateMax}%` : `연 ${rateMin}%`;
});

const interestText = computed(() => {
  const { monthlyInterestMin, monthlyInterestMax } = card.estimate ?? {};
  if (monthlyInterestMin === null || monthlyInterestMin === undefined) return null;
  if (monthlyInterestMax && monthlyInterestMax !== monthlyInterestMin) {
    // 아래쪽 단위는 떼고 붙인다 — "29만원~33만원" 보다 "29만~33만원" 이 읽힌다.
    const low = formatKoreanMoney(monthlyInterestMin).replace(/원$/, '');
    return `${low}~${formatKoreanMoney(monthlyInterestMax)}`;
  }
  return formatKoreanMoney(monthlyInterestMin);
});
</script>

<template>
  <AppCard class="flex flex-col gap-2.5">
    <PolicyCardHead :title="card.name" :badge="badge" />

    <template v-if="card.estimate">
      <p class="text-caption2 text-ink-muted">
        최대 대출 가능액
        <span v-if="card.estimate.recommendedDepositLimit">
          (보증금 한도 {{ formatKoreanMoney(card.estimate.recommendedDepositLimit) }} 이하)
        </span>
      </p>

      <p class="text-title2" :class="short ? 'text-ink-hero' : 'text-primary-strong'">
        {{ formatKoreanMoney(card.estimate.estimatedLoanAmount) }}
      </p>

      <div class="bg-surface-brand rounded-chip flex flex-col gap-1.5 p-3">
        <div class="flex items-center justify-between">
          <span class="text-caption2 text-ink-hero-body">필요한 돈</span>
          <span class="text-numeric text-ink-hero">
            {{ formatKoreanMoney(card.estimate.ownFundsRequired) }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-caption2 text-ink-hero-body">내 돈</span>
          <span class="text-numeric text-ink-hero">
            {{ formatKoreanMoney(card.availableCash) }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-caption2 text-ink-hero-body">차액</span>
          <span class="text-numeric" :class="short ? 'text-danger' : 'text-ink-hero'">
            {{ formatKoreanMoney(gap) }}
          </span>
        </div>
      </div>

      <p v-if="rateText" class="text-caption2 text-ink-hero-body font-medium">
        예상 금리 {{ rateText }}<span v-if="interestText"> · 월 이자 약 {{ interestText }}</span>
      </p>

      <div
        v-if="card.estimate.recommendedDepositLimit"
        class="bg-surface-info rounded-chip flex flex-col gap-1.5 p-3"
      >
        <p class="text-caption2 text-ink-hero">💡 매물 구할 때 꿀팁!</p>
        <p class="text-micro text-ink-hero-body">
          · 보증금 {{ formatKoreanMoney(card.estimate.recommendedDepositLimit) }} 이하
        </p>
      </div>
    </template>

    <p v-else class="text-label2 text-ink-hero-body">{{ card.notice }}</p>
  </AppCard>
</template>
