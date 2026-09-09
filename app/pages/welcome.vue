<script setup lang="ts">
/**
 * AU-02 웰컴 (시안 0-1 두 번째 화면).
 *
 * 시안 왼쪽 첫 화면(홈런 소개 · 집 든 호랑이)이 아니라 **그 다음 화면**이다.
 * 왼쪽 상단에 마름모 배지 하나만 있고 큰 이미지는 없다. 씬 이미지가 들어가는
 * 자리는 다음 온보딩 4장이다.
 */
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />
    <div class="h-topbar shrink-0" />

    <div class="px-gutter flex flex-1 flex-col gap-7 pt-4">
      <BrandMark tilted :wordmark="false" />

      <h1 class="text-title1 text-ink whitespace-pre-line">
        {{ '첫 독립,\n어디서부터\n시작해야 할까요?' }}
      </h1>

      <p class="text-body1 text-ink-body">
        홈런이 내 상황을 확인하고 독립 준비부터 신청까지 함께합니다.
      </p>
    </div>

    <footer class="px-gutter flex shrink-0 flex-col gap-2.5 pt-2.5 pb-cta-pad">
      <AppButton @click="navigateTo('/onboarding')">시작하기</AppButton>
      <AppButton variant="white" @click="navigateTo('/login')">이미 계정이 있어요</AppButton>
    </footer>
  </PhoneFrame>
</template>
