<script setup lang="ts">
/**
 * 3루 7 · 서류 일괄 발급 (D-14).
 *
 * **사이트 단위로 묶어서 하루에 끝낸다.** 서류가 열 개가 넘어 보이지만
 * 실제로 들어가는 곳은 다섯 군데뿐이고, 발로 가야 하는 건 주민센터
 * 하나다. 서류 이름순으로 하면 같은 사이트를 세 번 들어가게 된다.
 *
 * 너무 일찍 떼면 안 된다 — 대출 제출용은 1개월 이내 발급분만 인정한다.
 * 그래서 D-14 에 몰아서 뗀다. 회사 서류만 예외로 D-30 에 미리 요청한다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

/** 하루 안에 도는 순서. 순서가 뜻을 갖는다 — 마지막 주민센터만 발로 간다. */
const ORDER = [
  { site: '정부24', minutes: '10분', docs: '주민등록등본 · 가족관계증명서 · 건축물대장' },
  { site: '인터넷등기소', minutes: '5분', docs: '등기부등본 발급본' },
  { site: '홈택스', minutes: '10분', docs: '원천징수영수증 · 소득금액증명원' },
  { site: '건강보험공단', minutes: '5분', docs: '자격득실확인서' },
  { site: '은행 앱', minutes: '5분', docs: '계약금 이체확인증 · 급여통장 거래내역서' },
  { site: '주민센터', minutes: '30분', docs: '전입세대확인서 (해당 시) · 유일한 방문' },
];

/** 다 떼고 나서 짚는 것. 하나라도 어긋나면 창구에서 되돌아온다. */
const CHECKS = [
  '모든 서류가 1개월 이내 발급인가',
  '주민등록번호가 마스킹 없이 나오는가',
  '주민등록등본에 주소변동 이력이 나오는가',
  '등기부등본이 열람본이 아니라 발급본인가',
  '등기부등본에 말소사항이 포함되어 있는가',
  '계약서와 등기부 주소가 정확히 일치하는가',
  '전입세대확인서에 성명이 가려지지 않았는가',
];

const checked = ref<Record<string, boolean>>({});
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="D-14 서류 일괄 발급"
      base="3루"
      @back="navigateTo(`/contract/${planId}/bank-visit`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>
        서류가 열 개 넘어서 막막하죠? 사이트별로 묶으면 다섯 군데서 끝나요. 온라인이 안 되는 건
        전입세대확인서 하나뿐이에요
      </CoachTip>

      <div class="bg-badge-warning rounded-field flex flex-col gap-1.5 p-3.5">
        <p class="text-label2 text-warning-strong font-semibold">
          대출 제출용 = 1개월 이내 발급분만 인정
        </p>
        <p class="text-caption2 text-ink-hero">
          너무 미리 떼면 재발급이 필요해요. D-14 전후에 한번에 몰아서 발급.
        </p>
      </div>

      <h2 class="text-body3 text-ink-hero font-bold">하루 만에 끝내기 · 이 순서대로</h2>

      <AppCard class="flex flex-col gap-2.5">
        <div v-for="(step, index) in ORDER" :key="step.site" class="flex items-start gap-2.5">
          <span
            class="bg-primary-strong text-micro mt-0.5 grid size-5.5 shrink-0 place-items-center rounded-full font-bold text-white"
            aria-hidden="true"
          >
            {{ index + 1 }}
          </span>
          <span class="flex flex-1 flex-col gap-0.5">
            <span class="flex items-center gap-1.5">
              <span class="text-label2 text-ink-hero font-semibold">{{ step.site }}</span>
              <span
                class="bg-surface-info rounded-chip text-micro text-primary-strong px-1.5 py-0.5 font-semibold"
              >
                {{ step.minutes }}
              </span>
            </span>
            <span class="text-micro text-ink-hero-body">{{ step.docs }}</span>
          </span>
        </div>

        <p class="bg-surface-brand rounded-chip text-micro text-ink-hero-body p-3">
          회사 서류(D-30)는 이보다 훨씬 먼저 요청해 두세요
        </p>
      </AppCard>

      <h2 class="text-body3 text-ink-hero font-bold">떼고 나서 확인할 것</h2>

      <CheckItem v-for="item in CHECKS" :key="item" v-model="checked[item]">{{ item }}</CheckItem>

      <DetailLink @open="navigateTo(`/contract/${planId}/documents`)">
        서류별 발급 방법 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight flex shrink-0 gap-2 pt-2.5 pb-cta-pad">
      <div class="w-28 shrink-0">
        <AppButton variant="white" @click="navigateTo(`/contract/${planId}/bank-visit`)">
          이전
        </AppButton>
      </div>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/resident-cert`)">
        다음
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
