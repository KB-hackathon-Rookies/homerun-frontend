<script setup lang="ts">
// 브라우저 탭 제목.
useHead({ title: '환영합니다' });
/**
 * AU-02 웰컴.
 *
 * 진행 표시는 아직 어느 단계도 시작하지 않은 상태로 둔다(`current` 없음).
 * 1루부터 홈까지 네 단계가 있다는 것만 먼저 알린다.
 */
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />
    <div class="h-topbar shrink-0" />

    <div class="px-gutter flex flex-1 flex-col justify-center gap-7">
      <BrandMark tilted :wordmark="false" />

      <h1 class="text-title1 text-ink whitespace-pre-line">
        {{ '첫 독립,\n어디서부터\n시작해야 할까요?' }}
      </h1>

      <p class="text-body1 text-ink-body">
        홈런이 내 상황을 확인하고 독립 준비부터 신청까지 함께합니다.
      </p>

      <StepIndicator />
    </div>

    <footer class="px-gutter flex shrink-0 flex-col gap-2.5 pt-2.5 pb-cta-pad">
      <AppButton @click="navigateTo('/onboarding')">시작하기</AppButton>
      <AppButton variant="white" @click="navigateTo('/login')">이미 가입했어요</AppButton>
    </footer>
  </PhoneFrame>
</template>
