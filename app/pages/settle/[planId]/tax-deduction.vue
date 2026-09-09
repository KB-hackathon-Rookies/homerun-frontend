<script setup lang="ts">
import { usePropertyApi } from '~/api/property';
import { useSettlementApi, type TaxDeduction } from '~/api/settlement';
import { monthlyInterestOf } from '~/components/settle/rir';
import {
  HOMETAX_URL,
  TAX_CONDITIONS,
  TAX_DOCUMENTS,
  estimateRefund,
} from '~/components/settle/tax';
import { formatKoreanMoney } from '~/utils/money';
import { HOME_STEPS } from '~/components/home/steps';

/**
 * 홈 4-8 · 연말정산 소득공제.
 *
 * 매년 1월. 주택임차차입금 원리금상환액 소득공제로 낸 이자의 일부를
 * 돌려받는다.
 *
 * 예상 환급액은 확정한 대출 조건에서 센다. 세율은 사회초년생 구간을 가정한
 * 값이라 정확한 금액이 아니다 — 그 말을 화면에 남긴다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const principal = ref<number | null>(null);
const rate = ref<number | null>(null);
const serverEstimate = ref<TaxDeduction | null>(null);

const yearlyInterest = computed(() => {
  const monthly = monthlyInterestOf(principal.value, rate.value);
  return monthly === null ? null : monthly * 12;
});

const estimate = computed(() => {
  if (serverEstimate.value?.estimatedRefund !== null && serverEstimate.value) {
    return {
      refund: serverEstimate.value.estimatedRefund,
      deductible: serverEstimate.value.deductionAmount ?? 0,
    };
  }
  return estimateRefund(yearlyInterest.value);
});

onMounted(() => {
  usePropertyApi()
    .decision(planId)
    .then(async (found) => {
      principal.value = found.consultation?.approvedLimit ?? null;
      rate.value = found.consultation?.quotedRate ?? null;
      if (principal.value !== null && rate.value !== null) {
        serverEstimate.value = await useSettlementApi().taxDeduction(planId, {
          loanAmount: principal.value,
          annualRatePercent: rate.value,
          maturityLumpSum: true,
          annualRepayment: null,
        });
      }
    })
    .catch(() => {});
});
</script>

<template>
  <StageShell brand base="홈">
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="HOME_STEPS" :current="4" />

      <p class="text-caption1 text-ink-label font-medium">홈 · 사후 관리</p>

      <h1 class="text-question text-ink-card">연말정산 소득공제</h1>

      <div class="bg-primary-strong rounded-button flex flex-col gap-1.5 p-4.5">
        <p class="text-caption-tight text-on-brand font-normal">예상 환급액</p>
        <p class="text-title3 text-on-brand">
          {{ estimate ? `약 ${formatKoreanMoney(estimate.refund)}` : '—' }}
        </p>
        <p class="text-step text-on-brand font-normal">
          <template v-if="estimate">
            연 이자 {{ formatKoreanMoney(yearlyInterest) }} × 40% =
            {{ formatKoreanMoney(estimate.deductible) }} 공제 → 세율 16.5% 가정
          </template>
          <template v-else>확정한 대출 조건이 있어야 셀 수 있어요</template>
        </p>
      </div>

      <h2 class="text-card-title text-ink-hero font-bold">공제 기준</h2>

      <AppCard class="flex flex-col gap-1.5">
        <div v-for="row in TAX_CONDITIONS" :key="row.label" class="flex gap-2">
          <span class="text-caption-tight text-ink-hero-body w-20 shrink-0 font-normal">
            {{ row.label }}
          </span>
          <span class="text-caption-tight text-ink-hero flex-1 font-semibold">{{ row.value }}</span>
        </div>
      </AppCard>

      <h2 class="text-card-title text-ink-hero font-bold">준비 서류</h2>

      <div class="bg-surface-brand rounded-chip flex flex-col gap-0.5 p-3">
        <p v-for="line in TAX_DOCUMENTS" :key="line" class="text-micro text-ink-hero-body">
          {{ line }}
        </p>
      </div>

      <p class="bg-caution rounded-chip text-step p-2.5 text-white">
        놓쳤어도 최대 5년치 경정청구로 소급할 수 있어요
      </p>

      <DetailLink @open="navigateTo(`/settle/${planId}/tax-deduction-detail`)">
        연말정산 소득공제 상세보기
      </DetailLink>
    </div>

    <template #footer>
      <footer class="px-gutter-tight bg-surface flex shrink-0 gap-2.5 pt-2.5 pb-cta-pad">
        <div class="w-29 shrink-0">
          <AppButton variant="white" @click="navigateTo(`/settle/${planId}`)">이전</AppButton>
        </div>
        <div class="flex-1">
          <AppButton variant="strong" @click="navigateTo(HOMETAX_URL, { external: true })">
            홈택스 열기
          </AppButton>
        </div>
      </footer>
    </template>
  </StageShell>
</template>
