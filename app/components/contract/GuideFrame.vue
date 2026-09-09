<script setup lang="ts">
import type { CoachSheet } from '~/components/coach/sheet';
import { coachStageFor } from '~/utils/stage';

/**
 * 상세 화면 껍데기.
 *
 * 본 화면과 다르다 — 진행 표시가 없고 배경이 옅다. 여기는 **읽기만 하는
 * 곁길**이라 3루 어디까지 왔는지를 다시 보여줄 이유가 없다. 본 화면에서
 * "상세보기" 로 들어와 다시 나가는 자리다.
 *
 * FAB 코치는 본 화면과 마찬가지로 여기서도 뜬다 — 상세를 읽는 도중에 궁금한
 * 걸 물으려면 본 화면으로 돌아갈 필요가 없어야 한다. 시트는 본 화면과 같은
 * 것을 그대로 물려받아 넘긴다.
 */
const props = defineProps<{ title: string; coachSheets?: CoachSheet[] }>();

defineEmits<{ back: [] }>();

const route = useRoute();
const stage = computed(() => coachStageFor(route.path));

// 헤더 제목을 브라우저 탭 제목으로도 쓴다.
useHead(() => ({ title: props.title }));
</script>

<template>
  <div
    class="bg-surface max-w-screen rounded-screen mx-auto flex h-dvh w-full flex-col overflow-hidden"
  >
    <div class="bg-surface h-statusbar shrink-0" />

    <BrandBar />

    <header
      class="bg-surface px-gutter-tight border-line flex shrink-0 items-center gap-3 border-b py-2.5"
    >
      <button
        type="button"
        class="text-ink-hero -ml-1 p-1"
        aria-label="뒤로"
        @click="$emit('back')"
      >
        <AppIcon name="chevron-left" class="size-icon" />
      </button>
      <h1 class="text-option text-ink-hero">{{ title }}</h1>
    </header>

    <!-- 가운데만 스크롤. 스크롤바는 숨긴다. -->
    <div
      class="bg-canvas-soft scrollbar-hide flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-gutter-tight py-4 pb-6"
    >
      <slot />
    </div>

    <footer class="bg-surface px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <slot name="cta" />
    </footer>

    <CoachDock v-if="stage" :stage="stage" :sheets="coachSheets ?? []" above-footer />
  </div>
</template>
