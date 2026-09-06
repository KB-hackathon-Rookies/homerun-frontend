<script setup lang="ts">
import { FIXED_DATE_METHODS } from '~/components/contract/terms';

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
</script>

<template>
  <PhoneFrame>
    <StageBar title="확정일자" base="3루" @back="navigateTo(`/contract/${planId}/sign`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>축하해! 계약 완료. 계약하고 바로 확정일자를 받아. 미루지 않는 게 좋아</CoachTip>

      <h2 class="text-body3 text-ink-hero font-bold">세 가지 방법 중 하나</h2>

      <AppCard v-for="method in FIXED_DATE_METHODS" :key="method.title" class="flex flex-col gap-1">
        <p class="text-label2 text-ink-hero font-bold">{{ method.title }}</p>
        <p class="text-micro text-ink-hero-body">· {{ method.prepare }}</p>
        <p class="text-micro text-primary-strong">· {{ method.cost }} · {{ method.speed }}</p>
      </AppCard>

      <DetailLink @open="navigateTo(`/contract/${planId}/fixed-date-detail`)">
        세 방법·효력 발생 시점 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-6">
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/schedule`)">
        일정 만들기로
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
