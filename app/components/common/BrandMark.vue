<script setup lang="ts">
/**
 * 로고. 마름모 하나와 "홈런" 워드마크.
 *
 * 워드마크도 본문과 같은 Pretendard 다 — 한글이라 라틴 폰트로는 그려지지 않는다.
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
