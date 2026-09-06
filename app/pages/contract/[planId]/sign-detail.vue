<script setup lang="ts">
import { BROKERAGE_RATES, TERMS } from '~/components/contract/terms';

/**
 * 3루 2 · 계약 상세.
 *
 * 특약 원문을 그대로 둔다. 요약만 보고 자기 말로 옮겨 적으면 나중에
 * 다투게 된다.
 *
 * 2번 특약에 화면 절반을 쓰는 이유가 있다. **전입신고를 해도 그날 밤은
 * 무방비**라는 게 안 알려져 있어서다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const NIGHT = [
  {
    tag: '잔금일',
    when: '낮',
    tone: 'plain',
    body: '은행이 임대인에게 대출금 송금 + 나머지 잔금 내가 송금 + 전입신고까지 완료. 내 돈은 이미 임대인 지갑.',
  },
  {
    tag: '그날 밤',
    when: '~다음날 새벽 0시 직전',
    tone: 'warn',
    body: '아직 법적으로 "세입자"가 아님 (대항력 미발생). 임대인이 이 밤에 근저당을 걸어버리면 은행이 나보다 먼저.',
  },
  {
    tag: '다음날',
    when: '새벽 0시',
    tone: 'info',
    body: '이제야 대항력 발생. 근데 이미 근저당이 먼저 걸려 있으면 나중에 집 팔릴 때 은행이 먼저 배당받아 내 보증금이 남지 않을 수 있어요.',
  },
] as const;

const DEPOSIT_WARNINGS = [
  '• 아무 권리가 없어요. 확정일자도 못 받고 대항력도 없음',
  '• "다른 사람이 보러 온대요" 압박에 넘어가지 마세요',
  '• 문자로 주소·보증금·입주일이 오가면 계약 성립으로 볼 수 있어요',
  '• 최소 등기부·건축물대장·공시가격은 보고 넣으세요 (3분이면 확인)',
];

const SIGN_CHECKS = [
  '임대인 신분증으로 등기부상 소유자와 대조',
  '대리인 계약이면 위임장 + 인감증명서',
  '중개대상물 확인설명서 수령',
  '공인중개사 공제증서 확인',
  '주택임대차 표준계약서 사용 요청',
  '부동산 전자계약 이용 (우대금리 0.1%p)',
];

const checked = ref<Record<string, boolean>>({});

const TAG_CLASS = {
  plain: 'bg-line text-ink-hero',
  warn: 'bg-badge-warning text-warning-strong',
  info: 'bg-surface-info text-primary-strong',
} as const;
</script>

<template>
  <GuideFrame title="계약 상세" @back="navigateTo(`/contract/${planId}/sign`)">
    <h2 class="text-option text-ink-hero px-1 pt-2">필수 특약 4종</h2>

    <NumberedCard
      v-for="(term, index) in TERMS"
      :key="term.title"
      :index="index + 1"
      :title="term.title"
    >
      <p class="bg-surface-info rounded-field text-caption2 text-ink-hero px-3.5 py-3 font-medium">
        {{ term.full }}
      </p>
      <p v-if="term.why" class="text-caption2 text-ink-hero-body">{{ term.why }}</p>
    </NumberedCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">왜 2번 특약이 필요한가</h2>

    <div class="bg-badge-warning rounded-field flex flex-col gap-3 p-4">
      <p class="text-body3 text-warning-strong font-semibold">
        전입신고를 해도 그날 밤은 무방비예요
      </p>
      <p class="text-caption2 text-ink-hero">
        "이 집 세입자"라는 법적 보호막은 전입신고 다음날 새벽 0시부터 생겨요.
      </p>

      <div
        v-for="stage in NIGHT"
        :key="stage.tag"
        class="bg-surface rounded-chip flex flex-col gap-1.5 px-3.5 py-3"
      >
        <div class="flex items-center gap-2">
          <span
            class="rounded-chip text-micro px-2 py-0.5 font-semibold"
            :class="TAG_CLASS[stage.tone]"
          >
            {{ stage.tag }}
          </span>
          <span class="text-caption2 text-ink-hero-body font-medium">{{ stage.when }}</span>
        </div>
        <p class="text-caption2 text-ink-hero">{{ stage.body }}</p>
      </div>

      <div class="bg-surface-info rounded-chip flex flex-col gap-1 px-3.5 py-3">
        <p class="text-caption2 text-primary-strong font-semibold">그래서 이 두 가지가 필요해요</p>
        <p class="text-caption2 text-ink-hero">
          • 특약 2번 · 잔금일 다음날까지 임대인이 새 근저당을 걸 수 없다는 조항
        </p>
        <p class="text-caption2 text-ink-hero">
          • 잔금일 아침에 등기부를 한 번 더 떼서 새로 걸린 게 없는지 확인
        </p>
      </div>
    </div>

    <h2 class="text-option text-ink-hero px-1 pt-2">가계약금 주의</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-label2 text-ink-hero font-semibold">계약서 없이 먼저 넣는 돈은 위험해요</p>
      <p v-for="line in DEPOSIT_WARNINGS" :key="line" class="text-caption2 text-ink-hero">
        {{ line }}
      </p>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">계약 때 챙길 것</h2>

    <AppCard class="flex flex-col gap-2">
      <p class="text-label2 text-ink-hero font-semibold">서류·확인 체크</p>
      <CheckItem v-for="item in SIGN_CHECKS" :key="item" v-model="checked[item]">
        {{ item }}
      </CheckItem>

      <div class="bg-surface-info rounded-field flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption2 text-primary-strong font-semibold">계약금 영수증</p>
        <p class="text-caption2 text-ink-hero">• 계약금은 등기부상 소유자 명의 계좌로만 송금</p>
        <p class="text-caption2 text-ink-hero">
          • 이체확인증 즉시 발급·보관 (대출 신청 시 필수 증빙)
        </p>
      </div>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">중개보수 계산</h2>

    <AppCard class="flex flex-col gap-2.5">
      <p class="text-label2 text-ink-hero font-semibold">전세 요율표</p>

      <div
        v-for="row in BROKERAGE_RATES"
        :key="row.range"
        class="bg-surface-info rounded-chip flex items-center justify-between px-2.5 py-2"
      >
        <span class="text-caption2 text-ink-hero font-medium">{{ row.range }}</span>
        <span class="flex items-center gap-2">
          <span class="text-caption2 text-primary-strong font-semibold">{{ row.rate }}</span>
          <span class="text-micro text-ink-muted font-medium">{{ row.cap }}</span>
        </span>
      </div>

      <div class="bg-surface-info rounded-field flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption2 text-primary-strong font-semibold">예시</p>
        <p class="text-caption2 text-ink-hero">
          1억 8,000만 × 0.3% = 54만 + 부가세(10%) = 총 59.4만 상한이지 정가가 아니라 협의 가능. 보통
          잔금일에 지급.
        </p>
      </div>
    </AppCard>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/sign`)">
        계약 화면으로
      </AppButton>
    </template>
  </GuideFrame>
</template>
