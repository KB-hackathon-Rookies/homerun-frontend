<script setup lang="ts">
import type { Term } from '~/components/common/TermsAgreement.vue';

/**
 * AU-05 약관 동의.
 *
 * 필수 항목이 전부 체크돼야 다음으로 넘어간다. 선택 항목은 막지 않는다.
 */
const TERMS: Term[] = [
  { id: 'service', label: '[필수] 서비스 이용약관', required: true },
  { id: 'privacy', label: '[필수] 개인정보 수집·이용 동의', required: true },
  { id: 'identity', label: '[필수] 고유식별정보 처리 동의', required: true },
  { id: 'marketing', label: '[선택] 마케팅 정보 수신 동의', required: false },
];

const { agreed, canProceed } = useTerms(TERMS);
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
    </div>

    <footer class="px-gutter flex shrink-0 flex-col gap-3 pb-6">
      <p class="text-caption1 text-ink-subtle text-center">
        선택항목에 동의하지 않아도 서비스 이용이 가능합니다.
      </p>
      <AppButton :disabled="!canProceed" @click="navigateTo('/signup')">동의하고 계속하기</AppButton>
    </footer>
  </PhoneFrame>
</template>
