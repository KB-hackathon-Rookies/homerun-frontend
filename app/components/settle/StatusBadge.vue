<script setup lang="ts">
/**
 * 알약 배지.
 *
 * 4루 화면 전체가 이 배지로 상태를 말한다 — 담보별 가입 필요 여부, 지원
 * 대상 여부, 남은 날. 색이 뜻을 가지므로 화면마다 다시 칠하지 않는다.
 *
 * `solid` 는 색을 꽉 채우고 `soft` 는 같은 색을 옅게 깐다. 표 안에서는 옅게,
 * 줄 앞에 붙을 때는 꽉 채운다.
 */
export type BadgeTone = 'safe' | 'caution' | 'danger' | 'info' | 'meta';

const { tone, fill = 'solid' } = defineProps<{
  tone: BadgeTone;
  fill?: 'solid' | 'soft';
}>();

const SOLID: Record<BadgeTone, string> = {
  safe: 'bg-safe text-white',
  caution: 'bg-caution-deep text-white',
  danger: 'bg-danger-deep text-white',
  info: 'bg-info text-white',
  meta: 'bg-ink-meta text-white',
};

const SOFT: Record<BadgeTone, string> = {
  safe: 'bg-safe-soft text-safe',
  caution: 'bg-caution-deep-soft text-caution-deep',
  danger: 'bg-danger-soft text-danger-deep',
  info: 'bg-primary-soft text-primary-strong',
  meta: 'bg-meta-soft text-ink-meta',
};
</script>

<template>
  <span
    class="text-step rounded-chip-sm shrink-0 px-2"
    :class="[fill === 'solid' ? SOLID[tone] : SOFT[tone], fill === 'solid' ? 'py-1' : 'py-0.5']"
  >
    <slot />
  </span>
</template>
