<script setup lang="ts">
import type { Term } from '~/components/common/TermsAgreement.vue';
import { messageFrom } from '~/utils/error';

/**
 * AU-05 약관 동의.
 *
 * 필수 항목이 전부 체크돼야 다음으로 넘어간다. 선택 항목은 막지 않는다.
 *
 * 소셜로 들어온 사람은 여기 도착한 시점에 이미 계정과 세션이 있다(`/auth/callback`). 그래서 동의를
 * 바로 서버에 남기고 이메일·비밀번호 화면을 건너뛴다 — 소셜 계정에는 비밀번호가 없다. 동의를 여기서
 * 남겨야 다음 화면의 지역 목록 조회가 403 으로 막히지 않는다.
 */
const TERMS: Term[] = [
  { id: 'service', label: '[필수] 서비스 이용약관', required: true },
  { id: 'privacy', label: '[필수] 개인정보 수집·이용 동의', required: true },
  { id: 'identity', label: '[필수] 고유식별정보 처리 동의', required: true },
  { id: 'marketing', label: '[선택] 마케팅 정보 수신 동의', required: false },
];

const { agreed, canProceed } = useTerms(TERMS);

const auth = useAuthStore();
const error = ref('');
const pending = ref(false);

async function next() {
  if (!auth.isAuthenticated) {
    await navigateTo('/signup');
    return;
  }

  pending.value = true;
  error.value = '';
  try {
    await useRequiredTerms().ensure();
    await navigateTo('/signup/identity');
  } catch (cause) {
    error.value = messageFrom(cause, '약관 동의를 저장하지 못했어요.');
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />
    <TopBar title="약관 동의" />

    <div class="px-gutter flex flex-1 flex-col gap-2 py-6">
      <p class="text-body2 text-ink-body pb-2">
        서비스를 이용하기 위해 필요 약관에 동의가 필요해요.
      </p>
      <TermsAgreement v-model="agreed" :terms="TERMS" />
      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <footer class="px-gutter flex shrink-0 flex-col gap-3 pb-cta-pad">
      <p class="text-caption1 text-ink-subtle text-center">
        선택항목에 동의하지 않아도 서비스 이용이 가능합니다.
      </p>
      <AppButton :disabled="!canProceed || pending" @click="next">동의하고 계속하기</AppButton>
    </footer>
  </PhoneFrame>
</template>
