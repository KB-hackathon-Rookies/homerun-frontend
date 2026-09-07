<script setup lang="ts">
/**
 * 결과 화면 위에 붙는 한 줄.
 *
 * 막지는 않되 알려야 하는 것들이다 — 지침이 개정됐다거나 자격 기한이
 * 다가온다거나. 눌러서 자세히 볼 수 있게 두고, 화면 흐름은 끊지 않는다.
 */
const { tone = 'warn' } = defineProps<{ tone?: 'warn' | 'danger' }>();

defineEmits<{ open: [] }>();

const TONE = {
  warn: 'bg-badge-warning text-warning-strong',
  danger: 'bg-badge-danger text-danger',
};
</script>

<template>
  <button
    type="button"
    class="rounded-cta flex w-full items-center gap-2 px-3 py-2.5 text-left"
    :class="TONE[tone]"
    @click="$emit('open')"
  >
    <span class="text-label2 flex-1"><slot /></span>
    <AppIcon name="chevron-right" class="size-4 shrink-0" />
  </button>
</template>
