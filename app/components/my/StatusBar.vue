<script setup lang="ts">
import type { Base } from '~/components/common/StepIndicator.vue';

/**
 * 상태 화면의 머리.
 *
 * 상단 바 오른쪽에 무슨 상태인지를 알약으로 붙이고, 그 아래 진행 표시를 둔다.
 * 막힌 화면일수록 "지금 어디에서 막혔는지" 가 먼저 보여야 한다.
 *
 * 진행 표시가 필요 없는 마이 하위 화면은 `base` 를 주지 않는다.
 */
defineProps<{ title: string; badge?: string; base?: Base }>();

defineEmits<{ back: [] }>();
</script>

<template>
  <div class="h-statusbar shrink-0" />

  <header
    class="h-topbar px-gutter-tight border-line bg-surface flex shrink-0 items-center gap-2.5 border-b"
  >
    <button type="button" class="text-ink -ml-1 p-1" aria-label="뒤로" @click="$emit('back')">
      <AppIcon name="chevron-left" class="size-icon" />
    </button>
    <h1 class="text-headline2 text-ink flex-1">{{ title }}</h1>
    <AppBadge v-if="badge" tone="brand">{{ badge }}</AppBadge>
  </header>

  <div
    v-if="base"
    class="px-gutter-tight border-line bg-surface flex shrink-0 items-center border-b py-2"
  >
    <StepIndicator :current="base" spread />
  </div>
</template>
