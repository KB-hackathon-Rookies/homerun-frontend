<script setup lang="ts">
/**
 * 대응 · 대출 거절.
 *
 * **구두로만 들으면 특약을 발동할 증거가 없다.** 그래서 사유를 문서로
 * 받는 것부터 시작한다.
 *
 * 남은 일수에 따라 할 수 있는 게 다르다 — D-25 면 다른 은행을 다시 갈 수
 * 있지만 D-7 이면 계약금 손실을 계산해야 한다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const CAUSES = [
  {
    title: '사람 문제 (소득·신용·무주택)',
    hint: '은행 바꿔도 동일 · 조건 조정 필요',
    tone: 'warn',
  },
  { title: '집 문제 (취급 여부·보증기관)', hint: '다른 은행에 희망 있음', tone: 'info' },
  { title: '보증기관 거절', hint: '같은 은행에서 담보만 바꿔볼 수 있음', tone: 'info' },
  { title: '서류 문제', hint: '보완하면 진행 가능', tone: 'ok' },
] as const;

const BY_DAYS = [
  { days: 'D-25↑', what: '다른 은행 재시도 (심사 2~3주)', tone: 'ok' },
  { days: 'D-14↑', what: '보증기관 변경 · 보증금 하향 협상', tone: 'info' },
  { days: 'D-7↓', what: '계약금 손실 감수하고 파기 검토', tone: 'warn' },
] as const;

const TONE_TEXT = {
  ok: 'text-success',
  info: 'text-primary-strong',
  warn: 'text-warning-strong',
} as const;

const TONE_PILL = {
  ok: 'bg-badge-success text-success',
  info: 'bg-surface-info text-primary-deep',
  warn: 'bg-badge-warning text-warning-strong',
} as const;
</script>

<template>
  <GuideFrame title="대출 거절 대응 상세" @back="navigateTo(`/contract/${planId}/review`)">
    <h2 class="text-option text-ink-hero px-1 pt-2">먼저 사유를 문서로 받으세요</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-label2 text-ink-hero font-semibold">"대출 거절 확인서" 또는 "불승인 통지서"</p>
      <p class="text-caption2 text-ink-hero">
        구두로만 들으면 특약을 발동할 증거가 없어요. 어디서 막혔는지, 무엇 때문인지 확인:
      </p>
      <div class="bg-surface-info rounded-field flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption2 text-ink-hero font-medium">• 어디서 · 은행 심사 vs 보증기관 심사</p>
        <p class="text-caption2 text-ink-hero font-medium">• 무엇 · 소득 / 신용 / 계약 / 집 조건</p>
      </div>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">사유별로 길이 갈려요</h2>

    <AppCard class="flex flex-col gap-2 p-2.5">
      <div
        v-for="cause in CAUSES"
        :key="cause.title"
        class="bg-surface-info rounded-chip flex flex-col gap-0.5 p-3"
      >
        <p class="text-label2 text-ink-hero font-semibold">{{ cause.title }}</p>
        <p class="text-caption2" :class="TONE_TEXT[cause.tone]">{{ cause.hint }}</p>
      </div>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">보증기관을 바꿔보기</h2>

    <AppCard class="flex flex-col gap-1">
      <p class="text-caption2 text-ink-hero">• HUG 거절 → SGI 또는 HF</p>
      <p class="text-caption2 text-ink-hero">• SGI 거절 → 정책형 재검토</p>
      <p class="text-caption2 text-ink-hero">• HF 거절 → SGI (소득 기준이 없음)</p>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">특약이 있으면 이 순서</h2>

    <AppCard class="flex flex-col gap-1">
      <p class="text-caption2 text-ink-hero">1. 은행에서 거절 확인서 수령</p>
      <p class="text-caption2 text-ink-hero">2. 중개사에게 통지</p>
      <p class="text-caption2 text-ink-hero">3. 임대인에게 서면 통지, 계약금 반환 요구</p>
      <p class="text-caption2 text-ink-hero">4. 계약금 반환 (내용증명으로 보내면 확실)</p>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">특약이 없으면 · 남은 일수 기준</h2>

    <AppCard class="flex flex-col gap-1 p-2.5">
      <div
        v-for="row in BY_DAYS"
        :key="row.days"
        class="border-line-soft flex items-center gap-2.5 border-b p-2.5 last:border-b-0"
      >
        <span
          class="rounded-chip text-micro w-12 shrink-0 py-0.5 text-center font-semibold"
          :class="TONE_PILL[row.tone]"
        >
          {{ row.days }}
        </span>
        <span class="text-caption2 text-ink-hero flex-1 font-semibold">{{ row.what }}</span>
      </div>
    </AppCard>

    <div class="bg-surface-info rounded-field flex flex-col gap-1.5 p-3.5">
      <p class="text-label2 text-primary-strong font-semibold">잔금일 연기 요청도 방법</p>
      <p class="text-caption2 text-ink-hero">임대인도 계약이 깨지면 손해예요.</p>
    </div>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/review`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
