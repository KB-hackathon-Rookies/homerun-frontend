<script setup lang="ts">
import { currentPlan } from '~/utils/currentPlan';

/**
 * AU-01 스플래시.
 *
 * 잠깐 보여주고 웰컴으로 넘어간다. 이미 로그인해 둔 사람은 여기서 멈출 이유가 없다.
 */
const DURATION_MS = 1600;

const auth = useAuthStore();

/** 진행 중인 계획이 있으면 온보딩을 다시 보여줄 이유가 없다. 홈으로 보낸다. */
function destination() {
  if (!auth.isAuthenticated) return '/welcome';
  return currentPlan.get() ? '/home' : '/onboarding';
}

onMounted(() => {
  auth.restore();

  const timer = setTimeout(() => {
    navigateTo(destination(), { replace: true });
  }, DURATION_MS);

  onUnmounted(() => clearTimeout(timer));
});
</script>

<template>
  <PhoneFrame>
    <div class="flex flex-1 flex-col items-center px-gutter pt-statusbar">
      <BrandMark class="self-start pt-4" />

      <div class="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <!-- 피그마의 intro.png 자리. 아직 에셋이 없어 로고를 크게 세워 둔다. -->
        <span class="bg-primary size-hero rotate-45 rounded-screen" />

        <h1 class="text-title1 text-ink-strong whitespace-pre-line">
          {{ '첫 독립,\n홈런이\n함께할게요' }}
        </h1>
        <p class="text-ink-placeholder text-xl font-bold">청년의 첫 독립을 위한 맞춤 자립 코치</p>
      </div>

      <p class="text-caption1 text-ink-subtle pb-8">첫 독립을 위한 준비</p>
    </div>
  </PhoneFrame>
</template>
