<script setup lang="ts">
/**
 * "상세보기 →" 버튼.
 *
 * 본 화면은 할 일만 짧게 두고, 왜 그런지는 눌러서 본다. 다 펼치면 화면이
 * 길어져서 정작 지금 할 일이 안 보인다.
 */
defineEmits<{ open: [] }>();
</script>

<template>
  <div class="flex justify-center py-1">
    <button
      type="button"
      class="bg-surface-info border-focus-line rounded-chip text-body3 text-primary-deep border px-3.5 py-2.5 font-semibold"
      @click="$emit('open')"
    >
      <slot /> →
    </button>
  </div>
</template>
