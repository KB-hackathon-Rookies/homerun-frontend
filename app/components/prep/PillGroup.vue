<script setup lang="ts">
/**
 * 알약 선택.
 *
 * 답이 적을 때 목록 대신 나란히 놓는다. 고른 쪽만 채운다.
 *
 * 두 가지 크기가 있다. 시안이 자리에 따라 다르게 그려 놓았다.
 *
 * - `chip` — 진단 문진. 알약이 여섯이라 작고, 줄이 넘어가면 위아래로도 벌어진다.
 * - `block` — 독립 준비의 전세·월세. 답이 둘뿐이고 화면에서 가장 중요한 선택이라
 *   폭을 반씩 갈라 크게 놓는다. 고른 쪽이 흰 바탕 + 파란 테두리고, 안 고른 쪽이
 *   회색 바탕이다 — chip 과 채움 방향이 반대다.
 */
export interface PillOption {
  value: string;
  label: string;
}

const { options, variant = 'chip' } = defineProps<{
  options: PillOption[];
  variant?: 'chip' | 'block';
}>();

const model = defineModel<string | null>({ default: null });

const block = computed(() => variant === 'block');
</script>

<template>
  <div class="flex items-center" :class="block ? 'w-full gap-2.5' : 'flex-wrap gap-2'">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="flex items-center justify-center transition-colors"
      :class="[
        block ? 'rounded-button h-18 flex-1 px-4' : 'rounded-pill h-pill px-5',
        block
          ? model === option.value
            ? 'bg-surface border-primary-strong text-choice text-primary-strong border-hairline'
            : 'bg-surface-muted text-choice text-ink-label'
          : model === option.value
            ? 'bg-primary-strong text-numeric text-white'
            : 'bg-surface border-line text-numeric text-ink-hero border font-medium',
      ]"
      :aria-pressed="model === option.value"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
