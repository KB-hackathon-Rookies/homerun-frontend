<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

// 브라우저 탭 제목.
useHead({ title: '가입 완료' });

/**
 * AU-07 회원가입 완료.
 *
 * 이 화면만 글자 크기가 다르다. 축하 화면이라 제목이 조금 작고 본문이 옅다.
 * 이름은 가입 응답으로 받은 이름을 쓴다. 없으면 호칭 없이 인사한다.
 */
const auth = useAuthStore();

const greeting = computed(() =>
  auth.user?.name ? `${auth.user.name}님, 홈런에 오신 걸 환영해요` : '홈런에 오신 걸 환영해요',
);
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />

    <div class="flex flex-1 flex-col items-center justify-center gap-4 px-6">
      <span class="bg-surface size-hero grid place-items-center overflow-hidden rounded-full">
        <img src="/tiger/main.webp" alt="" class="h-25 w-auto" />
      </span>

      <h1 class="text-title3 text-ink-hero">가입 완료!</h1>

      <p class="text-body3 text-ink-hero-body text-center whitespace-pre-line">
        {{ `${greeting}\n첫 독립, 홈까지 함께 완주해봐요` }}
      </p>

      <div class="bg-surface-info rounded-field flex w-full flex-col gap-1.5 p-3.5">
        <span class="text-caption1 text-primary-strong">다음 순서</span>
        <span class="text-caption2 text-ink-hero-body">오픈뱅킹으로 자산 자동 연동</span>
      </div>
    </div>

    <footer class="flex shrink-0 px-4 pb-cta-pad">
      <AppButton variant="strong" @click="navigateTo('/openbanking', { replace: true })">
        시작하기
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
