<script setup lang="ts">
import type { LoanCard } from '~/api/policy';
import { usePropertyApi } from '~/api/property';
import { useJeonsePolicies } from '~/composables/useJeonsePolicies';
import { useProperty } from '~/composables/useProperty';
import { trafficTone } from '~/components/property/trafficLight';
import { usePropertyStepGuard } from '~/utils/propertyStepGuard';
import { messageFrom } from '~/utils/error';
import { COACH_TIME } from '~/components/property/coachSheets';
import { SECOND_BASE_STEPS } from '~/components/property/steps';

/**
 * 2루 5 · 매물 상세.
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

/**
 * 여기서 갈리는 판정은 위반건축물까지 답한 뒤에야 온전하다. 아직 STEP 2·3 에 머문
 * 매물이 URL 로 들어오면 절반만 채워진 판정을 결론처럼 읽게 되고, 하단 `등기부등본
 * 확인하러 가기` 도 저장에서 막힌다. 그래서 지금 단계 화면으로 돌려보낸다.
 */
usePropertyStepGuard(planId, propertyId, 'detail');

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

/**
 * 재진단 — 입력이 잘못돼 불가가 났을 때 삭제·재등록 없이 처음 STEP 부터 다시 답한다.
 *
 * 워크플로가 단방향이라 이 화면에서 앞 STEP 을 직접 열 수 없고, 서버가 위반·등기부
 * 답을 지우고 BUILDING 으로 되돌린다. 되돌린 뒤 그 STEP(건축물대장 입력)로 보낸다.
 */
const confirming = ref(false);
const rediagnosing = ref(false);
const rediagnoseError = ref('');

async function reDiagnose() {
  if (rediagnosing.value) return;
  rediagnosing.value = true;
  rediagnoseError.value = '';
  try {
    await usePropertyApi().reDiagnose(planId, propertyId);
    await navigateTo(`/property/${planId}/${propertyId}/building`);
  } catch (cause) {
    rediagnoseError.value = messageFrom(cause, '재진단하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    rediagnosing.value = false;
  }
}

/** ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="[COACH_TIME.emptyJeonse]"
    brand
    base="2루"
    @back="navigateTo(`/property/${planId}/${propertyId}/violation`)"
  >
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="SECOND_BASE_STEPS" :current="1" />

      <p class="text-caption1 text-ink-label font-medium">2루 · 등기부 확인</p>
      <h1 class="text-question text-ink-card">매물 상세</h1>

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
        </section>

        <!-- 입력이 잘못돼 불가가 났을 때 삭제 없이 처음부터 다시 답하는 길. -->
        <button
          type="button"
          class="text-caption2 text-ink-muted hover:text-ink-body self-center py-1 font-medium underline"
          @click="confirming = true"
        >
          입력이 잘못됐나요? 매물 다시 진단하기
        </button>
      </template>
    </div>

    <DimOverlay v-if="confirming" placement="center" @close="confirming = false">
      <p class="text-headline2 text-ink">이 매물을 다시 진단할까요?</p>
      <p class="text-label2 text-ink-muted text-center">
        위반건축물·등기부 답변이 지워지고 주택정보 입력부터 다시 진행해요. 주소·조회 결과는
        그대로예요.
      </p>
      <p v-if="rediagnoseError" class="text-label2 text-danger text-center">
        {{ rediagnoseError }}
      </p>
      <div class="flex w-full gap-2.5 pt-2">
        <div class="flex-1">
          <AppButton variant="white" @click="confirming = false">취소</AppButton>
        </div>
        <div class="flex-1">
          <AppButton variant="strong" :disabled="rediagnosing" @click="reDiagnose">
            {{ rediagnosing ? '되돌리는 중…' : '다시 진단' }}
          </AppButton>
        </div>
      </div>
    </DimOverlay>

    <template #footer>
      <StepFooter
        @back="navigateTo(`/property/${planId}/${propertyId}/violation`)"
        @next="navigateTo(`/property/${planId}/${propertyId}/registry`)"
      >
        등기부 확인
      </StepFooter>
    </template>
  </StageShell>
</template>
