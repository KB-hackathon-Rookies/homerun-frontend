<script setup lang="ts">
/**
 * 뒤로가기와 제목만 있는 상단 바.
 *
 * 로그인 · 약관 · 회원가입이 같은 모양을 쓴다. 스플래시와 온보딩에는 없다.
 */
const { title = '' } = defineProps<{ title?: string }>();

const router = useRouter();
</script>

<template>
  <header class="h-topbar flex shrink-0 items-center gap-2.5 px-gutter">
    <button type="button" class="text-ink -ml-1 p-1" aria-label="뒤로" @click="router.back()">
      <AppIcon name="chevron-left" class="size-icon" />
    </button>
    <h1 class="text-headline2 text-ink">{{ title }}</h1>
  </header>
</template>
