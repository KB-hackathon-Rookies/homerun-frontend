<script setup lang="ts">
/**
 * 화면 껍데기.
 *
 * 디자인이 390×812 모바일 고정이다. 실제 기기에서는 화면을 꽉 채워야 하므로
 * 폭은 최대값으로만 잡고, 높이는 뷰포트를 따른다.
 */
</script>

<template>
  <div
    class="bg-surface max-w-screen rounded-screen mx-auto flex min-h-dvh w-full flex-col overflow-hidden"
  >
    <slot />
  </div>
</template>
