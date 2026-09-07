<script setup lang="ts">
import { COACH_MODULES, MODULE_BASES } from '~/components/coach/modules';
import { useCoachProgress } from '~/composables/useCoachProgress';

/**
 * 메인 6 · 코치 교육 허브.
 *
 * 모듈을 루별로 묶어 보여준다. 지금 열 수 있는 건 본문이 있는 둘뿐이고,
 * 나머지는 목록에 두되 눌러도 "준비 중" 이 뜬다.
 */
definePageMeta({ middleware: 'auth' });

const { isDone } = useCoachProgress();

const groups = computed(() =>
  MODULE_BASES.map((base) => ({
    base,
    modules: COACH_MODULES.filter((module) => module.base === base),
  })),
);

const doneCount = computed(() => COACH_MODULES.filter((module) => isDone(module.id)).length);
const percent = computed(() => Math.round((doneCount.value / COACH_MODULES.length) * 100));
</script>

<template>
  <PhoneFrame>
    <PageBar title="전세 코치" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 py-4">
      <AppCard class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <h1 class="text-headline2 text-ink-hero">전세 코치 교육</h1>
          <p class="text-caption2 text-ink-hero-body">
            루마다 필요한 순간에 코치가 알려주는 내용을 미리 볼 수 있어요.
          </p>
        </div>

        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <span class="text-step text-ink-hero-body">모듈 {{ COACH_MODULES.length }}개</span>
            <span class="text-step text-primary-strong font-medium">{{ doneCount }}개 완료</span>
          </div>
          <div class="bg-surface-press rounded-pill h-1.5 overflow-hidden">
            <div class="bg-primary-strong h-full rounded-pill" :style="{ width: `${percent}%` }" />
          </div>
        </div>
      </AppCard>

      <section v-for="group in groups" :key="group.base" class="flex flex-col gap-2">
        <h2 class="text-section text-ink-hero px-1">{{ group.base }}</h2>

        <AppCard class="flex flex-col gap-0 px-4 py-0">
          <button
            v-for="(module, index) in group.modules"
            :key="module.id"
            type="button"
            class="border-line-soft flex items-center gap-3 py-3.5 text-left"
            :class="index === group.modules.length - 1 ? '' : 'border-b'"
            @click="navigateTo(`/coach/${module.id}`)"
          >
            <span
              class="rounded-pill flex size-6 shrink-0 items-center justify-center"
              :class="
                isDone(module.id)
                  ? 'bg-badge-success text-success'
                  : 'bg-surface-press text-ink-muted'
              "
            >
              <AppIcon v-if="isDone(module.id)" name="check" class="size-3.5" />
              <span v-else class="text-micro font-medium">{{ index + 1 }}</span>
            </span>

            <span class="flex flex-1 flex-col gap-0.5">
              <span class="text-row text-ink-hero">{{ module.title }}</span>
              <span class="text-step text-ink-muted font-normal">
                {{ module.minutes }}분<template v-if="isDone(module.id)"> · 완료</template>
                <template v-else-if="!module.body"> · 준비 중</template>
              </span>
            </span>

            <AppIcon name="chevron-right" class="text-ink-muted size-4 shrink-0" />
          </button>
        </AppCard>
      </section>
    </div>
  </PhoneFrame>
</template>
