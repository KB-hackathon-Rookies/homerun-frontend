<script setup lang="ts">
import type { LoanCard } from '~/api/policy';
import { useJeonsePolicies } from '~/composables/useJeonsePolicies';
import { useProperty } from '~/composables/useProperty';
import { trafficTone } from '~/components/property/trafficLight';

/**
 * 2루-4 매물 상세.
 *
 * 이 매물로 **되는 상품과 안 되는 상품을 갈라** 놓는다. 한 목록에 섞어
 * 놓으면 위에서부터 훑다가 안 되는 걸 붙잡고 있게 된다.
 *
 * 판정을 `propertyId` 를 붙여 다시 받는다. 1루에서 본 것은 사람 조건만
 * 본 결과라, 집 조건(면적·용도·보증금 상한)이 걸리는 상품은 여기서 처음
 * 갈린다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

const { pending, error, cards, results } = useJeonsePolicies(planId, propertyId);

const { property, fullAddress, error: propertyError } = useProperty(planId, propertyId);

/** 판정이 FAIL 인 상품 코드. `cards` 에는 통과한 것만 들어 있다. */
const failedCodes = computed(
  () =>
    new Set(
      results.value
        .filter((result) => result.verdict === 'FAIL')
        .map((result) => result.policyCode),
    ),
);

const available = computed(() => cards.value.filter((card) => !failedCodes.value.has(card.code)));

/**
 * 떨어진 상품은 카드로 안 오므로 판정 기록에서 만든다. 이름과 코드만 있으면
 * 되고, 왜 떨어졌는지는 눌러서 들어간 화면이 말한다.
 */
const unavailable = computed(() => results.value.filter((result) => result.verdict === 'FAIL'));

const open = (code: string) => navigateTo(`/property/${planId}/${propertyId}/products/${code}`);
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="매물 상세"
      base="2루"
      @back="navigateTo(`/property/${planId}/${propertyId}/violation`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <AppCard v-if="property" class="flex flex-col gap-1.5">
        <AppBadge :tone="trafficTone(property.trafficLight)" fill="solid" class="self-start">
          {{ property.trafficLightLabel ?? '확인 중' }}
        </AppBadge>
        <p class="text-body3 text-ink-hero font-semibold">{{ fullAddress }}</p>
      </AppCard>

      <p v-if="propertyError" class="text-label2 text-danger">{{ propertyError }}</p>

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
            @click="open(card.code)"
          >
            <ProductRow :card="card as LoanCard" />
          </button>

          <p v-if="!available.length" class="text-micro text-ink-hero-body">
            이 매물로 되는 상품이 없어요.
          </p>
        </section>

        <section class="bg-badge-danger rounded-field flex flex-col gap-2.5 p-3.5">
          <h2 class="text-label2 text-danger font-bold">불가능한 정책 · 대출</h2>

          <button
            v-for="result in unavailable"
            :key="result.policyCode"
            type="button"
            class="bg-surface border-line rounded-chip flex items-center gap-2 border p-3 text-left"
            @click="open(result.policyCode)"
          >
            <span class="text-label2 text-ink-hero flex-1 font-bold">{{ result.policyName }}</span>
            <AppIcon name="chevron-right" class="text-ink-muted size-4 shrink-0" />
          </button>

          <p v-if="!unavailable.length" class="text-micro text-ink-hero-body">
            떨어진 상품이 없어요.
          </p>
        </section>
      </template>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton variant="strong" @click="navigateTo(`/property/${planId}/${propertyId}/registry`)">
        등기부등본 확인하러 가기
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
