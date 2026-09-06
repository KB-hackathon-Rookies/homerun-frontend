<script setup lang="ts">
/**
 * 로고. 마름모 하나와 "홈런" 워드마크.
 *
 * 워드마크만 Work Sans 를 쓴다. 나머지 글자는 전부 Pretendard 다.
 * 스플래시는 마름모를 세우지 않고(`tilted: false`), 웰컴 화면은 45도 눕힌다.
 */
const { tilted = false, wordmark = true } = defineProps<{
  tilted?: boolean;
  wordmark?: boolean;
}>();
</script>

<template>
  <span class="flex items-center gap-2">
    <span
      class="bg-primary size-brand shrink-0"
      :class="tilted ? 'rotate-45 rounded-sm' : 'rounded-chip'"
    />
    <span v-if="wordmark" class="font-logo text-ink text-xl leading-none font-bold tracking-tight">
      홈런
    </span>
  </span>
</template>
