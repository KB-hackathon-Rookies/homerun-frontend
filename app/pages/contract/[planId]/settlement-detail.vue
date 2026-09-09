<script setup lang="ts">
import { COACH_TIME } from '~/components/contract/coachSheets';
/**
 * 3루 11 · 잔금일 상세.
 *
 * 돈의 흐름을 그려 둔다. **대출금은 내 통장을 거치지 않는다** — 은행이
 * 임대인에게 바로 보낸다. 착오로 내가 받았는데 그대로 두면 대출이 안
 * 갚아져 연체가 된다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const TIMELINE = [
  { when: '오전 9시', what: '등기부등본 재발급 → 계약 때와 대조', key: true },
  { when: '오전', what: '은행에서 임대인 계좌로 대출금 송금', key: false },
  { when: '오전', what: '나머지 잔금을 내가 임대인에게 송금', key: false },
  { when: '오전~오후', what: '이사 · 입주 사진 촬영', key: false },
  { when: '오후', what: '주민센터 전입신고 (18시까지)', key: true },
];

const COMPARE = [
  { label: '소유자', stop: '다르면 중단' },
  { label: '채권최고액', stop: '늘었으면 중단' },
  { label: '근저당 건수', stop: '늘었으면 중단' },
  { label: '압류 · 가압류', stop: '새로 생겼으면 중단' },
];
</script>

<template>
  <GuideFrame
    :coach-sheets="[COACH_TIME.registryTrap]"
    title="잔금일 타임라인"
    @back="navigateTo(`/contract/${planId}/settlement`)"
  >
    <h2 class="text-option text-ink-hero px-1 pt-2">오늘의 타임라인</h2>

    <AppCard class="flex flex-col gap-1 p-2.5">
      <div
        v-for="row in TIMELINE"
        :key="row.what"
        class="border-line-soft flex items-center gap-2.5 border-b p-2.5 last:border-b-0"
      >
        <span
          class="rounded-chip text-micro shrink-0 px-2 py-0.5 font-semibold"
          :class="row.key ? 'bg-primary-strong text-white' : 'bg-surface-info text-primary-strong'"
        >
          {{ row.when }}
        </span>
        <span class="text-label2 text-ink-hero flex-1 font-semibold">{{ row.what }}</span>
      </div>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">돈의 흐름</h2>

    <AppCard class="flex flex-col gap-2.5">
      <div class="bg-surface-info rounded-chip flex items-center justify-between px-3 py-2.5">
        <span class="text-label2 text-ink-hero font-semibold">은행 → 임대인</span>
        <span class="text-caption2 text-primary-strong font-semibold">대출금</span>
      </div>
      <div class="bg-surface-info rounded-chip flex items-center justify-between px-3 py-2.5">
        <span class="text-label2 text-ink-hero font-semibold">나 → 임대인</span>
        <span class="text-caption2 text-primary-strong font-semibold"
          >내 돈 (계약금 제외한 잔금)</span
        >
      </div>
      <div class="bg-badge-warning rounded-field flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption2 text-warning-strong font-semibold">
          대출금은 내 통장을 거치지 않아요
        </p>
        <p class="text-caption2 text-ink-hero">
          착오로 내가 받았다면 즉시 은행에 반환하세요. 그대로 두면 대출이 안 갚아져 연체가 됩니다.
        </p>
      </div>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">송금 전 대조표</h2>

    <AppCard class="flex flex-col gap-1 p-2.5">
      <div
        v-for="row in COMPARE"
        :key="row.label"
        class="border-line-soft flex items-center gap-2.5 border-b p-2.5 last:border-b-0"
      >
        <span class="text-label2 text-ink-hero flex-1 font-semibold">☐ {{ row.label }}</span>
        <span class="text-micro text-warning-strong shrink-0">{{ row.stop }}</span>
      </div>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">등기부가 바뀌었다면</h2>

    <div class="bg-badge-warning rounded-field flex flex-col gap-2.5 p-3.5">
      <p class="text-label2 text-warning-strong font-semibold">
        하나라도 바뀌었으면 잔금을 보내지 마세요
      </p>
      <p class="text-caption2 text-ink-hero">
        특약 2번 위반이라 계약을 해제할 수 있어요. 대응 절차는 「등기부 변동 대응」 화면에서
        확인하세요.
      </p>
      <button
        type="button"
        class="bg-surface-info border-focus-line rounded-chip text-label2 text-primary-strong self-start border px-3.5 py-2.5 font-semibold"
        @click="navigateTo(`/contract/${planId}/registry-changed`)"
      >
        등기부 변동 대응 상세로 이동 →
      </button>
    </div>

    <h2 class="text-option text-ink-hero px-1 pt-2">전입신고는 오전에</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-label2 text-ink-hero font-semibold">대항력은 신고 다음날 0시부터</p>
      <p class="text-caption2 text-ink-hero">
        • 온라인 신고는 오후 6시 이후 접수 시 다음 근무일 처리
      </p>
      <p class="text-caption2 text-ink-hero">• 주민센터는 보통 18시까지</p>
      <p class="text-caption2 text-ink-hero">• 반드시 당일 오전에 처리하세요</p>
    </AppCard>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/settlement`)">
        돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
