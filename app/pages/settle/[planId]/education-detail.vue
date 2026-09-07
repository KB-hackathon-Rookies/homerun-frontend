<script setup lang="ts">
import { EDUCATION_MODULES } from '~/components/settle/education';

/**
 * 홈 4-7 상세 · 교육과 예방.
 *
 * 여섯 모듈이 각각 무엇을 다루는지. 순서가 뜻을 가진다 — 연체를 막는 게
 * 먼저고, 사기 예방은 그 위에 얹는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
</script>

<template>
  <GuideFrame title="교육과 예방 상세" @back="navigateTo(`/settle/${planId}/education`)">
    <h2 class="text-section text-ink-hero px-1 pt-2">꾸준히 볼 것</h2>

    <NumberedCard
      v-for="(module, index) in EDUCATION_MODULES"
      :key="module.title"
      :index="index + 1"
      :title="module.title"
    >
      <p class="text-caption-tight text-ink-hero font-normal">{{ module.detail }}</p>
    </NumberedCard>

    <div class="bg-surface-info rounded-field flex flex-col gap-1 px-3.5 py-3">
      <p class="text-caption-tight text-primary-strong font-semibold">
        코치 교육 모듈 페이지에서 자세히
      </p>
      <p class="text-step text-ink-meta font-normal">
        각 모듈은 5~10분짜리 콘텐츠로 홈런 코치가 순차 안내해요.
      </p>
    </div>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/education`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
