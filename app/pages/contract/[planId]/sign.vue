<script setup lang="ts">
import { TERMS } from '~/components/contract/terms';

/**
 * 3루 2 · 계약.
 *
 * 특약 네 개가 이 화면의 전부다. **계약서에 안 적히면 없는 것**이라,
 * 무엇을 적어야 하는지부터 보여준다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
</script>

<template>
  <PhoneFrame>
    <StageBar title="계약" base="3루" @back="navigateTo(`/contract/${planId}/visit`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>
        계약 시 전세보증금의 5~10% 계약금 지불. 영수증 꼭 챙기고 특약이 제일 중요해
      </CoachTip>

      <h2 class="text-body3 text-ink-hero font-bold">필수 특약 4종</h2>

      <AppCard v-for="(term, index) in TERMS" :key="term.title" class="flex flex-col gap-1">
        <p class="text-label2 text-ink-hero font-bold">{{ index + 1 }}. {{ term.title }}</p>
        <p class="text-caption2 text-ink-hero-body">{{ term.short }}</p>
      </AppCard>

      <p class="bg-surface-brand rounded-chip text-caption2 text-ink-hero-body p-3">
        ⚠️ 계약금은 등기부상 소유자 명의 계좌로만 송금. 이체확인증 필수 보관
      </p>

      <DetailLink @open="navigateTo(`/contract/${planId}/sign-detail`)">
        특약·계약 체크·중개보수 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-6">
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/fixed-date`)">
        확정일자 받기
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
