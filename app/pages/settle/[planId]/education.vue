<script setup lang="ts">
import { EDUCATION_MODULES } from '~/components/settle/education';

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
  <PhoneFrame>
    <StageBar title="교육과 예방" base="홈" @back="navigateTo(`/settle/${planId}`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>꾸준히 볼 것들이야. 필요할 때마다 꺼내서 다시 봐도 좋아</CoachTip>

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

    <footer class="px-gutter-tight bg-surface flex shrink-0 flex-col gap-2 pt-2.5 pb-6">
      <!-- 모듈 내용이 아직 없다. 목록은 보여주되 시작은 잠가 둔다. -->
      <AppButton variant="strong" disabled>교육 시작하기</AppButton>
      <p class="text-micro text-ink-muted text-center">교육 콘텐츠는 아직 준비 중이에요</p>
    </footer>
  </PhoneFrame>
</template>
