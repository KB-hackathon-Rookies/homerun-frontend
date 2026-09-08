<script setup lang="ts">
import { usePropertyStepGuard } from '~/utils/propertyStepGuard';
import { COACH_TIME } from '~/components/property/coachSheets';
import { SECOND_BASE_STEPS } from '~/components/property/steps';

/**
 * 2루 6 · 등기부등본 발급 안내.
 *
 * 등기부는 자동으로 못 가져온다. 열람에 돈이 들고 본인 인증이 필요해서
 * 사람이 직접 뗀다. 그래서 이 화면은 저장하는 값이 없다 — 어디서 어떻게
 * 떼는지만 알려준다.
 *
 * '말소사항 포함' 을 굵게 두는 이유가 있다. 기본값인 '현재 유효사항' 으로
 * 떼면 해결된 사고 이력이 안 보여서 깨끗한 집처럼 읽힌다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

/**
 * 여기는 저장하는 값이 없지만 STEP 4 의 첫 화면이다. 아직 앞 STEP 에 머문 매물이
 * URL 로 들어오면 등기부부터 떼게 만들고, 정작 체크리스트에서 막힌다. 700원과
 * 본인 인증이 드는 일이라 헛걸음이 특히 비싸다 — 지금 단계 화면으로 돌려보낸다.
 */
usePropertyStepGuard(planId, propertyId, 'registry');

const STEPS = [
  '1. 부동산 등기사항증명서 열람·발급 신청 (부동산 > 열람·발급)',
  "2. '말소사항 포함' 선택 / '현재 유효사항' 선택 X",
  '3. 우선은 열람만 하기 (700원 비용 발생)',
  '4. 저장하고 인쇄해두기',
];

const PARTS = [
  '① 표제부. 집의 기본 정보(소재지·면적·용도)',
  '② 갑구. 소유권, 압류·가처분·신탁·임차권등기',
  '③ 을구. 근저당권 설정, 채권최고액',
];

/** ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="[COACH_TIME.registryReading]"
    brand
    base="2루"
  >
    <div class="bg-canvas-soft flex min-h-full flex-col gap-4 px-4 pt-4 pb-6">
      <SubStep :steps="SECOND_BASE_STEPS" :current="1" />

      <p class="text-caption1 text-ink-label font-medium">2루 · 등기부 확인</p>
      <h1 class="text-question text-ink-card">등기부등본은 직접 확인해야 해요</h1>

      <AppCard class="flex flex-col gap-3">
        <p class="text-body2 text-primary-strong font-bold">인터넷 등기소 (iros.go.kr)</p>
        <p v-for="step in STEPS" :key="step" class="text-label2 text-ink-card-body">{{ step }}</p>
      </AppCard>

      <!--
        시안(`687:14492`)은 셋의 이름만 적고 끝낸다. 각각이 무엇인지는 ⓘ 로 여는
        코치 TIME 이 맡는다 — 화면에 다 풀면 정작 "가서 떼오세요" 가 묻힌다.

        예전에 있던 팁 세 줄(집합건물 동호수 / 단독주택 / 인쇄해두기)도 시안에서는
        카드가 아니라 그 시트 안에 있다. 옮기기만 했고 문구는 그대로다.
      -->
      <AppCard class="flex flex-col gap-3">
        <div class="flex items-center gap-1.5">
          <p class="text-body3 text-ink-strong font-bold">등기부등본에서 확인해야 하는 것</p>
          <InfoDot @click="coachOpen = true" />
        </div>
        <p v-for="part in PARTS" :key="part" class="text-label2 text-ink-card-body">{{ part }}</p>
      </AppCard>
    </div>

    <StepFooter
      @back="navigateTo(`/property/${planId}/${propertyId}/detail`)"
      @next="navigateTo(`/property/${planId}/${propertyId}/registry-check`)"
    >
      발급 완료, 체크리스트로
    </StepFooter>
  </StageShell>
</template>
