<script setup lang="ts">
/**
 * 아래 선이 있는 상단 바.
 *
 * 오픈뱅킹 화면들이 쓴다. 앞서 만든 `TopBar` 와 달리 좌우 여백이 16 이고 아래에
 * 구분선이 있다. 같은 컴포넌트에 옵션을 붙이는 대신 나눠 뒀다 — 두 종류가
 * 섞이면 어느 화면이 어느 규칙인지 알 수 없게 된다.
 */
const { title = '' } = defineProps<{ title?: string }>();

const router = useRouter();
</script>

<template>
  <header
    class="h-topbar px-gutter-tight border-line bg-surface flex shrink-0 items-center gap-2.5 border-b"
  >
    <button type="button" class="text-ink -ml-1 p-1" aria-label="뒤로" @click="router.back()">
      <AppIcon name="chevron-left" class="size-icon" />
    </button>
    <h1 class="text-headline2 text-ink-title">{{ title }}</h1>
  </header>
</template>
