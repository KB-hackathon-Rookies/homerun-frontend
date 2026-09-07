<script setup lang="ts">
/**
 * 제목이 붙은 카드.
 *
 * 마이 화면 전체가 이 카드의 나열이다. 테두리 색으로 급한 정도를 말한다 —
 * 기본은 회색, 챙길 것은 주황, 막고 있는 것은 빨강.
 */
const { title = '', tone = 'plain' } = defineProps<{
  title?: string;
  tone?: 'plain' | 'warn' | 'bad';
}>();

const BORDER = {
  plain: 'border-line',
  warn: 'border-warning-strong',
  bad: 'border-danger',
};
</script>

<template>
  <section class="bg-surface rounded-card flex flex-col gap-3 border p-4" :class="BORDER[tone]">
    <div v-if="title || $slots.badge" class="flex items-center gap-2">
      <h2 v-if="title" class="text-headline2 text-ink flex-1">{{ title }}</h2>
      <slot name="badge" />
    </div>
    <slot />
  </section>
</template>
