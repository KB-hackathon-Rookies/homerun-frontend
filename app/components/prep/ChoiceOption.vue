<script setup lang="ts">
/**
 * 문진 선택지.
 *
 * 고르면 제목만 강조색으로 바뀐다. 테두리나 배경은 그대로다 — 시안이 그렇게
 * 그려져 있고, 선택 표시가 과하면 아직 안 고른 항목이 비활성처럼 보인다.
 */
defineProps<{ title: string; description: string; selected: boolean }>();
</script>

<template>
  <button
    type="button"
    class="bg-surface border-line rounded-field flex w-full flex-col gap-1 border p-4 text-left"
    :aria-pressed="selected"
  >
    <span class="text-option" :class="selected ? 'text-primary-strong' : 'text-ink-hero'">
      {{ title }}
    </span>
    <span class="text-caption2 text-ink-muted">{{ description }}</span>
  </button>
</template>
