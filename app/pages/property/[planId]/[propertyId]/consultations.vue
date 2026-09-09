<script setup lang="ts">
import { useConsultationApi, type Consultation } from '~/api/consultation';
import type { LoanCard } from '~/api/policy';
import {
  collateralLabel,
  isFinalTerms,
  missingFinalTerms,
  productLabel,
  resultLabel,
} from '~/components/property/consultation';
import { acceptsConsultation, trafficTone } from '~/components/property/trafficLight';
import { useJeonsePolicies } from '~/composables/useJeonsePolicies';
import { useProperty } from '~/composables/useProperty';
import { messageFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';
import { COACH_TIME } from '~/components/property/coachSheets';
import { SECOND_BASE_STEPS } from '~/components/property/steps';

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

const { property, title, spec, error: propertyError } = useProperty(planId, propertyId);
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

/**
 * 상담 결과를 적으러 들어가도 되는가.
 *
 * 백엔드는 GREEN·BLUE 에서만 상담을 받는다. 등기부에 "모르겠어요" 가 하나라도
 * 남으면 YELLOW 라, 여기서 안 막으면 사용자는 은행을 다 돌고 와서 결과를 적는
 * 순간에야 409 를 본다. 헛걸음은 되돌릴 수 없다.
 */
const canConsult = computed(() => acceptsConsultation(property.value?.trafficLight ?? null));

/** 매물을 아직 못 읽었으면 막을지 열지도 정할 수 없다. 그동안은 눌리지 않게 둔다. */
const propertyPending = computed(() => property.value === null && !propertyError.value);

/**
 * 2루를 닫을 수 있는 상담.
 *
 * "가능" 만으로는 모자란다 — 상품·담보·승인한도·금리가 다 있어야 서버가 2루
 * 완료를 받는다. 여기서 헐겁게 보내면 확정 화면이 대신 막힌다.
 */
const settled = computed(() => consultations.value.find(isFinalTerms));

/**
 * 이 상담들로는 2루를 못 닫는 이유. 카드마다 한 줄이다.
 *
 * 전에는 "가능" 을 들은 상담만 셌다. 그래서 "서류를 봐야 안다" 나 "어렵다" 만
 * 듣고 온 사람은 3루 버튼도 없고 이유도 없는 화면을 봤다 — 카드는 분명히
 * 등록됐는데 왜 막혔는지 화면 어디에도 안 적혀 있었다.
 *
 * 들은 말이 무엇이든 2루가 안 닫히는 건 같다. 그러니 무엇을 들었는지도 같이
 * 적는다. "어렵대요" 는 다시 물어볼 게 아니라 **다른 은행을 가야 한다**는
 * 뜻이라, 모자란 항목을 나열하는 것과는 다음 할 일이 다르다.
 */
const blockers = computed(() =>
  consultations.value
    .filter((item) => !isFinalTerms(item))
    .map((item) =>
      item.resultStatus === 'POSSIBLE'
        ? `${item.bankName} — ${missingFinalTerms(item).join(' · ')} 미확인`
        : `${item.bankName} — ${resultLabel(item.resultStatus)}`,
    ),
);

/** 아래 버튼이 하는 일. 상태마다 갈 곳이 다르다. */
const cta = computed(() => {
  if (propertyPending.value) return { label: '불러오는 중…', to: '' };
  if (settled.value) {
    return { label: '이 매물로 3루 진행', to: `/property/${planId}/${propertyId}/confirm` };
  }
  if (!canConsult.value) {
    return {
      label: '등기부 확인하러 가기',
      to: `/property/${planId}/${propertyId}/registry-check`,
    };
  }
  return {
    label: consultations.value.length ? '+ 상담 카드 추가' : '+ 첫 상담 카드 추가하기',
    to: `/property/${planId}/${propertyId}/consult-guide`,
  };
});

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

/** ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell :coach-sheets="[COACH_TIME.bankConsult]" brand base="2루">
    <div class="bg-canvas-soft flex min-h-full flex-col gap-4 px-4 pt-4 pb-6">
      <SubStep :steps="SECOND_BASE_STEPS" :current="3" />

      <p class="text-caption1 text-ink-label font-medium">2루 · 은행 상담</p>
      <h1 class="text-question text-ink-card">은행 상담</h1>
      <AppCard v-if="property" class="flex flex-col gap-2">
        <AppBadge :tone="trafficTone(property.trafficLight)" fill="solid" class="self-start">
          {{ property.trafficLightLabel ?? '확인 중' }}
        </AppBadge>
        <p class="text-body2 text-ink-hero font-bold">{{ title }}</p>
        <p class="text-caption2 text-ink-hero-body">{{ spec }}</p>
      </AppCard>

      <p v-if="propertyError" class="text-label2 text-danger">{{ propertyError }}</p>

      <!--
        상담을 받지 않는 신호등. 예전에는 그냥 들여보내서, 은행을 다 돌고 와
        결과를 적는 순간 409(PRP_012)로 막혔다. 헛걸음은 되돌릴 수 없으니
        들어가기 전에 막고 어디를 채워야 하는지 알려준다.
      -->
      <AppCard v-else-if="!propertyPending && !canConsult" class="flex flex-col gap-3">
        <h2 class="text-body3 text-ink-hero font-bold">아직 은행 상담을 기록할 수 없어요</h2>
        <p class="text-label2 text-ink-hero-body">
          등기부 체크리스트에 <strong>"모르겠어요"</strong> 가 남아 있어 신호등이
          {{ property?.trafficLightLabel ?? '확인 필요' }} 예요. 임차권등기 · 압류 · 경매 여부를
          확인해 채우면 상담 결과를 남길 수 있어요
        </p>
        <button
          type="button"
          class="border-line rounded-chip text-label2 text-ink-hero-body h-11 border font-semibold"
          @click="navigateTo(`/property/${planId}/${propertyId}/registry-check`)"
        >
          등기부 체크리스트로 가기
        </button>
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
            v-if="consultations.length < MAX_CARDS && canConsult"
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

      <!-- 카드는 있는데 2루가 안 닫힐 때. 카드마다 무엇이 걸리는지 적어준다. -->
      <div
        v-else-if="blockers.length"
        class="bg-surface-brand rounded-field flex flex-col gap-1.5 p-3.5"
      >
        <p class="text-caption1 text-ink-hero font-bold">3루로 넘어가려면 조건이 더 필요해요</p>
        <p class="text-caption2 text-ink-hero-body">
          한 은행에서 상품 · 담보 · 승인한도 · 금리를 모두 들어야 2루를 닫을 수 있어요
        </p>
        <p v-for="note in blockers" :key="note" class="text-caption2 text-ink-muted">
          {{ note }}
        </p>
      </div>

      <!--
        나갈 길.
        하단 `이전` 은 등기부 체크리스트로 되돌아갈 뿐이라, 이 매물로는 상담이
        안 되겠다 싶은 사람이 다른 매물을 보러 갈 경로가 화면에 없었다. 상담이
        막히는 건 흔한 일이고, 그때 할 일은 이 화면을 붙들고 있는 게 아니라
        다른 매물을 보는 것이다.
      -->
      <button
        type="button"
        class="border-line rounded-chip text-label2 text-ink-hero-body h-11 shrink-0 border font-semibold"
        @click="navigateTo(`/property/${planId}`)"
      >
        매물 목록으로 · 다른 매물 보기
      </button>
    </div>

    <StepFooter
      :disabled="propertyPending"
      @back="navigateTo(`/property/${planId}/${propertyId}/registry-check`)"
      @next="navigateTo(cta.to)"
    >
      {{ cta.label }}
    </StepFooter>
  </StageShell>
</template>
