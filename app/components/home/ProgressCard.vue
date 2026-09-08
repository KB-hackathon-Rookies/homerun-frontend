<script setup lang="ts">
import type { PlanStage } from '~/api/dashboard';

/**
 * 홈 한가운데의 파란 진행 카드.
 *
 * 제목 한 줄, 지금 무슨 일이 벌어지는지 한 줄, 네 칸짜리 진행 표시, 그리고
 * 이어서 진행하기. 문구는 화면이 정해서 넘긴다 — 마감이 걸린 단계는
 * D-day 를 앞에 붙이기 때문에 카드가 스스로 만들 수 없다.
 */
defineProps<{
  current: PlanStage;
  title: string;
  description: string;
}>();

defineEmits<{ resume: [] }>();
</script>

<template>
  <div class="bg-primary-strong rounded-card flex flex-col gap-3.5 p-4.5">
    <div class="flex flex-col gap-1">
      <h2 class="text-stage text-on-brand">{{ title }}</h2>
      <p class="text-caption-tight text-on-brand-body">{{ description }}</p>
    </div>

    <StageTrack :current="current" />

    <button
      type="button"
      class="bg-surface rounded-cta text-card-title text-primary-strong w-full px-4 py-3"
      @click="$emit('resume')"
    >
      이어서 진행 →
    </button>
  </div>
</template>
