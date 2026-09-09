<script setup lang="ts">
import type { Base } from '~/components/common/StepIndicator.vue';

/**
 * 진단·상세 화면의 머리.
 *
 * 상단 바와 진행 표시가 한 몸으로 붙어 다닌다. 1루·2루의 모든 화면이 같은
 * 모양이라 한 곳에 둔다 — 화면마다 베껴 두면 어느 한 곳만 어긋난다.
 *
 * 상단의 HomeRun 로고는 어느 화면에서나 홈으로 가는 문이다. 세부 화면 이름과
 * 뒤로가기는 그 아래 줄에 따로 둔다. 한 줄에 모두 몰아넣으면 긴 제목과 홈 이동이
 * 서로 밀려, 깊은 화면일수록 나가기가 어려워진다.
 */
defineProps<{ title: string; base: Base }>();

defineEmits<{ back: [] }>();
</script>

<template>
  <div class="h-statusbar shrink-0" />

  <BrandBar bordered />

  <header
    class="h-topbar px-gutter-tight border-line bg-surface flex shrink-0 items-center gap-2.5 border-b"
  >
    <button type="button" class="text-ink -ml-1 p-1" aria-label="뒤로" @click="$emit('back')">
      <AppIcon name="chevron-left" class="size-icon" />
    </button>

    <h1 class="text-headline2 text-ink-hero min-w-0 flex-1 truncate">{{ title }}</h1>
  </header>

  <BaseStrip :base="base" />
</template>
