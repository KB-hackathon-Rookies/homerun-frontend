<script setup lang="ts">
import { EDUCATION_MODULES } from '~/components/settle/education';
import { HOME_STEPS } from '~/components/home/steps';

/**
 * 홈 4-7 · 교육과 예방.
 *
 * 한 번 보고 끝나는 게 아니라 필요할 때 꺼내 보는 것들이다. 목록만 두고
 * 내용은 각 모듈이 갖는다 — 아직 내용을 담을 곳이 없어 목록까지만 있다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
</script>

<template>
  <StageShell brand base="홈">
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="HOME_STEPS" :current="4" />

      <p class="text-caption1 text-ink-label font-medium">홈 · 사후 관리</p>

      <h1 class="text-question text-ink-card">교육과 예방</h1>

      <div
        v-for="module in EDUCATION_MODULES"
        :key="module.title"
        class="bg-surface border-line rounded-field flex items-center gap-3 border px-3.5 py-3"
      >
        <span class="flex flex-1 flex-col gap-0.5">
          <span class="text-row text-ink-hero">{{ module.title }}</span>
          <span class="text-step text-ink-hero-body font-normal">{{ module.summary }}</span>
        </span>
        <AppIcon name="chevron-right" class="text-ink-meta size-4 shrink-0" />
      </div>

      <DetailLink @open="navigateTo(`/settle/${planId}/education-detail`)">
        교육과 예방 상세보기
      </DetailLink>
    </div>

    <template #footer>
      <footer class="px-gutter-tight bg-surface flex shrink-0 flex-col gap-2 pt-2.5 pb-cta-pad">
        <!--
        모듈 내용이 아직 없다. 목록은 보여주되 시작은 잠가 둔다. 다만 주 버튼이
        잠긴 화면이라 헤더 화살표 말고는 나갈 길이 없었다 -- `이전` 을 둔다.
      -->
        <div class="flex gap-2.5">
          <div class="w-29 shrink-0">
            <AppButton variant="white" @click="navigateTo(`/settle/${planId}`)">이전</AppButton>
          </div>
          <div class="flex-1">
            <AppButton variant="strong" disabled>교육 시작하기</AppButton>
          </div>
        </div>
        <p class="text-micro text-ink-muted text-center">교육 콘텐츠는 아직 준비 중이에요</p>
      </footer>
    </template>
  </StageShell>
</template>
