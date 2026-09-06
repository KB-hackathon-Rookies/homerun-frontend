<script setup lang="ts">
/**
 * 홈(정착) 온보딩의 상태 카드.
 *
 * 3루 카드와 달리 할 일이 아니라 "지금 어떤 상태인가"를 보여준다. 그래서 진행 막대가
 * 초록이고, 줄마다 왼쪽이 항목 이름, 오른쪽이 값이다.
 */
export interface SettleRow {
  label: string;
  value: string;
}

defineProps<{ label: string; value: string; progress: number; rows: SettleRow[] }>();
</script>

<template>
  <AppCard radius="button" class="flex flex-col gap-4 px-4 py-3">
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-label2 text-ink-body">{{ label }}</span>
        <span class="text-numeric text-ink">{{ value }}</span>
      </div>
      <ProgressBar :value="progress" tone="success" />
    </div>

    <div class="flex flex-col gap-2">
      <div
        v-for="row in rows"
        :key="row.label"
        class="border-line-soft flex items-center justify-between border-b pb-2"
      >
        <span class="text-label2 text-ink-muted">{{ row.label }}</span>
        <span class="text-numeric text-ink">{{ row.value }}</span>
      </div>
    </div>
  </AppCard>
</template>
