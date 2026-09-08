<script setup lang="ts">
import {
import { HOME_STEPS } from '~/components/home/steps';
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
  <StageShell brand base="홈">
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="HOME_STEPS" :current="3" />

      <p class="text-caption1 text-ink-label font-medium">홈 · 정착 관리</p>

      <h1 class="text-question text-ink-card">중개보수·이사비 지원</h1>

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

    <template #footer>
      <footer class="px-gutter-tight bg-surface flex shrink-0 gap-2.5 pt-2.5 pb-cta-pad">
        <!-- 필수 요소 4번(마지막). 앞 단계는 사후자산심사다. -->
        <div class="w-29 shrink-0">
          <AppButton variant="white" @click="navigateTo(`/settle/${planId}/asset-review`)">
            이전
          </AppButton>
        </div>
        <div class="flex-1">
          <AppButton variant="strong" @click="navigateTo(GOV24_URL, { external: true })">
            지자체 확인
          </AppButton>
        </div>
      </footer>
    </template>
  </StageShell>
</template>
