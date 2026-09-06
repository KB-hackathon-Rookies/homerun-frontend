<script setup lang="ts">
/**
 * 상태 뱃지.
 *
 * 판정 결과를 한 단어로 보여준다. 배경은 옅게, 글자는 진하게 — 세 톤 모두 같은
 * 규칙이다. 색만으로 뜻이 전달되지 않도록 글자를 반드시 함께 쓴다.
 */
type Tone = 'positive' | 'cautionary' | 'negative';

const { tone = 'positive' } = defineProps<{ tone?: Tone }>();

const TONE_CLASS: Record<Tone, string> = {
  positive: 'bg-badge-success text-success',
  cautionary: 'bg-badge-warning text-warning-strong',
  negative: 'bg-badge-danger text-danger',
};
</script>

<template>
  <span
    class="text-headline2 rounded-pill inline-flex items-center px-2 py-1"
    :class="TONE_CLASS[tone]"
  >
    <slot />
  </span>
</template>
