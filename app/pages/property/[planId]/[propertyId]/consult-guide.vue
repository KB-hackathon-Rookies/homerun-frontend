<script setup lang="ts">
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

const QUESTIONS = [
  '은행 3군데 이상 방문했나요?',
  '이 주택으로 취급이 되는지 물어봤나요?',
  '어느 보증서로 진행되는지 물어봤나요? (안심전세/주신보)',
  '내 소득으로 한도가 얼마나 나오는지 물어봤나요?',
  '잔금일까지 심사가 끝날 수 있는지 물어봤나요?',
  '등기부등본을 제가 떼 가야 하는지 물어봤나요?',
];

const checked = ref<Record<string, boolean>>({});
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="은행 사전상담"
      base="2루"
      @back="navigateTo(`/property/${planId}/${propertyId}/consultations`)"
    />

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
          "청년 버팀목으로 진행하려고 합니다" 라고 명확하게 상품을 지정해서 요청하세요
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
          · 상담 받을 매물 등기부등본 2~3부 (열람본 인쇄물)
        </p>
      </div>
    </div>

    <StepFooter
      @back="navigateTo(`/property/${planId}/${propertyId}/consultations`)"
      @next="navigateTo(`/property/${planId}/${propertyId}/consult-banks`)"
    >
      상담 결과 입력하기
    </StepFooter>
  </PhoneFrame>
</template>
