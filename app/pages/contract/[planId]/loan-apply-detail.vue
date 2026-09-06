<script setup lang="ts">
/**
 * 3루 8 · 대출 신청 상세.
 *
 * 질권설정·채권양도를 설명하는 자리다. **내 보증금을 담보로 잡는다**는
 * 걸 모르면 임대인에게 통지서가 갔을 때 놀란다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const DOCS = [
  '확정일자부 임대차계약서 원본',
  '계약금 이체확인증',
  '임대인 통장 사본',
  '신분증',
  '주민등록등본 · 가족관계증명서',
  '건강보험 자격득실확인서 · 재직증명서',
  '원천징수영수증 · 소득금액증명원',
  '등기사항전부증명서 · 건축물대장',
  '전입세대확인서 (해당 시)',
  '우대금리 서류 3종 (청년 버팀목만)',
];

const checked = ref<Record<string, boolean>>({});
</script>

<template>
  <GuideFrame title="대출 신청 상세" @back="navigateTo(`/contract/${planId}/loan-apply`)">
    <h2 class="text-option text-ink-hero px-1 pt-2">신청은 두 개예요</h2>

    <NumberedCard :index="1" title="대출 신청">
      <p class="text-caption2 text-ink-hero-body">→ 수탁은행 (내가 방문한 지점)</p>
    </NumberedCard>
    <NumberedCard :index="2" title="보증 신청">
      <p class="text-caption2 text-ink-hero-body">→ HF 또는 HUG</p>
    </NumberedCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">신청 방식</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-label2 text-ink-hero font-semibold">기금e든든 비대면</p>
      <p class="text-caption2 text-ink-hero">
        대출은 온라인, 보증 신청은 영업점 방문. 비대면으로 신청해도 영업점을 한 번 더 가야 해요.
      </p>
    </AppCard>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-label2 text-ink-hero font-semibold">은행 창구 대면</p>
      <p class="text-caption2 text-ink-hero">대출과 보증을 한 번에 처리.</p>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">신청 당일 챙길 것</h2>

    <AppCard class="flex flex-col gap-2">
      <CheckItem v-for="doc in DOCS" :key="doc" v-model="checked[doc]">{{ doc }}</CheckItem>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">질권설정 · 채권양도</h2>

    <AppCard class="flex flex-col gap-2.5">
      <p class="text-label2 text-ink-hero font-semibold">내 보증금을 담보로 잡아요</p>
      <p class="text-caption2 text-ink-hero">
        전세대출은 내 보증금을 담보로 잡아서, 은행이 임대인에게 통지서를 보내요.
      </p>

      <div class="bg-surface-info rounded-field flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption2 text-primary-strong font-semibold">질권설정 통지</p>
        <p class="text-caption2 text-ink-hero">보증금에 은행이 권리를 걸었다는 통지</p>
      </div>

      <div class="bg-surface-info rounded-field flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption2 text-primary-strong font-semibold">채권양도 통지</p>
        <p class="text-caption2 text-ink-hero">보증금 받을 권리를 은행에 넘겼다는 통지</p>
      </div>

      <div class="bg-badge-warning rounded-field flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption2 text-warning-strong font-semibold">
          임대인 도달 확인이 안 되면 대출이 진행되지 않을 수 있어요.
        </p>
        <p class="text-caption2 text-ink-hero">미리 알려두면 좋아요.</p>
      </div>
    </AppCard>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/loan-apply`)">
        대출 신청 화면으로
      </AppButton>
    </template>
  </GuideFrame>
</template>
