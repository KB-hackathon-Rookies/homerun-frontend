<script setup lang="ts">
/**
 * 제목 아래 설명이 붙는 줄.
 *
 * `RowChevron` 은 오른쪽에 값을 두는데, 여기는 설명이 길어 아래로 내린다.
 * 상태 화면의 "지금 할 수 있는 것" 이 이 모양이다.
 */
defineProps<{ label: string; description: string }>();

defineEmits<{ select: [] }>();
</script>

<template>
  <button type="button" class="flex w-full flex-col gap-1 py-3 text-left" @click="$emit('select')">
    <span class="flex items-center justify-between gap-2">
      <span class="text-headline2 text-ink">{{ label }}</span>
      <AppIcon name="chevron-right" class="text-ink-muted size-4 shrink-0" />
    </span>
    <span class="text-label2 text-ink-muted">{{ description }}</span>
  </button>
</template>
