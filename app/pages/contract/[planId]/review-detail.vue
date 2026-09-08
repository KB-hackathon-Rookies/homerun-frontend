<script setup lang="ts">
/**
 * 3루 10 · 심사 확인 상세.
 *
 * 전화로 물어볼 것을 그대로 둔다. "진행 상황" 만 묻고 끊으면 송금 시간도
 * 질권설정 도달도 모른 채 잔금일을 맞는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const ASKS = [
  { title: '심사 진행 상황 · 승인 예정 여부', note: '' },
  { title: '추가 서류 요청이 있는지', note: '' },
  { title: '대출금 송금 시간', note: '오전인지 오후인지' },
  { title: '임대인에게 질권설정 통지가 도달했는지', note: '' },
];

const checked = ref<Record<string, boolean>>({});
</script>

<template>
  <GuideFrame title="심사 확인 상세" @back="navigateTo(`/contract/${planId}/review`)">
    <h2 class="text-option text-ink-hero px-1 pt-2">은행 담당자 확인 대본</h2>

    <p class="bg-surface-info rounded-field text-caption2 text-ink-hero px-3.5 py-3 font-medium">
      "잔금일이 O월 O일인데 실행 가능할까요?"
    </p>

    <h2 class="text-option text-ink-hero px-1 pt-2">전화로 물어봐야 할 것</h2>

    <AppCard class="flex flex-col gap-2">
      <CheckItem v-for="ask in ASKS" :key="ask.title" v-model="checked[ask.title]" tone="filled">
        {{ ask.title }}
        <template v-if="ask.note" #note>{{ ask.note }}</template>
      </CheckItem>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">상황별 대응</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-label2 text-success font-semibold">승인 진행 중이면</p>
      <p class="text-caption2 text-ink-hero">
        잔금일 타임라인대로 준비해요. D-day 오전 9시 등기부 재발급 잊지 마세요.
      </p>
    </AppCard>

    <div class="bg-badge-warning rounded-field flex flex-col gap-2.5 p-3.5">
      <p class="text-label2 text-warning-strong font-semibold">거절 통보를 받았다면</p>
      <p class="text-caption2 text-ink-hero">
        「대출 거절 대응」 화면으로 바로 가서 사유 확인 · 잔금일 대비 남은 일수 계산.
      </p>
      <button
        type="button"
        class="bg-surface-info border-focus-line rounded-chip text-label2 text-primary-strong self-start border px-3.5 py-2.5 font-semibold"
        @click="navigateTo(`/contract/${planId}/loan-rejected`)"
      >
        대출 거절 대응 상세로 이동 →
      </button>
    </div>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/review`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
