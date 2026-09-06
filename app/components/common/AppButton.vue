<script setup lang="ts">
/**
 * 주 버튼.
 *
 * 크기·반경·타이포는 변형마다 같다. 배경과 글자색, 그리고 눌렀을 때·비활성일 때
 * 어떻게 보이는지만 다르다. 상태값은 피그마 컴포넌트 표에서 그대로 가져왔다.
 *
 * 비활성은 투명도를 낮추지 않고 회색으로 바꾼다. 투명도만 낮추면 배경에 따라
 * 대비가 들쭉날쭉해진다.
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

const VARIANT_CLASS: Record<Variant, string> = {
  solid: 'bg-primary text-white hover:bg-primary-strong active:bg-primary-press',
  strong: 'bg-primary-strong-soft text-white hover:bg-primary-strong active:bg-primary-press',
  white:
    'bg-surface text-ink-strong border-line border hover:bg-surface-hover active:bg-surface-press',
  kakao: 'bg-kakao text-ink-strong hover:bg-kakao-hover active:bg-kakao-press',
};

/**
 * 비활성 배경은 변형과 상관없이 같은 회색이다. 글자색만 다르다 — 흰 버튼은
 * 비활성이어도 검은 글자를 쓴다(피그마 컴포넌트 표).
 */
const tone = computed(() => {
  if (!disabled) return VARIANT_CLASS[variant];
  return variant === 'white' ? 'bg-disabled text-ink-strong' : 'bg-disabled text-white';
});

/** 포커스 링도 변형을 따라간다. 카카오·구글만 테두리로 표시한다. */
const FOCUS_CLASS: Record<Variant, string> = {
  solid: 'focus-visible:ring-2 focus-visible:ring-focus',
  strong: 'focus-visible:ring-2 focus-visible:ring-focus',
  white: 'focus-visible:ring-1 focus-visible:ring-focus-line',
  kakao: 'focus-visible:bg-kakao-focus focus-visible:ring-1 focus-visible:ring-focus-line',
};
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="text-headline1 rounded-button h-button flex w-full items-center justify-center gap-2.5 transition-colors outline-none"
    :class="[tone, FOCUS_CLASS[variant]]"
  >
    <slot />
  </button>
</template>
