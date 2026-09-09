<script setup lang="ts">
/**
 * 코치 팁.
 *
 * 3루 화면마다 맨 위에 붙는다. 여기서 하는 말은 안내지 판정이 아니다 —
 * 반말인 것도 코치가 옆에서 거드는 자리라서다.
 */
const { label = undefined, tone = 'info' } = defineProps<{
  /** 시안 대부분은 라벨 없이 문단 하나다. 라벨이 있는 화면만 넘긴다. */
  label?: string;
  tone?: 'info' | 'plain';
}>();
</script>

<template>
  <div
    class="rounded-field flex flex-col gap-1 p-3.5"
    :class="tone === 'info' ? 'bg-surface-info' : 'bg-surface-brand'"
  >
    <p
      v-if="label"
      class="text-caption1"
      :class="tone === 'info' ? 'text-primary-strong' : 'text-ink-hero'"
    >
      {{ label }}
    </p>
    <p class="text-caption2 text-ink-hero-body"><slot /></p>
  </div>
</template>
