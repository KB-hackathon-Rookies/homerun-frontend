<script setup lang="ts">
/**
 * 워드마크와 내 정보·홈이 있는 상단 바.
 *
 * 시안 메인 1~10 이 전부 이 줄로 시작한다. 홈은 이것만 쓰고, 하위 화면은
 * 아래에 제목 줄(`PageBar`)을 한 겹 더 얹는다 — 그때는 아래 선을 제목 줄이
 * 가지므로 이 줄에는 긋지 않는다.
 *
 * 뒤로가기가 붙는 `TopBar`·`PageBar` 와는 다른 물건이라 따로 둔다.
 */
const { bordered = false } = defineProps<{
  /** 아래 구분선. 이 줄로 상단이 끝날 때만 켠다. */
  bordered?: boolean;
}>();
</script>

<template>
  <header
    class="h-topbar-tall px-gutter bg-surface flex shrink-0 items-center gap-3.5"
    :class="bordered ? 'border-line border-b' : ''"
  >
    <span class="text-hero text-primary-strong italic">HomeRun</span>
    <span class="flex-1" />

    <button type="button" class="p-0.5" aria-label="내 정보" @click="navigateTo('/my')">
      <AppIcon name="user" class="text-ink-hero size-6" />
    </button>
    <button type="button" class="p-0.5" aria-label="홈" @click="navigateTo('/home')">
      <AppIcon name="home" class="text-ink-hero size-6" />
    </button>
  </header>
</template>
