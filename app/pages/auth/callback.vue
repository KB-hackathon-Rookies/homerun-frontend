<script setup lang="ts">
import { useAuthApi } from '~/api/auth';
import { useAuthStore } from '~/stores/auth';

// 브라우저 탭 제목.
useHead({ title: '로그인 처리 중' });

/**
 * 소셜 로그인 착지 화면.
 *
 * 백엔드 콜백이 리프레시 쿠키만 심고 여기로 302 를 준다. 액세스 토큰은 주소창에 실리지 않는다 —
 * 브라우저 기록과 리퍼러에 남기 때문이다. 그래서 이 화면이 쿠키로 토큰을 한 번 받아 세션을 건다.
 *
 * `status` 는 백엔드가 정한다. 생년월일·휴대전화·거주지가 비어 있는 계정이면 `signup`, 다 채운
 * 계정이면 `login` 이다. 신규인지 아닌지를 프론트가 추측하지 않는다.
 *
 * `signup` 은 **본인 확인 화면으로 바로** 보낸다. 소셜은 이메일·비밀번호를 받을 이유가 없고,
 * 제공자가 주지 않는 값(생년월일·휴대전화·주소)만 채우면 가입이 끝난다. 필수 약관 동의는 그
 * 화면 안에서 함께 받는다.
 *
 * 이미 가입한 사람을 어디로 보낼지는 이메일 로그인(`login.vue`)과 같은 규칙을 쓴다 — 홈이다.
 * 두 경로가 갈리면 소셜만 다른 화면에 떨어진다.
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

  if (status === 'signup') {
    await navigateTo('/signup/identity', { replace: true });
    return;
  }
  /*
   * 계획 유무를 여기서 따지지 않는다. `currentPlanId` 는 브라우저에만 있는 캐시라 깨끗한
   * 브라우저에서는 늘 비어 있고, 그걸 '계획 없음' 으로 읽으면 온보딩 → 준비 문진으로 밀려
   * 계획이 새로 만들어진다. 홈이 `/plans/active` 로 서버에서 되살린다.
   */
  await navigateTo('/home', { replace: true });
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
