<script setup lang="ts">
/**
 * 1루 · 2루 · 3루 · 홈 진행 표시.
 *
 * 야구 비유가 이 서비스의 뼈대라 온보딩부터 계속 나온다.
 *
 * 상태가 셋이다. 피그마에서 크기까지 다르다.
 *
 * | 상태 | 마름모 | 라벨 |
 * |---|---|---|
 * | 지난 단계 | 8px 채움 | 흐림 |
 * | 지금 단계 | **11px** 채움 | 브랜드색 |
 * | 남은 단계 | 8px 테두리만 | 흐림 |
 *
 * 지금 단계만 커진다. 같은 크기로 두면 어디까지 왔는지 한눈에 안 들어온다.
 *
 * 테두리는 1px 이다. 피그마에는 1px 과 1.5px 이 섞여 있는데(같은 마름모인데 화면마다
 * 다르다) 8px 도형에서 0.5px 차이는 보이지 않는다. Tailwind 기본값으로 맞춘다.
 */
const BASES = ['1루', '2루', '3루', '홈'] as const;

export type Base = (typeof BASES)[number];

/** 아직 아무 단계도 시작하지 않았으면 `null` 이다. 웰컴 화면이 그렇다. */
const { current = null } = defineProps<{
  current?: Base | null;
}>();

const currentIndex = computed(() => (current ? BASES.indexOf(current) : -1));

const steps = computed(() =>
  BASES.map((label, index) => ({
    label,
    done: currentIndex.value > index,
    active: currentIndex.value === index,
  })),
);
</script>

<template>
  <div class="flex items-center gap-2">
    <template v-for="(step, index) in steps" :key="step.label">
      <!-- 이음선은 앞 단계를 지나왔을 때만 색이 찬다. -->
      <span
        v-if="index > 0"
        class="h-0.5 w-step-link rounded-sm"
        :class="step.done || step.active ? 'bg-primary-strong' : 'bg-line-soft'"
      />

      <span class="flex items-center gap-1.5">
        <span
          class="rotate-45 rounded-sm"
          :class="[
            step.active ? 'size-step-diamond' : 'size-2',
            step.done || step.active ? 'bg-primary-strong' : 'border-line-strong border',
          ]"
        />
        <span
          class="text-caption1"
          :class="step.active ? 'text-primary-strong' : 'text-ink-subtle'"
        >
          {{ step.label }}
        </span>
      </span>
    </template>
  </div>
</template>
