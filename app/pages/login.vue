<script setup lang="ts">
import { socialLoginUrl } from '~/api/auth';
import { useAuthStore } from '~/stores/auth';
import { messageFrom } from '~/utils/error';
import { safeRedirect } from '~/utils/redirect';

// 브라우저 탭 제목.
useHead({ title: '로그인' });

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
        <AppButton variant="kakao" @click="social('kakao')">
          <img src="/social/kakao.png" alt="" class="size-5" />
          카카오로 계속하기
        </AppButton>
        <AppButton variant="white" @click="social('google')">
          <img src="/social/google.png" alt="" class="size-5" />
          Google로 계속하기
        </AppButton>
      </div>
    </form>

    <!--
      피그마는 이 줄을 위쪽 구분선이 있는 고정 하단 바에 둔다. 폼 안에 흘려 넣으면
      입력이 길어질수록 스크롤 아래로 밀려, 계정이 없는 사람이 가입하는 길을 찾지
      못한다. 로그인 화면에서 가장 자주 눌리는 두 번째 길이라 바깥으로 뺀다.
    -->
    <footer class="px-gutter border-line bg-surface shrink-0 border-t pt-3 pb-cta-pad">
      <p class="text-label2 text-ink-muted flex justify-center gap-1">
        아직 계정이 없나요?
        <NuxtLink to="/signup/terms" class="text-primary-deep font-medium">회원가입</NuxtLink>
      </p>
    </footer>
  </PhoneFrame>
</template>
