<script setup lang="ts">
/**
 * 주 버튼.
 *
 * 피그마의 모든 화면에서 높이 58 · 반경 14 로 같다. 화면마다 이 마크업을 다시 쓰면
 * 한 곳만 바뀌었을 때 나머지가 어긋난다.
 */
type Variant = 'solid' | 'strong' | 'white' | 'kakao';

const {
  variant = 'solid',
  type = 'button',
  disabled = false,
} = defineProps<{
  variant?: Variant;
  type?: 'button' | 'submit';
  disabled?: boolean;
}>();

/** 배경과 글자색만 변형마다 다르다. 크기·반경·타이포는 공통이다. */
const VARIANT_CLASS: Record<Variant, string> = {
  solid: 'bg-primary text-white',
  strong: 'bg-primary-strong-soft text-white',
  white: 'bg-surface text-ink-strong border border-line',
  kakao: 'bg-kakao text-ink-strong',
};
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="text-headline1 rounded-button h-button flex w-full items-center justify-center gap-2.5 disabled:opacity-40"
    :class="VARIANT_CLASS[variant]"
  >
    <slot />
  </button>
</template>
