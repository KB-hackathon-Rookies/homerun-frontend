<script setup lang="ts">
import { useConsultationApi, type Consultation } from '~/api/consultation';
import type { LoanCard } from '~/api/policy';
import { collateralLabel, productLabel, resultLabel } from '~/components/property/consultation';
import { trafficTone } from '~/components/property/trafficLight';
import { useJeonsePolicies } from '~/composables/useJeonsePolicies';
import { useProperty } from '~/composables/useProperty';
import { messageFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';

/**
 * 2루-4d 은행 상담 카드 리스트.
 *
 * 위쪽은 이 매물의 상품 판정, 아래쪽은 은행별로 들은 말이다. 둘을 한 화면에
 * 두는 이유가 있다 — **은행이 하는 말과 정책 판정이 다를 수 있다.** 나란히
 * 놓여 있어야 어긋난 걸 알아챈다.
 *
 * 카드가 없을 때와 쌓였을 때가 같은 화면이다. 첫 카드를 넣은 순간 다른
 * 화면으로 튀지 않는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

const { property, title, spec } = useProperty(planId, propertyId);
const { pending, error, cards, results } = useJeonsePolicies(planId, propertyId);

const consultations = ref<Consultation[]>([]);
const listError = ref('');

/** 백엔드가 매물마다 최대 다섯 곳까지 받는다. */
const MAX_CARDS = 5;

const failedCodes = computed(
  () =>
    new Set(
      results.value
        .filter((result) => result.verdict === 'FAIL')
        .map((result) => result.policyCode),
    ),
);
const available = computed(() => cards.value.filter((card) => !failedCodes.value.has(card.code)));
const unavailable = computed(() => results.value.filter((result) => result.verdict === 'FAIL'));

/** 한 곳이라도 "가능" 을 들었으면 3루로 넘어갈 수 있다. */
const settled = computed(() =>
  consultations.value.find((item) => item.resultStatus === 'POSSIBLE'),
);

const summaryOf = (item: Consultation) => {
  if (item.resultStatus !== 'POSSIBLE') return resultLabel(item.resultStatus);
  const parts = [resultLabel(item.resultStatus), productLabel(item.loanProduct)];
  if (item.collateralMethod !== 'UNKNOWN') parts.push(collateralLabel(item.collateralMethod));
  if (item.approvedLimit !== null) parts.push(`한도 ${formatKoreanMoney(item.approvedLimit)}`);
  return parts.join(' · ');
};

onMounted(async () => {
  try {
    consultations.value = await useConsultationApi().list(planId, propertyId);
  } catch (cause) {
    listError.value = messageFrom(cause, '상담 기록을 불러오지 못했어요.');
  }
});
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="은행 상담"
      base="2루"
      @back="navigateTo(`/property/${planId}/${propertyId}/registry-check`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 py-4">
      <AppCard v-if="property" class="flex flex-col gap-2">
        <AppBadge :tone="trafficTone(property.trafficLight)" fill="solid" class="self-start">
          {{ property.trafficLightLabel ?? '확인 중' }}
        </AppBadge>
        <p class="text-body2 text-ink-hero font-bold">{{ title }}</p>
        <p class="text-caption2 text-ink-hero-body">{{ spec }}</p>
      </AppCard>

      <p v-if="pending" class="text-label2 text-ink-muted">판정 결과를 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <template v-else>
        <section class="bg-badge-success rounded-field flex flex-col gap-2.5 p-3.5">
          <h2 class="text-label2 text-success font-bold">가능한 정책 · 대출</h2>
          <button
            v-for="card in available"
            :key="card.code"
            type="button"
            class="text-left"
            @click="navigateTo(`/property/${planId}/${propertyId}/products/${card.code}`)"
          >
            <ProductRow :card="card as LoanCard" />
          </button>
        </section>

        <section
          v-if="unavailable.length"
          class="bg-badge-danger rounded-field flex flex-col gap-2.5 p-3.5"
        >
          <h2 class="text-label2 text-danger font-bold">불가능한 정책 · 대출</h2>
          <button
            v-for="result in unavailable"
            :key="result.policyCode"
            type="button"
            class="bg-surface border-line rounded-chip flex items-center gap-2 border p-3 text-left"
            @click="navigateTo(`/property/${planId}/${propertyId}/products/${result.policyCode}`)"
          >
            <span class="text-label2 text-ink-hero flex-1 font-bold">{{ result.policyName }}</span>
            <AppIcon name="chevron-right" class="text-ink-muted size-4 shrink-0" />
          </button>
        </section>
      </template>

      <div class="bg-surface-info rounded-field flex flex-col gap-1 p-3.5">
        <p class="text-caption1 text-primary-strong">코치 팁</p>
        <p class="text-caption2 text-ink-hero-body">
          은행 3곳 이상 돌아보는 게 좋아요. 한 곳이라도 "가능" 판정을 받으면 상담 완료로 처리돼요
        </p>
      </div>

      <AppCard class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-body3 text-ink-hero font-bold">상담 카드</h2>
          <span class="text-caption2 text-ink-hero-body shrink-0">
            {{ consultations.length }} / {{ MAX_CARDS }}
          </span>
        </div>

        <p v-if="listError" class="text-label2 text-danger">{{ listError }}</p>

        <div
          v-else-if="!consultations.length"
          class="bg-surface-brand rounded-field flex flex-col items-center gap-3 p-6 text-center"
        >
          <p class="text-body2 text-ink-hero font-bold">아직 상담 카드가 없어요</p>
          <p class="text-caption2 text-ink-hero-body">
            은행에 방문한 뒤 카드를 추가하면 결과를 기록할 수 있어요
          </p>
        </div>

        <template v-else>
          <div
            v-for="item in consultations"
            :key="item.consultationId"
            class="border-line rounded-field flex flex-col gap-2 border p-3.5"
          >
            <div class="flex items-center gap-2">
              <span class="text-body3 text-ink-hero flex-1 font-bold">
                {{ item.branchName ? `${item.bankName} ${item.branchName}` : item.bankName }}
              </span>
              <AppBadge
                :tone="item.resultStatus === 'POSSIBLE' ? 'positive' : 'cautionary'"
                fill="solid"
              >
                {{ item.resultStatus === 'POSSIBLE' ? '완료' : '진행중' }}
              </AppBadge>
            </div>
            <p class="text-caption2 text-ink-hero-body">{{ summaryOf(item) }}</p>
          </div>

          <button
            v-if="consultations.length < MAX_CARDS"
            type="button"
            class="border-line rounded-chip text-label2 text-ink-hero-body h-11 border font-semibold"
            @click="navigateTo(`/property/${planId}/${propertyId}/consult-guide`)"
          >
            + 상담 카드 추가
          </button>
        </template>
      </AppCard>

      <div v-if="settled" class="bg-surface-info rounded-field flex flex-col gap-1 p-3.5">
        <p class="text-caption1 text-primary-strong">한 곳에서 "가능" 확정</p>
        <p class="text-caption2 text-ink-hero-body">
          {{ settled.bankName }}에서 {{ productLabel(settled.loanProduct) }} 진행 가능. 이 조건으로
          3루로 넘어갈 수 있어요
        </p>
      </div>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-6">
      <AppButton
        variant="strong"
        @click="
          navigateTo(
            settled
              ? `/property/${planId}/${propertyId}/confirm`
              : `/property/${planId}/${propertyId}/consult-guide`,
          )
        "
      >
        {{ settled ? '이 매물로 3루 진행' : '+ 첫 상담 카드 추가하기' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
