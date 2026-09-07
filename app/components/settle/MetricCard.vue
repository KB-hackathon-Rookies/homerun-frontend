<script setup lang="ts">
/**
 * 지표 한 장.
 *
 * 값을 못 구했으면 숫자 자리에 "—" 를 두고 왜 없는지를 아래 줄에 적는다.
 * 0 원으로 채우면 계산이 끝난 것처럼 보인다.
 */
defineProps<{ label: string; value: string; note: string }>();
</script>

<template>
  <div class="bg-surface border-line rounded-field flex flex-1 flex-col gap-1 border p-3">
    <span class="text-step text-ink-hero-body font-normal">{{ label }}</span>
    <span class="text-metric text-ink-hero">{{ value }}</span>
    <span class="text-chip text-ink-hero-body font-normal">{{ note }}</span>
  </div>
</template>
