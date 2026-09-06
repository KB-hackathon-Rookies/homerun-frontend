<script setup lang="ts">
/**
 * 화면 하단 CTA.
 *
 * 피그마가 하단 버튼을 두 벌로 그려 놓았다. 완료 화면은 56/12, 문진은 51/14 고
 * 색도 다르다. 한쪽에 맞추면 다른 쪽이 틀어져서 변형으로 나눠 뒀다.
 *
 * 앞서 만든 `AppButton`(58/14)까지 하면 하단 버튼 높이가 셋이다. 시안이 그렇다.
 *
 * 색은 한 곳에서 정한다. 모양(크기·반경)은 변형이, 색은 활성 여부가 정한다.
 */
type Variant = 'deep' | 'accent';

const { variant = 'deep', disabled = false } = defineProps<{
  variant?: Variant;
  disabled?: boolean;
}>();

/** 크기와 반경은 변형이 정한다. 색은 활성 여부가 정한다. */
const SHAPE_CLASS: Record<Variant, string> = {
  deep: 'rounded-field h-cta text-base',
  accent: 'rounded-button h-cta-step text-option',
};

const TONE_CLASS: Record<Variant, string> = {
  deep: 'bg-primary-deep text-white',
  accent: 'bg-accent text-white',
};

const tone = computed(() =>
  disabled ? 'bg-disabled-soft text-ink-on-disabled' : TONE_CLASS[variant],
);
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="w-full font-semibold transition-colors"
    :class="[SHAPE_CLASS[variant], tone]"
  >
    <slot />
  </button>
</template>
