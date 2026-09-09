<script setup lang="ts">
import { COACH_TIME } from '~/components/contract/coachSheets';
import { THIRD_BASE_STEPS } from '~/components/contract/steps';

/**
 * 3루 2 · 계약 (시안 `687:2778`).
 *
 * 이 화면은 필수 특약 4종을 보여주는 게 전부다. **계약서에 안 적히면
 * 없는 것**이라, 무엇을 적어야 하는지부터 짚는다. 각 특약의 실제 조항 문구는
 * 상세 화면(`sign-detail`)이 맡는다 — 화면을 짧게 두어야 사람이 훑고 넘어가지
 * 않고 한 카드씩 읽는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

interface Term {
  index: number;
  title: string;
  body: string;
}

const TERMS: Term[] = [
  {
    index: 1,
    title: '대출 미승인 시 계약 무효',
    body: '대출 승인 불가 시 임대인은 계약금 전액 반환',
  },
  {
    index: 2,
    title: '잔금일 다음날까지 권리관계 유지',
    body: '전입신고·확정일자 완료 전까지 새로운 근저당·전세권·압류 등 금지',
  },
  {
    index: 3,
    title: '반환보증 가입 불가 시 계약 무효',
    body: '전세보증금반환보증 가입 불가 시 계약금 전액 반환',
  },
  {
    index: 4,
    title: '전세대출 절차 협조',
    body: '대출·보증 절차에 필요한 서류 제공·절차 협조',
  },
];

/** ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="[COACH_TIME.contractTerms]"
    brand
    base="3루"
  >
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="THIRD_BASE_STEPS" :current="0" />

      <h1 class="text-question text-ink-card">계약</h1>

      <p class="text-body3 text-ink-strong font-bold">필수 특약 4종</p>

      <!-- 시안(`687:2828`~`687:2837`)의 특약 카드 네 장. 제목 굵게 + 부연 한 줄. -->
      <AppCard v-for="term in TERMS" :key="term.index" class="flex flex-col gap-1">
        <p class="text-body3 text-ink-strong font-bold">{{ term.index }}. {{ term.title }}</p>
        <p class="text-caption2 text-ink-card-body">{{ term.body }}</p>
      </AppCard>

      <!--
        상세 화면(`687:2852`)이 실제 조항 문구와 왜 필요한지, 계약 때 챙길 것,
        중개보수 계산까지 다 담고 있다. 이 화면은 요약이라 링크로 넘긴다.
      -->
      <button
        type="button"
        class="border-line-follow bg-surface-brand rounded-field text-body3 text-primary-strong h-11 w-full border font-bold"
        @click="navigateTo(`/contract/${planId}/sign-detail`)"
      >
        특약·계약 체크·중개보수 상세보기 →
      </button>
    </div>

    <StepFooter
      @back="navigateTo(`/contract/${planId}/visit`)"
      @next="navigateTo(`/contract/${planId}/fixed-date`)"
    >
      확정일자 받기
    </StepFooter>
  </StageShell>
</template>
