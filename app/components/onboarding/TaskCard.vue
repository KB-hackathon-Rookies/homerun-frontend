<script setup lang="ts">
/**
 * 3루 온보딩의 실행 카드.
 *
 * 할 일에 상태가 셋이다. 끝난 일은 초록 체크에 취소선, 지금 할 일은 번호가 붙은
 * 파란 원, 아직 못 여는 일은 자물쇠다. 순서가 정해져 있다는 걸 이 세 모양으로 말한다.
 */
export interface Task {
  title: string;
  meta: string;
  state: 'done' | 'current' | 'locked';
}

defineProps<{ label: string; value: string; progress: number; tasks: Task[] }>();
</script>

<template>
  <AppCard radius="button" class="flex flex-col gap-4.5 px-4 py-3">
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-label2 text-ink-body">{{ label }}</span>
        <span class="text-numeric text-primary-strong">{{ value }}</span>
      </div>
      <ProgressBar :value="progress" />
    </div>

    <div class="flex flex-col gap-3.5">
      <div
        v-for="(task, index) in tasks"
        :key="task.title"
        class="flex items-center gap-2.5 pb-2"
        :class="index < tasks.length - 1 ? 'border-line border-b' : ''"
      >
        <span
          class="size-avatar grid shrink-0 place-items-center rounded-full"
          :class="{
            'bg-success': task.state === 'done',
            'bg-primary-strong': task.state === 'current',
            'bg-line': task.state === 'locked',
          }"
        >
          <AppIcon v-if="task.state === 'done'" name="check" class="size-4 text-white" />
          <span v-else-if="task.state === 'current'" class="text-caption1 text-white">
            {{ index + 1 }}
          </span>
          <AppIcon v-else name="lock" class="text-ink-muted size-3.5" />
        </span>

        <span class="flex flex-1 flex-col gap-0.5">
          <span class="text-numeric text-ink" :class="task.state === 'done' ? 'line-through' : ''">
            {{ task.title }}
          </span>
          <span class="text-caption1 text-ink-muted">{{ task.meta }}</span>
        </span>
      </div>
    </div>
  </AppCard>
</template>
