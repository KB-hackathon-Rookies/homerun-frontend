<script setup lang="ts">
import { PRODUCTS } from '~/components/property/products';
import { useJeonsePolicies } from '~/composables/useJeonsePolicies';
import { PRODUCT_COACH } from '~/components/property/coachSheets';

/**
 * 2루 5 · 상품 상세 (하위).
 *
 * 상품 하나가 어떤 상품인지, 그리고 **이 매물에서 왜 안 됐는지**를 함께
 * 보여준다. 안 되는 이유를 목록 화면에 다 펼치면 읽히지 않아서 여기로 뺐다.
 *
 * 두 값의 출처가 다르다. 상품 규격(금리 폭·한도 규칙·취급은행)은 고정 표에서,
 * 판정과 탈락 사유는 이 사람·이 매물의 판정 결과에서 온다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);
const code = String(route.params.code);

const { pending, error, results } = useJeonsePolicies(planId, propertyId);

const doc = computed(() => PRODUCTS[code] ?? null);
const verdict = computed(() => results.value.find((result) => result.policyCode === code) ?? null);
const failed = computed(() => verdict.value?.verdict === 'FAIL');

/** 떨어진 이유. 첫 실패에서 멈추지 않고 전부 온다. */
const reasons = computed(() => verdict.value?.rejectionReasons ?? []);

/** 대신 볼 상품. 판정이 알려 준다 — 화면에서 짝지어 두지 않는다. */
const alternative = computed(
  () => reasons.value.find((reason) => reason.alternativePolicyCode)?.alternativePolicyName ?? null,
);

/** 시안이 코치 TIME 을 붙인 상품에서만 FAB 이 뜬다. 나머지는 빈 배열이라 안 뜬다. */
const coachSheets = computed(() => {
  const sheet = PRODUCT_COACH[code];
  return sheet ? [sheet] : [];
});
</script>

<template>
  <StageShell
    :coach-sheets="coachSheets"
    :title="doc?.title ?? verdict?.policyName ?? '상품 상세'"
    base="2루"
    :show-progress="false"
    @back="navigateTo(`/property/${planId}/${propertyId}/detail`)"
  >
    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <p v-if="pending" class="text-label2 text-ink-muted">판정 결과를 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <!-- 왜 안 되는지를 맨 위에 둔다. 규격을 먼저 읽고 나서 알면 헛수고가 된다. -->
      <div
        v-else-if="failed"
        class="bg-surface border-danger rounded-field flex flex-col gap-2 border p-3.5"
      >
        <div class="flex items-center gap-2">
          <AppBadge tone="negative" fill="solid">대출 불가</AppBadge>
          <span class="text-caption2 text-ink-hero-body">이 매물에서는</span>
        </div>
        <p v-if="reasons.length" class="text-label2 text-ink-hero font-semibold">
          {{ reasons.map((reason) => reason.reasonLabel).join(' · ') }}
        </p>
        <p v-else class="text-label2 text-ink-hero font-semibold">
          조건에 맞지 않아 이 매물로는 진행할 수 없어요.
        </p>
        <!-- 조사를 붙이면 이름 끝소리에 따라 을/를이 갈린다. 정책 이름은 서버가 주므로 피한다. -->
        <p v-if="alternative" class="text-caption2 text-ink-hero-body">
          대신 볼 수 있는 상품 — <b>{{ alternative }}</b>
        </p>
      </div>

      <template v-if="doc">
        <p class="bg-surface-brand rounded-field text-label2 text-ink-hero p-4 leading-5">
          {{ doc.summary }}
        </p>

        <h2 class="text-body3 text-ink-hero font-bold">상품 요약</h2>

        <AppCard class="flex flex-col gap-1">
          <div v-for="spec in doc.specs" :key="spec.label" class="flex items-center py-1.5">
            <span class="text-label2 text-ink-hero-body w-28 shrink-0">{{ spec.label }}</span>
            <span
              class="text-label2 flex-1 font-semibold"
              :class="spec.highlight ? 'text-primary-strong' : 'text-ink-hero'"
            >
              {{ spec.value }}
            </span>
          </div>
        </AppCard>

        <div
          v-if="doc.preferential"
          class="bg-surface-brand rounded-field flex flex-col gap-1.5 p-4"
        >
          <p class="text-label2 text-ink-hero font-bold">{{ doc.preferential.title }}</p>
          <p v-for="line in doc.preferential.lines" :key="line" class="text-caption2 text-ink-hero">
            {{ line }}
          </p>
        </div>

        <template v-if="doc.compare">
          <h2 class="text-body3 text-ink-hero font-bold">청년 버팀목과 뭐가 달라요?</h2>
          <AppCard class="flex flex-col gap-1.5">
            <div class="flex items-center gap-2">
              <span class="w-24 shrink-0" />
              <span class="text-micro text-ink-hero-body flex-1 font-bold">
                {{ doc.compare.columns[0] }}
              </span>
              <span class="text-micro text-primary-strong w-20 shrink-0 font-bold">
                {{ doc.compare.columns[1] }}
              </span>
            </div>
            <div v-for="row in doc.compare.rows" :key="row[0]" class="flex items-center gap-2 py-1">
              <span class="text-micro text-ink-hero-body w-24 shrink-0">{{ row[0] }}</span>
              <span class="text-micro text-ink-hero flex-1">{{ row[1] }}</span>
              <span class="text-micro text-primary-strong w-20 shrink-0 font-semibold">
                {{ row[2] }}
              </span>
            </div>
          </AppCard>
        </template>

        <template v-if="doc.rateCalc">
          <h2 class="text-body3 text-ink-hero font-bold">금리 계산</h2>
          <div class="bg-surface-info rounded-field flex flex-col gap-1.5 p-3.5">
            <p
              v-for="line in doc.rateCalc.lines"
              :key="line"
              class="text-caption2 text-ink-hero-body"
            >
              {{ line }}
            </p>
            <p class="text-body3 text-primary-strong font-bold">{{ doc.rateCalc.result }}</p>
            <p class="text-micro text-ink-muted">{{ doc.rateCalc.note }}</p>
          </div>
        </template>

        <template v-if="doc.guarantees">
          <h2 class="text-body3 text-ink-hero font-bold">보증기관 (담보 방식)</h2>
          <AppCard class="flex flex-col gap-2">
            <div
              v-for="guarantee in doc.guarantees"
              :key="guarantee.name"
              class="bg-surface-brand rounded-chip flex flex-col gap-1 p-3"
            >
              <p class="text-caption2 text-ink-hero font-bold">{{ guarantee.name }}</p>
              <p class="text-micro text-ink-hero-body">{{ guarantee.desc }}</p>
            </div>
          </AppCard>
        </template>

        <p
          v-if="doc.tip"
          class="bg-surface-info rounded-chip text-micro text-primary-deep p-3 font-bold"
        >
          {{ doc.tip }}
        </p>

        <p
          v-if="doc.warn"
          class="bg-warning-strong rounded-chip text-caption2 p-3 font-bold text-white"
        >
          {{ doc.warn }}
        </p>

        <AppCard v-if="doc.banks" class="flex flex-col gap-1">
          <p class="text-label2 text-ink-hero font-bold">취급은행</p>
          <p class="text-caption2 text-ink-hero-body">{{ doc.banks }}</p>
        </AppCard>
      </template>

      <p v-else-if="!pending && !error" class="text-label2 text-ink-muted">
        이 상품의 설명이 아직 없어요.
      </p>
    </div>

    <template #footer>
      <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
        <AppButton variant="strong" @click="navigateTo(`/property/${planId}/${propertyId}/detail`)">
          확인
        </AppButton>
      </footer>
    </template>
  </StageShell>
</template>
