<script setup lang="ts">
import type { IconName } from '~/components/common/AppIcon.vue';

/**
 * 1루·2루 온보딩의 판정 카드.
 *
 * 한 줄이 "내 값 → 기준값 → 충족 여부" 순서다. 화살표는 장식이 아니라
 * 왼쪽을 오른쪽 기준에 대조한다는 뜻이다.
 */
export interface MatchRow {
  icon: IconName;
  /** 내 값. */
  mine: string;
  /** 공고·규칙이 요구하는 값. */
  target: string;
}

defineProps<{ badge: string; rows: MatchRow[] }>();
</script>

<template>
  <AppCard class="flex flex-col gap-2.5 px-4 py-3">
    <span class="bg-surface-brand rounded-pill text-label2 text-primary-deep self-start px-2 py-1">
      {{ badge }}
    </span>

    <div
      v-for="(row, index) in rows"
      :key="row.mine"
      class="flex items-center gap-2.5 py-2"
      :class="index < rows.length - 1 ? 'border-line border-b' : ''"
    >
      <span class="bg-surface-brand size-avatar grid shrink-0 place-items-center rounded-full">
        <AppIcon :name="row.icon" class="text-primary size-4" />
      </span>

      <span class="text-label2 text-ink flex-1">{{ row.mine }}</span>
      <AppIcon name="chevron-right" class="text-ink-subtle size-3.5 shrink-0" />
      <span class="text-label2 text-ink-muted flex-1">{{ row.target }}</span>

      <span class="bg-success grid size-5 shrink-0 place-items-center rounded-full">
        <AppIcon name="check" class="size-3 text-white" />
      </span>
    </div>
  </AppCard>
</template>
