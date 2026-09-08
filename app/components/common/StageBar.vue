<script setup lang="ts">
import type { Base } from '~/components/common/StepIndicator.vue';

/**
 * 진단 화면의 머리.
 *
 * 상단 바와 진행 표시가 한 몸으로 붙어 다닌다. 1루·2루의 모든 화면이 같은
 * 모양이라 한 곳에 둔다 — 화면마다 베껴 두면 어느 한 곳만 어긋난다.
 *
 * 뒤로가기는 화면이 정한다. 브라우저 기록을 되감으면 방금 저장한 단계로
 * 돌아가 버리는 자리가 있어서다.
 */
defineProps<{ title: string; base: Base }>();

defineEmits<{ back: [] }>();
</script>

<template>
  <div class="h-statusbar shrink-0" />

  <header
    class="h-topbar px-gutter-tight border-line bg-surface flex shrink-0 items-center gap-2.5 border-b"
  >
    <button type="button" class="text-ink -ml-1 p-1" aria-label="뒤로" @click="$emit('back')">
      <AppIcon name="chevron-left" class="size-icon" />
    </button>
    <h1 class="text-headline2 text-ink-hero">{{ title }}</h1>

    <!--
      피그마의 상단 바에는 마이·홈 아이콘이 늘 붙어 있다. 이게 빠져 있어서
      여정 화면에서 나가려면 뒤로가기를 단계 수만큼 눌러야 했다 — 3루 안쪽에서는
      열다섯 번을 눌러도 홈에 닿지 못했다. 45개 화면이 이 머리를 함께 쓰므로
      여기 한 번만 두면 어디서든 한 번에 나갈 수 있다.
    -->
    <div class="flex-1" />
    <button type="button" class="text-ink p-1" aria-label="마이" @click="navigateTo('/my')">
      <AppIcon name="user" class="size-icon" />
    </button>
    <button type="button" class="text-ink -mr-1 p-1" aria-label="홈" @click="navigateTo('/home')">
      <AppIcon name="home" class="size-icon" />
    </button>
  </header>

  <BaseStrip :base="base" />
</template>
