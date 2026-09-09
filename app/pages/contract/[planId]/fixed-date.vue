<script setup lang="ts">
import { FIXED_DATE_METHODS } from '~/components/contract/terms';
import { THIRD_BASE_STEPS } from '~/components/contract/steps';
import { COACH_TIME } from '~/components/contract/coachSheets';

/**
 * 3루 3 · 확정일자.
 *
 * 계약하고 바로 받는다. 순위가 앞당겨지지는 않지만(권리는 전입신고
 * 다음날 0시부터) **대출 신청에 확정일자 찍힌 계약서가 필요**하고,
 * 이사 당일은 정신이 없어 놓치기 쉽다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

/** ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="[COACH_TIME.fixedDate]"
    brand
    base="3루"
  >
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="THIRD_BASE_STEPS" :current="0" />

      <h1 class="text-question text-ink-card">확정일자</h1>

      <h2 class="text-body3 text-ink-hero font-bold">세 가지 방법 중 하나</h2>

      <AppCard v-for="method in FIXED_DATE_METHODS" :key="method.title" class="flex flex-col gap-1">
        <p class="text-label2 text-ink-hero font-bold">{{ method.title }}</p>
        <p class="text-micro text-ink-hero-body">· {{ method.prepare }}</p>
        <p class="text-micro text-primary-strong">· {{ method.cost }} · {{ method.speed }}</p>
      </AppCard>
    </div>

    <template #footer>
      <footer class="px-gutter-tight flex shrink-0 gap-2 pt-2.5 pb-cta-pad">
        <div class="w-28 shrink-0">
          <AppButton variant="white" @click="navigateTo(`/contract/${planId}/sign`)">
            이전
          </AppButton>
        </div>
        <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/schedule`)">
          일정 만들기로
        </AppButton>
      </footer>
    </template>
  </StageShell>
</template>
