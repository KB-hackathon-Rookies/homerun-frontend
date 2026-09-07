<script setup lang="ts">
/**
 * 마이의 한 줄. 왼쪽에 이름, 오른쪽에 값과 화살표.
 *
 * 마지막 줄은 아래 선을 지운다 — 카드 테두리와 겹쳐 두 줄로 보인다.
 */
defineProps<{ label: string; value?: string; last?: boolean }>();

defineEmits<{ select: [] }>();
</script>

<template>
  <button
    type="button"
    class="h-row flex w-full items-center justify-between py-3.5"
    :class="last ? '' : 'border-line-soft border-b'"
    @click="$emit('select')"
  >
    <span class="text-headline2 text-ink">{{ label }}</span>
    <span class="flex items-center gap-1.5">
      <span v-if="value" class="text-label2 text-ink-muted">{{ value }}</span>
      <AppIcon name="chevron-right" class="text-ink-muted size-4" />
    </span>
  </button>
</template>
