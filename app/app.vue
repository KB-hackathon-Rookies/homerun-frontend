<script setup lang="ts">
/**
 * 앱 전체의 껍데기.
 *
 * `SystemBar` 는 화면을 덮지 않고 위로 밀어낸다. 겹쳐 두면 뒤로가기 버튼을
 * 가리는데, 연결이 끊긴 채로 돌아갈 수도 없게 만드는 셈이다.
 */

// 브라우저 탭 제목 틀. 페이지가 `useHead({ title })` 로 준 제목 뒤에 서비스명을
// 붙이고(`설정 · 홈런`), 제목이 없으면 서비스명만 둔다. 함수 형식은 런타임
// useHead 에서만 허용돼 nuxt.config 가 아니라 여기에 둔다.
useHead({
  titleTemplate: (title) => (title ? `${title} · 홈런` : '홈런'),
});
</script>

<template>
  <SystemBar />
  <NuxtPage />
</template>
