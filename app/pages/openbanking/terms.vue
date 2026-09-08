<script setup lang="ts">
import type { Term } from '~/components/common/TermsAgreement.vue';
import { useTerms } from '~/composables/useTerms';

/**
 * 오픈뱅킹 약관 동의.
 *
 * 동의를 받아야 인가 URL 을 요청할 수 있다. 동의 자체는 화면에서 끝나고,
 * 실제 금융결제원 동의는 다음 화면에서 인가 페이지를 열어 받는다.
 */
definePageMeta({ middleware: 'auth' });

const TERMS: Term[] = [
  { id: 'service', label: '[필수] 오픈뱅킹 서비스 이용약관', required: true },
  { id: 'inquiry', label: '[필수] 금융정보 조회 동의', required: true },
  { id: 'thirdParty', label: '[필수] 개인정보 제3자 제공 동의', required: true },
  { id: 'analysis', label: '[선택] 조회 결과 분석·저장 동의', required: false },
];

const { agreed, canProceed } = useTerms(TERMS);

const router = useRouter();
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />
    <PageBar title="오픈뱅킹 연동" />

    <div class="px-gutter flex flex-1 flex-col gap-2 py-6">
      <p class="text-body2 text-ink-body pb-2">
        서비스를 이용하기 위해 필요 약관에 동의가 필요해요.
      </p>
      <TermsAgreement v-model="agreed" :terms="TERMS" />
    </div>

    <footer class="px-gutter flex shrink-0 flex-col gap-3 pb-cta-pad">
      <p class="text-label2 text-ink-muted text-center">
        선택항목에 동의하지 않아도 서비스 이용이 가능합니다.
      </p>
      <!-- 피그마의 하단은 `[이전] [다음]` 두 칸이다. 상단 뒤로가기와 같은 곳으로 간다. -->
      <div class="flex gap-2.5">
        <div class="shrink-0 basis-1/3">
          <AppButton variant="white" @click="router.back()">이전</AppButton>
        </div>
        <div class="flex-1">
          <AppButton :disabled="!canProceed" @click="navigateTo('/openbanking/progress')">
            동의하고 계속하기
          </AppButton>
        </div>
      </div>
    </footer>
  </PhoneFrame>
</template>
