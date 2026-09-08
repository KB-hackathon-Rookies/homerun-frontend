<script setup lang="ts">
import { usePolicyApi, type PolicyVerdict } from '~/api/policy';
import {
  FEE_SUPPORT_CONDITIONS,
  FEE_SUPPORT_DOCS_AGREED,
  GOV24_URL,
} from '~/components/settle/guarantee';
import { messageFrom } from '~/utils/error';

/**
 * 홈 4-2 · 보증료 지원 신청.
 *
 * 낸 보증료를 돌려받는 자리다. 청년이면 전액이다.
 *
 * **판정이 PASS 라도 지원 확정이 아니다.** 지자체 예산이 소진되면 자격이
 * 있어도 못 받는 선착순 사업이라, 그 말을 화면에서 지우지 않는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const verdict = ref<PolicyVerdict | null>(null);
const missing = ref<string[]>([]);
const pending = ref(true);
const error = ref('');

const HEADLINE: Record<PolicyVerdict, string> = {
  PASS: '지원 대상이에요',
  NEED_INFO: '조건을 더 확인해야 해요',
  FAIL: '지원 대상이 아니에요',
};

onMounted(async () => {
  try {
    const result = await usePolicyApi().evaluateGuaranteeFeeSupport(planId);
    const first = result.results[0];
    verdict.value = first?.verdict ?? null;
    missing.value = first?.missingFields ?? [];
  } catch (cause) {
    error.value = messageFrom(cause, '지원 자격을 판정하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <StageShell title="보증료 지원 신청" base="홈" @back="navigateTo(`/settle/${planId}`)">

    <div class="px-gutter-tight flex flex-1 flex-col gap-3.5 py-4">
      <CoachTip>
        청년이면 낸 보증료를 전액 돌려받을 수 있어. 예산이 소진되면 마감이라 서두르는 게 좋아
      </CoachTip>

      <!--
        판정 문구가 금액 라벨 자리를 덮고 있었다. 그러면 "최대 40만원" 이 무슨
        돈인지가 화면에서 사라진다 -- 라벨은 남기고 판정은 한 줄 더 붙인다.
      -->
      <div class="bg-primary-strong rounded-field flex flex-col gap-1.5 p-4.5">
        <p class="text-caption-tight text-on-brand font-normal">예상 환급액 (청년 100%)</p>
        <p class="text-amount text-on-brand">최대 40만원</p>
        <p class="text-step text-on-brand font-normal">2025. 3. 31. 이전 가입은 30만원 한도</p>
        <p v-if="pending || verdict" class="text-step text-on-brand font-semibold">
          {{ pending ? '자격을 판정하는 중이에요…' : HEADLINE[verdict!] }}
        </p>
      </div>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
      <p v-else-if="missing.length" class="text-label2 text-ink-muted">
        아직 확인하지 못한 조건이 {{ missing.length }}개 있어요. 판정은 예상이지 확정이 아니에요.
      </p>

      <h2 class="text-card-title text-ink-hero font-bold">지원 조건</h2>

      <AppCard class="flex flex-col gap-2">
        <div v-for="row in FEE_SUPPORT_CONDITIONS" :key="row.label" class="flex gap-2">
          <span class="text-caption-tight text-ink-hero-body w-16 shrink-0 font-normal">
            {{ row.label }}
          </span>
          <span class="text-caption-tight text-ink-hero flex-1 font-semibold">{{ row.value }}</span>
        </div>
      </AppCard>

      <h2 class="text-card-title text-ink-hero font-bold">준비물 (제3자 정보제공 동의 시 2개)</h2>

      <div class="bg-surface-brand rounded-chip flex flex-col gap-0.5 p-3">
        <p
          v-for="line in FEE_SUPPORT_DOCS_AGREED"
          :key="line"
          class="text-micro text-ink-hero-body"
        >
          {{ line }}
        </p>
        <p class="text-micro text-ink-hero-body">• 동의하지 않았다면 서류 9개</p>
      </div>

      <!-- 자격보다 속도가 문제인 사업이라 경고를 눈에 띄게 둔다. -->
      <p class="bg-caution rounded-chip text-step p-2.5 text-white">
        지자체 예산 소진 시 조기 마감 — 오늘 바로 신청하는 걸 권해요
      </p>

      <DetailLink @open="navigateTo(`/settle/${planId}/fee-support-detail`)">
        보증료 지원 상세보기
      </DetailLink>
    </div>

    <template #footer>
<footer class="px-gutter-tight bg-surface flex shrink-0 gap-2.5 pt-2.5 pb-cta-pad">
      <!-- 필수 요소 2번. 앞 단계는 반환보증 가입이다. -->
      <div class="w-29 shrink-0">
        <AppButton variant="white" @click="navigateTo(`/settle/${planId}/return-guarantee`)">
          이전
        </AppButton>
      </div>
      <div class="flex-1">
        <AppButton variant="strong" @click="navigateTo(GOV24_URL, { external: true })">
          정부24로 신청
        </AppButton>
      </div>
    </footer>
</template>
  </StageShell>
</template>
