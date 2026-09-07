<script setup lang="ts">
import {
  GOV24_URL,
  MOVING_SUPPORT_CONDITIONS,
  MOVING_SUPPORT_ROUTES,
} from '~/components/settle/aftercare';

/**
 * 홈 4-4 · 중개보수·이사비 지원.
 *
 * 지자체가 각자 예산으로 굴리는 사업이라 조건도 금액도 지역마다 다르다.
 * 하나로 단정하지 않고 "지자체별 상이" 를 그대로 남긴다.
 *
 * 예산 선착순이라 자격보다 속도가 문제다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
</script>

<template>
  <PhoneFrame>
    <StageBar title="중개보수·이사비 지원" base="홈" @back="navigateTo(`/settle/${planId}`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>
        청년 부동산 중개보수·이사비 지원사업이야. 지자체별로 운영해서 해당 기간에 안내해드릴게
      </CoachTip>

      <div class="bg-primary-strong rounded-button flex flex-col gap-1.5 p-4.5">
        <p class="text-caption-tight text-on-brand font-normal">예상 지원액 (서울시 청년 기준)</p>
        <p class="text-amount text-on-brand">최대 40만원</p>
        <p class="text-step text-on-brand font-normal">중개보수 실비 + 이사비 (지자체별 상이)</p>
      </div>

      <h2 class="text-card-title text-ink-hero font-bold">신청 조건 (일반)</h2>

      <AppCard class="flex flex-col gap-1.5">
        <div v-for="row in MOVING_SUPPORT_CONDITIONS" :key="row.label" class="flex gap-2">
          <span class="text-caption-tight text-ink-hero-body w-20 shrink-0 font-normal">
            {{ row.label }}
          </span>
          <span class="text-caption-tight text-ink-hero flex-1 font-semibold">{{ row.value }}</span>
        </div>
      </AppCard>

      <p class="bg-caution rounded-chip text-step p-2.5 text-white">
        예산 소진 시 조기 마감 · 이사일 근처에 바로 신청하는 걸 권해요
      </p>

      <div class="bg-surface-brand rounded-field flex flex-col gap-1 p-3.5">
        <p class="text-caption-tight text-ink-hero font-bold">신청 경로</p>
        <p v-for="line in MOVING_SUPPORT_ROUTES" :key="line" class="text-micro text-ink-hero-body">
          {{ line }}
        </p>
      </div>

      <DetailLink @open="navigateTo(`/settle/${planId}/moving-support-detail`)">
        중개보수·이사비 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight bg-surface flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton variant="strong" @click="navigateTo(GOV24_URL, { external: true })">
        내 지자체 사업 확인
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
