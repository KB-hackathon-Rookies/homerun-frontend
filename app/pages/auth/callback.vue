<script setup lang="ts">
import { useAuthApi } from '~/api/auth';
import { currentPlan } from '~/utils/currentPlan';

/**
 * 소셜 로그인 착지 화면.
 *
 * 백엔드 콜백이 리프레시 쿠키만 심고 여기로 302 를 준다. 액세스 토큰은 주소창에 실리지 않는다 —
 * 브라우저 기록과 리퍼러에 남기 때문이다. 그래서 이 화면이 쿠키로 토큰을 한 번 받아 세션을 건다.
 *
 * `status` 는 백엔드가 정한다. 생년월일·휴대전화·거주지가 비어 있는 계정이면 `signup`, 다 채운
 * 계정이면 `login` 이다. 신규인지 아닌지를 프론트가 추측하지 않는다.
 *
 * 이미 가입한 사람을 어디로 보낼지는 이메일 로그인(`login.vue`)과 같은 규칙을 쓴다 — 진행 중인
 * 계획이 있으면 홈, 없으면 온보딩이다. 두 경로가 갈리면 소셜만 다른 화면에 떨어진다.
 */
const route = useRoute();
const auth = useAuthStore();
const { refresh } = useAuthApi();

const error = ref('');

onMounted(async () => {
  const status = route.query.status;

  if (status === 'error') {
    await navigateTo(
      { path: '/login', query: { error: String(route.query.reason ?? '') } },
      { replace: true },
    );
    return;
  }

  try {
    auth.apply(await refresh());
  } catch {
    error.value = '로그인을 마치지 못했어요. 다시 시도해주세요.';
    return;
  }

  // 가입이 끝나지 않은 계정은 약관부터 다시 태운다. 소셜은 이름·이메일밖에 주지 않는다.
  if (status === 'signup') {
    await navigateTo('/signup/terms', { replace: true });
    return;
  }
  await navigateTo(currentPlan.get() ? '/home' : '/onboarding', { replace: true });
});
</script>

<template>
  <PhoneFrame>
    <div class="flex flex-1 flex-col items-center justify-center gap-4 px-6">
      <p v-if="error" class="text-body2 text-danger text-center">{{ error }}</p>
      <template v-else>
        <BrandMark tilted :wordmark="false" class="animate-pulse" />
        <p class="text-body2 text-ink-body">로그인하는 중이에요…</p>
      </template>
      <AppButton v-if="error" variant="strong" @click="navigateTo('/login', { replace: true })">
        로그인으로 돌아가기
      </AppButton>
    </div>
  </PhoneFrame>
</template>
