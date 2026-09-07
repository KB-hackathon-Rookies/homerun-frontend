<script setup lang="ts">
/**
 * 앱 전체의 껍데기.
 *
 * `SystemBar` 는 화면을 덮지 않고 위로 밀어낸다. 겹쳐 두면 뒤로가기 버튼을
 * 가리는데, 연결이 끊긴 채로 돌아갈 수도 없게 만드는 셈이다.
 */
</script>

<template>
  <SystemBar />
  <NuxtPage />
</template>
