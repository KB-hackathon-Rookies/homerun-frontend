<script setup lang="ts">
/**
 * 가로 진행 막대. 온보딩 3루(잔금 진행률)와 홈(정착 경과)이 쓴다.
 *
 * 색이 두 가지다. 진행 중인 일은 파랑, 이미 안착한 일은 초록으로 칠한다.
 */
const { value, tone = 'primary' } = defineProps<{
  /** 0 부터 1 사이. 범위를 벗어난 값은 잘라낸다. */
  value: number;
  tone?: 'primary' | 'success';
}>();

const width = computed(() => `${Math.min(Math.max(value, 0), 1) * 100}%`);
</script>

<template>
  <div class="bg-line-soft rounded-pill h-1.5 w-full overflow-hidden">
    <div
      class="rounded-pill h-full"
      :class="tone === 'success' ? 'bg-success' : 'bg-primary-strong'"
      :style="{ width }"
    />
  </div>
</template>
