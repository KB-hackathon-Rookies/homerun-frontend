<script setup lang="ts">
/**
 * 3루 5 · 회사 서류 상세.
 *
 * 누가 떼 주는지를 서류마다 적었다. 넷 중 하나는 본인이 직접 받을 수
 * 있는데 그걸 모르고 회사에 다 맡기면 기다리기만 한다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const DOCS = [
  { title: '재직증명서', by: '회사 담당자' },
  { title: '사업자등록증 사본', by: '회사 담당자' },
  { title: '소속기업 주업종코드 확인서', by: '제일 오래 걸림' },
  { title: '고용보험 자격이력내역서', by: '근로복지공단에서 본인 발급 가능' },
];

const checked = ref<Record<string, boolean>>({});
</script>

<template>
  <GuideFrame title="회사 서류 요청 상세" @back="navigateTo(`/contract/${planId}/company-docs`)">
    <div class="bg-badge-warning rounded-field flex flex-col gap-2.5 p-4">
      <span
        class="bg-surface rounded-chip text-micro text-warning-strong self-start px-2 py-0.5 font-semibold"
      >
        중소기업 우대금리 대상만
      </span>
      <p class="text-caption2 text-ink-hero">
        청년 버팀목 + 중소기업 재직으로 우대금리 0.3%p 받을 사람만 해당돼요. 아니면 이 단계 통째로
        건너뛰기.
      </p>
    </div>

    <div class="bg-surface-info rounded-field flex flex-col gap-1.5 p-3.5">
      <p class="text-label2 text-primary-strong font-semibold">우대금리 0.3%p ≈ 2년에 약 86만원</p>
      <p class="text-caption2 text-ink-hero">
        청년 버팀목 중소기업 우대금리를 받으려면 이 단계가 필요해요. 일반 버팀목이면 이 단계는
        건너뛰어도 돼요.
      </p>
    </div>

    <h2 class="text-option text-ink-hero px-1 pt-2">회사에 요청할 것</h2>

    <AppCard class="flex flex-col gap-2">
      <CheckItem v-for="doc in DOCS" :key="doc.title" v-model="checked[doc.title]" tone="filled">
        {{ doc.title }}
        <template #note>{{ doc.by }}</template>
      </CheckItem>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">이렇게 말해요</h2>

    <p class="bg-surface-info rounded-field text-caption2 text-ink-hero px-3.5 py-3 font-medium">
      "전세자금대출 중소기업 우대금리를 받으려면 회사 주업종코드가 적힌 서류가 필요해요.
      사업자등록증과 함께 부탁드립니다."
    </p>

    <AppCard class="flex flex-col gap-1.5 px-3.5 py-3">
      <p class="text-label2 text-ink-hero font-semibold">주업종코드가 제일 오래 걸려요</p>
      <p class="text-caption2 text-ink-hero">
        담당자가 바로 뽑아주지 않을 수 있어서 D-30에 미리 요청해요.
      </p>
    </AppCard>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/company-docs`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
