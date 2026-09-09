<script setup lang="ts">
/**
 * 상태 뱃지.
 *
 * 판정 결과를 한 단어로 보여준다. 색만으로 뜻이 전달되지 않도록 글자를 반드시
 * 함께 쓴다.
 *
 * 채움이 둘이다. 옅은 배경(`soft`)은 카드 안에서 조용히 붙는 자리고, 꽉 찬
 * 배경(`solid`)은 카드마다 하나씩 달려 목록을 훑을 때 눈에 걸려야 하는 자리다.
 * 1루 결과 목록이 뒤쪽이다.
 */
type Tone = 'positive' | 'cautionary' | 'negative' | 'informative' | 'brand';

const { tone = 'positive', fill = 'soft' } = defineProps<{
  tone?: Tone;
  fill?: 'soft' | 'solid';
}>();

const SOFT: Record<Tone, string> = {
  positive: 'bg-badge-success text-success',
  cautionary: 'bg-badge-warning text-warning-strong',
  negative: 'bg-badge-danger text-danger',
  informative: 'bg-surface-brand text-primary-deep',
  /** 판정이 아니라 화면 상태를 말하는 자리. 마이·상태 화면이 쓴다. */
  brand: 'bg-surface-info text-primary-deep',
};

const SOLID: Record<Tone, string> = {
  positive: 'bg-success text-white',
  cautionary: 'bg-warning-strong text-white',
  negative: 'bg-danger text-white',
  informative: 'bg-primary-strong text-white',
  brand: 'bg-primary-strong text-white',
};
</script>

<template>
  <span
    class="text-caption1 rounded-pill inline-flex shrink-0 items-center px-2.5 py-1"
    :class="fill === 'solid' ? SOLID[tone] : SOFT[tone]"
  >
    <slot />
  </span>
</template>
