<script setup lang="ts">
import { RENEWAL_RECHECKS, RENEWAL_WAYS } from '~/components/settle/lifecycle';
import { HOME_STEPS } from '~/components/home/steps';
import { COACH_TIME } from '~/components/home/coachSheets';

/**
 * 홈 4-9 · 갱신 판정.
 *
 * 계약 만료 6개월 전에 갱신할지 나갈지를 먼저 정해야 조건을 협상할 기회가
 * 생긴다. 그래서 화면 맨 위가 두 갈래 선택이다.
 *
 * 셋 중에서는 묵시적 갱신이 조건상 가장 유리하다 — 기존 조건이 그대로 간다.
 * 다만 임대인이 먼저 연락하면 성립하지 않는다.
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
    :coach-sheets="[COACH_TIME.renewalCheck]"
    brand
    base="홈"
  >
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="HOME_STEPS" :current="4" />

      <p class="text-caption1 text-ink-label font-medium">홈 · 사후 관리</p>

      <h1 class="text-question text-ink-card">갱신 판정</h1>

      <div class="flex gap-2">
        <button
          type="button"
          class="bg-primary-strong rounded-field flex flex-1 flex-col items-center justify-center gap-1 p-3.5"
          @click="navigateTo(`/settle/${planId}/renewal-detail`)"
        >
          <span class="text-card-title text-on-brand font-bold">갱신할래요</span>
          <span class="text-step text-on-brand font-normal">갱신 준비로</span>
        </button>

        <button
          type="button"
          class="bg-surface border-line rounded-field flex flex-1 flex-col items-center justify-center gap-1 border p-3.5"
          @click="navigateTo(`/settle/${planId}/move-out`)"
        >
          <span class="text-card-title text-ink-hero font-bold">나갈래요</span>
          <span class="text-step text-ink-hero-body font-normal">퇴거 준비로</span>
        </button>
      </div>

      <h2 class="text-card-title text-ink-hero font-bold">세 가지 갱신 방법</h2>

      <div
        v-for="way in RENEWAL_WAYS"
        :key="way.code"
        class="rounded-field flex flex-col gap-1 border p-3"
        :class="way.best ? 'bg-surface-info border-primary-strong' : 'bg-surface border-line'"
      >
        <p class="text-row" :class="way.best ? 'text-primary-strong' : 'text-ink-hero'">
          {{ way.name }}
        </p>
        <p class="text-caption-tight text-ink-hero-body font-normal">{{ way.headline }}</p>
      </div>

      <div class="bg-surface-brand rounded-field flex flex-col gap-1 p-3.5">
        <p class="text-caption-tight text-ink-hero font-bold">연장 시 자격 재심사</p>
        <p v-for="line in RENEWAL_RECHECKS" :key="line" class="text-micro text-ink-hero-body">
          {{ line }}
        </p>
      </div>

      <DetailLink @open="navigateTo(`/settle/${planId}/renewal-detail`)">
        갱신 판정 상세보기
      </DetailLink>
    </div>

    <template #footer>
      <footer class="px-gutter-tight bg-surface flex shrink-0 gap-2.5 pt-2.5 pb-cta-pad">
        <div class="w-29 shrink-0">
          <AppButton variant="white" @click="navigateTo(`/settle/${planId}`)">이전</AppButton>
        </div>
        <div class="flex-1">
          <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/renewal-detail`)">
            갱신 검토
          </AppButton>
        </div>
      </footer>
    </template>
  </StageShell>
</template>
