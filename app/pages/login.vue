<script setup lang="ts">
import { socialLoginUrl } from '~/api/auth';
import { useAuthStore } from '~/stores/auth';
import { messageFrom } from '~/utils/error';

/**
 * AU-03 로그인.
 *
 * 실패 문구는 백엔드가 준 것을 그대로 보여준다. 화면에서 지어내지 않는다.
 */
const auth = useAuthStore();
const route = useRoute();
const config = useRuntimeConfig();

const email = ref('');
const password = ref('');
/** 소셜 콜백이 실패하면 `?error=코드` 로 돌아온다. 코드만으로는 알 수 없으니 문구로 바꿔 준다. */
const error = ref(route.query.error ? '소셜 로그인에 실패했어요. 다시 시도해주세요.' : '');
const pending = ref(false);

const canSubmit = computed(() => !!email.value && !!password.value && !pending.value);

/**
 * 돌아갈 곳으로 받아도 되는 값인가.
 *
 * `redirect` 는 주소창에 실려 오니 남이 심을 수 있다. 이 앱 안의 경로만 받는다 —
 * `/` 하나로 시작하고 그다음이 `/` 나 `\` 가 아니어야 한다. `//evil.example` 과
 * `https://evil.example` 은 브라우저가 바깥 주소로 읽으므로 여기서 걸러 낸다.
 */
function safeRedirect(value: unknown): string | null {
  return typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : null;
}

async function submit() {
  if (!canSubmit.value) return;

  pending.value = true;
  error.value = '';
  try {
    await auth.login(email.value, password.value);
    /*
     * 인증이 필요해서 밀려난 사람은 원래 가려던 곳으로 돌려보낸다. 그 외에는 홈이다.
     *
     * 여기서 계획 유무를 따지지 않는다. `currentPlanId` 는 브라우저에만 있는 캐시라
     * 깨끗한 브라우저·시크릿 창·다른 기기에서는 늘 비어 있고, 그걸 '계획 없음' 으로
     * 읽으면 온보딩 → 준비 문진으로 밀려 계획이 새로 만들어진다. 홈이 `/plans/active`
     * 로 서버에서 되살리고, 정말 없을 때만 시작하기를 안내한다.
     */
    await navigateTo(safeRedirect(route.query.redirect) ?? '/home', { replace: true });
  } catch (cause) {
    error.value = messageFrom(cause, '이메일 또는 비밀번호를 확인해주세요.');
  } finally {
    pending.value = false;
  }
}

/** 소셜 로그인은 백엔드가 인가 서버로 넘겨주므로 브라우저를 통째로 보낸다. */
function social(provider: 'kakao' | 'google') {
  window.location.href = socialLoginUrl(provider, config.public.apiBase);
}
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />
    <TopBar title="로그인" />

    <form class="px-gutter flex flex-1 flex-col gap-6 pt-2 pb-6" @submit.prevent="submit">
      <p class="text-body2 text-ink-body">홈런으로 독립 준비를 이어가세요.</p>

      <div class="flex flex-col gap-3.5">
        <AppInput
          v-model="email"
          label="이메일"
          type="email"
          placeholder="이메일을 입력해주세요"
          autocomplete="email"
        />
        <AppInput
          v-model="password"
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력해주세요"
          autocomplete="current-password"
        />
      </div>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>

      <button type="button" class="text-label2 text-ink-muted self-start">
        비밀번호를 잊으셨나요?
      </button>

      <AppButton type="submit" :disabled="!canSubmit">
        {{ pending ? '로그인 중…' : '로그인' }}
      </AppButton>

      <div class="flex items-center gap-3">
        <span class="bg-line-soft h-px flex-1" />
        <span class="text-caption1 text-ink-subtle">또는 이메일</span>
        <span class="bg-line-soft h-px flex-1" />
      </div>

      <div class="flex flex-col gap-2.5">
        <AppButton variant="kakao" @click="social('kakao')">카카오로 계속하기</AppButton>
        <AppButton variant="white" @click="social('google')">Google로 계속하기</AppButton>
      </div>

      <p class="text-label2 text-ink-muted flex justify-center gap-1 pt-2">
        아직 계정이 없나요?
        <NuxtLink to="/signup/terms" class="text-primary-deep font-medium">회원가입</NuxtLink>
      </p>
    </form>
  </PhoneFrame>
</template>
