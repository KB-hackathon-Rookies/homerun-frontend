<script setup lang="ts">
/**
 * 홈 정착 하위 화면의 돌아가기.
 *
 * 홈에서는 하단 탭을 쓰지 않으므로, 세부 작업을 마친 뒤 한 번에 정착 대시보드로
 * 돌아갈 수 있는 길을 화면 머리에 둔다.
 */
const { planId, title } = defineProps<{ planId: number; title: string }>();
</script>

<template>
  <button
    type="button"
    class="text-question text-ink-card -ml-1 flex min-h-9 items-center gap-1 px-1 text-left"
    aria-label="홈으로 돌아가기"
    @click="navigateTo(`/settle/${planId}`)"
  >
    <AppIcon name="chevron-left" class="size-5" />
    <span>{{ title }}</span>
  </button>
</template>
