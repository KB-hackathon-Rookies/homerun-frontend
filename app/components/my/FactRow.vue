<script setup lang="ts">
/**
 * 라벨 한 칸, 값 한 칸.
 *
 * 마이와 상태 화면이 사실을 늘어놓는 기본 단위다. 값의 색이 뜻을 갖는다 —
 * 초록은 그대로 둬도 되는 것, 주황은 챙겨야 하는 것, 빨강은 막고 있는 것.
 */
export type FactTone = 'plain' | 'good' | 'warn' | 'bad';

const { tone = 'plain' } = defineProps<{ label: string; value: string; tone?: FactTone }>();

const VALUE_TONE: Record<FactTone, string> = {
  plain: 'text-ink',
  good: 'text-success',
  warn: 'text-warning-strong',
  bad: 'text-danger',
};
</script>

<template>
  <div class="flex items-start gap-2.5">
    <span class="text-label2 text-ink-muted shrink-0">{{ label }}</span>
    <span class="text-numeric flex-1" :class="VALUE_TONE[tone]">{{ value }}</span>
  </div>
</template>
