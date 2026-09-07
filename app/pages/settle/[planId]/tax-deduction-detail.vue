<script setup lang="ts">
import { TAX_DOCUMENTS } from '~/components/settle/tax';

/**
 * 홈 4-8 상세 · 연말정산 소득공제.
 *
 * 한도와 공제율, 그리고 놓쳤을 때 소급하는 법. 처음 전세를 하는 사람이
 * 제도를 몰라 놓치는 일이 많아서 마지막 카드를 그 이야기로 둔다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
</script>

<template>
  <GuideFrame title="연말정산 소득공제 상세" @back="navigateTo(`/settle/${planId}/tax-deduction`)">
    <h2 class="text-section text-ink-hero px-1 pt-2">주택임차차입금 원리금상환액 소득공제</h2>

    <AppCard class="flex flex-col gap-2">
      <div class="flex gap-2.5">
        <div class="bg-surface-info rounded-cta flex flex-1 flex-col gap-1 px-3.5 py-3">
          <p class="text-step text-ink-meta font-medium">공제 한도</p>
          <p class="text-metric text-primary-strong">연 400만원</p>
        </div>
        <div class="bg-surface-info rounded-cta flex flex-1 flex-col gap-1 px-3.5 py-3">
          <p class="text-step text-ink-meta font-medium">공제율</p>
          <p class="text-metric text-primary-strong">40%</p>
        </div>
      </div>
      <p class="text-caption-tight text-ink-hero font-normal">
        만기일시상환이라 원금 상환이 없으면 이자만 공제 대상이에요.
      </p>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">필요 서류</h2>

    <AppCard class="flex flex-col gap-2">
      <p
        v-for="line in TAX_DOCUMENTS"
        :key="line"
        class="text-caption-tight text-ink-hero font-normal"
      >
        {{ line }}
      </p>

      <div class="bg-surface-info rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-primary-strong font-semibold">대부분 자동으로 잡혀요</p>
        <p class="text-caption-tight text-ink-hero font-normal">
          홈택스 연말정산 간소화 서비스에서 자동 반영돼요. 안 잡히면 은행에서 직접 발급받아 회사에
          제출하세요.
        </p>
      </div>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">놓쳤으면 5년치 소급 가능</h2>

    <div class="bg-surface-info rounded-field flex flex-col gap-1.5 p-3.5">
      <p class="text-row text-primary-strong">경정청구로 최대 5년까지</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        처음 전세를 하는 사람은 이 제도를 몰라 놓치는 경우가 많아요. 홈택스에서 경정청구하거나
        세무서에 문의하면 소급해서 받을 수 있어요.
      </p>
    </div>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/tax-deduction`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
