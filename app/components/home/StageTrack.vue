<script setup lang="ts">
import type { PlanStage } from '~/api/dashboard';
import { STAGE_NODES, nodeLabel, nodeState } from '~/utils/stage';

/**
 * 홈 진행 카드 안의 1루 → 홈 표시.
 *
 * 지난 칸은 흰 원에 체크, 지금 칸은 흰 원에 번호, 안 온 칸은 옅은 원이다.
 * 이음선도 같은 규칙으로 지난 곳만 진하다.
 *
 * 1루 안의 진행 표시(`StepIndicator`)와 모양이 비슷하지만 그건 흰 바탕 위,
 * 이건 파란 바탕 위다. 색 규칙이 반대라 한 컴포넌트로 묶지 않았다.
 */
const { current } = defineProps<{ current: PlanStage }>();

const nodes = computed(() =>
  STAGE_NODES.map((stage, index) => {
    const state = nodeState(stage, current);
    return {
      stage,
      state,
      label: nodeLabel(stage, state),
      order: index + 1,
      last: index === STAGE_NODES.length - 1,
    };
  }),
);
</script>

<template>
  <div class="flex items-center justify-between">
    <template v-for="node in nodes" :key="node.stage">
      <div class="flex flex-col items-center gap-1.5">
        <span
          class="size-step-circle rounded-pill flex items-center justify-center"
          :class="node.state === 'upcoming' ? 'bg-on-brand-fill' : 'bg-on-brand'"
        >
          <AppIcon v-if="node.state === 'done'" name="check" class="text-primary-strong size-3.5" />
          <span
            v-else
            class="text-numeral"
            :class="node.state === 'current' ? 'text-primary-strong' : 'text-on-brand-dim'"
          >
            {{ node.order }}
          </span>
        </span>

        <span
          class="text-step whitespace-nowrap"
          :class="node.state === 'upcoming' ? 'text-on-brand-dim' : 'text-on-brand'"
        >
          {{ node.label }}
        </span>
      </div>

      <span
        v-if="!node.last"
        class="w-step-link rounded-pill h-0.5 shrink-0"
        :class="node.state === 'done' ? 'bg-on-brand' : 'bg-on-brand-line'"
      />
    </template>
  </div>
</template>
