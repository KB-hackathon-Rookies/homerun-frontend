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

/** `계산 근거` 칩. 시안 1루 5 는 이 칩으로 계산 근거 코치 시트를 연다. */
defineEmits<{ basis: [] }>();

const badge = computed(() => specBadge(card));
const short = computed(() => (card.ownFundsShortfall ?? 0) > 0);

/**
 * 차액.
 *
 * 부호만 붙이면 "-2,400만원" 이 무슨 뜻인지 한 번 더 생각해야 한다. 시안처럼
 * **부족·여유를 말로 붙인다** — 색만으로 알리지 않는 것과 같은 이유다.
 */
const gapText = computed(() => {
  const shortfall = card.ownFundsShortfall;
  if (shortfall === null || shortfall === undefined) return null;
  if (shortfall > 0) return `${formatKoreanMoney(shortfall)} 부족`;
  return shortfall < 0 ? `${formatKoreanMoney(-shortfall)} 여유` : '딱 맞아요';
});

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
          <span class="text-numeric" :class="short ? 'text-danger' : 'text-success'">
            {{ gapText }}
          </span>
        </div>
      </div>

      <!-- 시안 `calcRow`. 계산기 아이콘 · 금리 한 줄 · 근거를 여는 칩이 한 줄에 선다. -->
      <div v-if="rateText" class="flex w-full items-center gap-1.5">
        <img src="/icon/calc.png" alt="" width="16" height="16" class="size-4 shrink-0" />

        <p class="text-caption2 text-ink-card-body flex-1 font-medium">
          예상 금리 {{ rateText }}<span v-if="interestText"> · 월 이자 약 {{ interestText }}</span>
        </p>

        <button
          type="button"
          class="bg-surface-active rounded-chip-sm text-chip text-primary-strong shrink-0 px-1.5 py-0.5 font-bold"
          @click="$emit('basis')"
        >
          계산 근거
        </button>
      </div>

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

    <p v-else class="text-label2 text-ink-hero-body whitespace-pre-line">{{ card.notice }}</p>
  </AppCard>
</template>
