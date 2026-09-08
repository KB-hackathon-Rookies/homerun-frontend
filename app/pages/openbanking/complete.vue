<script setup lang="ts">
/**
 * 오픈뱅킹 연동 완료.
 *
 * 가입 완료 화면과 같은 틀이다. 문구와 다음 순서만 다르다.
 */
definePageMeta({ middleware: 'auth' });

const auth = useAuthStore();

const greeting = computed(() =>
  auth.user?.name ? `${auth.user.name}님, 준비는 끝났어요.` : '준비는 끝났어요.',
);
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />

    <div class="flex flex-1 flex-col items-center justify-center gap-4 px-6">
      <!-- 피그마의 캐릭터 자리. 에셋이 들어오면 이 자리를 이미지로 바꾼다. -->
      <span class="bg-surface-info size-hero grid place-items-center rounded-full">
        <BrandMark tilted :wordmark="false" class="scale-150" />
      </span>

      <h1 class="text-title3 text-ink-hero">오픈뱅킹 연동 완료!</h1>

      <p class="text-body3 text-ink-hero-body text-center whitespace-pre-line">
        {{ `${greeting}\n이제 메인 화면에서 본격적인 독립 플랜을 짜볼까요?` }}
      </p>

      <div class="bg-surface-info rounded-field flex w-full flex-col gap-1.5 p-3.5">
        <span class="text-caption1 text-primary-strong">다음 순서</span>
        <span class="text-caption2 text-ink-hero-body">메인 화면에서 나만의 독립 플랜 짜기</span>
      </div>
    </div>

    <footer class="flex shrink-0 px-4 pb-cta-pad">
      <AppButton variant="strong" @click="navigateTo('/home', { replace: true })">
        메인 화면으로 이동
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
