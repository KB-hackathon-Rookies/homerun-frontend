<script setup lang="ts">
import { FIXED_DATE_METHODS } from '~/components/contract/terms';
import { COACH_TIME } from '~/components/contract/coachSheets';

/**
 * 3루 3 · 확정일자 상세.
 *
 * 두 가지를 바로잡는 화면이다. 확정일자를 일찍 받아도 **순위는 안
 * 앞당겨지고**, 확정일자는 심사가 아니라 **기록**이라 위험한 집도 받는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
</script>

<template>
  <GuideFrame
    :coach-sheets="[COACH_TIME.fixedDate]"
    title="확정일자 상세"
    @back="navigateTo(`/contract/${planId}/fixed-date`)"
  >
    <h2 class="text-option text-ink-hero px-1 pt-2">세 가지 방법</h2>

    <NumberedCard
      v-for="(method, index) in FIXED_DATE_METHODS"
      :key="method.title"
      :index="index + 1"
      :title="method.title"
    >
      <p class="text-caption2 text-ink-hero">준비물 · {{ method.prepare }}</p>
      <p class="text-caption2">
        <span class="text-primary-strong font-medium">{{ method.cost }}</span>
        <span class="text-ink-muted font-medium"> · {{ method.speed }}</span>
      </p>
    </NumberedCard>

    <div class="bg-surface-info rounded-field flex flex-col gap-1.5 px-3.5 py-3">
      <p class="text-caption2 text-primary-strong font-semibold">임대차 신고 기준</p>
      <p class="text-caption2 text-ink-hero">
        보증금 6천만원 초과면 계약일부터 30일 이내 신고 의무. 신고하면 확정일자가 자동으로 붙어요.
      </p>
    </div>

    <AppCard class="flex flex-col gap-2">
      <p class="text-label2 text-ink-hero font-semibold">
        권리가 완성되는 순간은 이사+전입신고 이후
      </p>
      <p class="text-caption2 text-ink-hero">
        예) 8/31 계약 → 8/31 확정일자 → 9/5 이사+전입신고 → 9/5부터 권리 완성. 일찍 받는다고 순위가
        앞당겨지지 않아요.
      </p>
      <div class="bg-surface-info rounded-field flex flex-col gap-1 px-3.5 py-3">
        <p class="text-caption2 text-primary-strong font-semibold">그런데도 바로 받는 이유</p>
        <p class="text-caption2 text-ink-hero">
          대출 신청에 필수 서류 (확정일자 찍힌 계약서) 이사 당일은 정신이 없어서 놓치기 쉬움
        </p>
      </div>
    </AppCard>

    <div class="bg-badge-warning rounded-field flex flex-col gap-1.5 p-3.5">
      <p class="text-label2 text-warning-strong font-semibold">확정일자 = 안전 보증이 아니에요</p>
      <p class="text-caption2 text-ink-hero">
        심사가 아니라 기록입니다. 위험한 매물도 확정일자는 받을 수 있어요.
      </p>
    </div>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/fixed-date`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
