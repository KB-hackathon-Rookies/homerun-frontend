<script setup lang="ts">
import { COACH_TIME } from '~/components/property/coachSheets';

/**
 * 2루-5 은행 사전상담 안내.
 *
 * 은행에 가기 **전에** 보는 화면이다. 체크리스트는 저장하지 않는다 — 창구에서
 * 물어봤는지 스스로 짚어 보라고 두는 것이지, 답이 서버로 갈 값이 아니다.
 *
 * 물어볼 것을 미리 정해 두지 않으면 창구에서 "대출 되나요?" 한 마디만 묻고
 * 나오게 된다. 그러면 뒤 화면에 적을 게 없다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

/**
 * 창구에서 물어볼 아홉 가지. 시안 `2루 9 · 은행 사전상담 안내` 그대로다.
 *
 * 여섯 개만 두고 있었는데, 빠진 넷(보증료 · 인지세 · 우대금리 · 혼합상환)이
 * 하필 **돈이 얼마나 더 드는지**를 정하는 항목이다. 안 묻고 나오면 상담 결과에
 * 적을 것도, 은행끼리 비교할 것도 없어진다.
 */
const QUESTIONS = [
  '이 주택으로 취급이 되나요',
  '어느 보증서로 진행되나요 (안심전세 · 주신보 · 서신보)',
  '제 소득으로 한도가 얼마나 나오나요',
  '보증료는 얼마인가요',
  '인지세 고객 부담분은 얼마인가요',
  '우대금리는 어떤 걸 받을 수 있나요',
  '혼합상환이 되나요 (담보에 따라 갈려요)',
  '등기부등본을 제가 떼 가야 하나요, 열람본인가요',
  '잔금일까지 심사가 끝날 수 있나요',
];

const checked = ref<Record<string, boolean>>({});
</script>

<template>
  <StageShell
    :coach-sheets="[COACH_TIME.guaranteeAgency]"
    title="은행 사전상담"
    base="2루"
    @back="navigateTo(`/property/${planId}/${propertyId}/consultations`)"
  >
    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>은행 가기 전 사전상담이야. 보증기관이 보증서를 내줘야 대출이 실행돼</CoachTip>

      <div class="bg-surface-brand rounded-field flex flex-col gap-1.5 p-4">
        <p class="text-label2 text-ink-hero font-bold">코치 팁</p>
        <p class="text-label2 text-ink-hero-body leading-5">
          매물에 이상이 없다면, 이제 은행에 방문해 실제 대출이 가능한지 사전 상담을 진행하세요.
          은행은 3곳 이상 돌아보는 게 좋아요.
        </p>
      </div>

      <div class="bg-surface-info rounded-chip flex flex-col gap-1 p-3">
        <p class="text-caption1 text-primary-strong">은행 창구에서</p>
        <p class="text-micro text-ink-hero-body">
          "청년 버팀목으로 진행하려고 합니다" 라고 상품을 명확하게 말하고, 아래 아홉 가지를 꼭
          물어보세요
        </p>
      </div>

      <AppCard class="flex flex-col gap-2.5">
        <h2 class="text-body3 text-ink-hero font-bold">상담 체크리스트</h2>

        <CheckItem v-for="question in QUESTIONS" :key="question" v-model="checked[question]">
          {{ question }}
        </CheckItem>
      </AppCard>

      <div class="bg-surface-info rounded-field flex flex-col gap-1.5 p-4">
        <p class="text-label2 text-ink-hero font-bold">준비물</p>
        <p class="text-caption2 text-ink-hero-body">· 신분증 (주민등록증/운전면허증/여권)</p>
        <p class="text-caption2 text-ink-hero-body">
          · 상담 받을 매물 등기부등본 2~3개 (계약 전이라 계약서는 아직 필요 없어요. 열람본
          인쇄물이면 충분해요)
        </p>
      </div>
    </div>

    <template #footer>
      <StepFooter
        @back="navigateTo(`/property/${planId}/${propertyId}/consultations`)"
        @next="navigateTo(`/property/${planId}/${propertyId}/consult-banks`)"
      >
        상담 결과 입력하기
      </StepFooter>
    </template>
  </StageShell>
</template>
