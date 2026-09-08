<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

/**
 * AU-01 스플래시.
 *
 * 잠깐 보여주고 웰컴으로 넘어간다. 이미 로그인해 둔 사람은 여기서 멈출 이유가 없다.
 */
const DURATION_MS = 1600;

const auth = useAuthStore();

/**
 * 로그인해 둔 사람은 홈으로 보낸다.
 *
 * 계획이 있는지 여기서 묻지 않는다. 홈이 `/plans/active` 로 서버에서 계획을 되살리고,
 * 정말 없을 때만 시작하기를 안내한다. 스플래시에서 한 번 더 물으면 같은 조회가 두 번
 * 나가고, 조회가 잠깐 실패하면 계획이 있는 사람도 온보딩으로 밀려 계획이 새로 만들어진다.
 */
const destination = () => (auth.isAuthenticated ? '/home' : '/welcome');

onMounted(() => {
  auth.restore();

  const timer = setTimeout(async () => {
    await navigateTo(destination(), { replace: true });
  }, DURATION_MS);

  onUnmounted(() => clearTimeout(timer));
});
</script>

<template>
  <PhoneFrame>
    <div class="pt-statusbar shrink-0" />

    <!--
      화면 정의서 AU-01. 마름모 44 · 워드마크 · 하단 한 줄이 전부다.

      1초 남짓 보이고 사라지는 화면이라 읽을 것을 늘리지 않는다. 서비스 설명은 바로 다음
      웰컴(AU-02)이 맡는다.
    -->
    <div class="flex flex-1 flex-col items-center justify-center gap-4">
      <span class="bg-primary size-11 rotate-45 rounded-sm" />
      <span class="font-logo text-title2 text-ink">홈런</span>
    </div>

    <p class="text-caption1 text-ink-subtle pb-cta-pad shrink-0 text-center">첫 독립을 위한 준비</p>
  </PhoneFrame>
</template>
