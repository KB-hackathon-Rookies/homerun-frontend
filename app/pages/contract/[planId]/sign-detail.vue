<script setup lang="ts">
import { COACH_TIME } from '~/components/contract/coachSheets';

/**
 * 3루 2 · 계약 · 상세 (시안 `687:2852`).
 *
 * 계약서·특약. 화면이 길다 — 실제 조항 문구와 왜 그 조항이 필요한지, 가계약금
 * 주의, 계약 때 챙길 것, 중개보수 계산까지 담는다. 사람이 계약장에서 한 번
 * 훑고 넘어가는 자리라 카드마다 뜻이 자기 자리에 있어야 한다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

interface Term {
  index: number;
  title: string;
  clause: string;
  note?: string;
}

const TERMS: Term[] = [
  {
    index: 1,
    title: '대출 미승인 시 계약 무효',
    clause:
      '"본 계약은 전세자금 대출로 진행하며, 대출 승인 불가 시 임대인은 계약금 전액을 반환한다"',
  },
  {
    index: 2,
    title: '잔금일 다음날까지 권리관계 유지',
    clause:
      '"임대인은 본 계약 체결일 이후 잔금 지급 및 임차인의 전입신고, 확정일자 완료 전까지 새로운 근저당권·전세권·임차권·압류·가압류·가처분 등 보증금 반환에 영향을 주는 권리를 설정하지 않는다"',
    note: '전입신고 다음날 0시부터 대항력이 생겨서, 그 하루 사이 근저당이 걸리면 은행이 우선이 돼요.',
  },
  {
    index: 3,
    title: '반환보증 가입 불가 시 계약 무효',
    clause:
      '"전세보증금반환보증 가입이 불가할 경우 본 계약은 무효로 하고 임대인은 계약금 전액을 반환한다"',
  },
  {
    index: 4,
    title: '전세대출 절차 협조',
    clause:
      '"임대인은 임차인의 전세자금대출 및 관련 보증 절차에 필요한 서류 제공 및 절차에 성실히 협조한다"',
    note: '주택임대차보호법은 편면적 강행규정이라 임차인에게 유리한 특약만 살아남아요.',
  },
];

interface TimeStep {
  chip: string;
  chipTone: 'muted' | 'warn' | 'primary';
  when: string;
  body: string;
}

const TIMELINE: TimeStep[] = [
  {
    chip: '잔금일',
    chipTone: 'muted',
    when: '낮',
    body: '은행이 임대인에게 대출금 송금 + 나머지 잔금 내가 송금 + 전입신고까지 완료. 내 돈은 이미 임대인 지갑.',
  },
  {
    chip: '그날 밤',
    chipTone: 'warn',
    when: '~다음날 새벽 0시 직전',
    body: '아직 법적으로 "세입자"가 아님 (대항력 미발생). 임대인이 이 밤에 근저당을 걸어버리면 은행이 나보다 먼저.',
  },
  {
    chip: '다음날',
    chipTone: 'primary',
    when: '새벽 0시',
    body: '이제야 대항력 발생. 근데 이미 근저당이 먼저 걸려 있으면 나중에 집 팔릴 때 은행이 먼저 배당받아 내 보증금이 남지 않을 수 있어요.',
  },
];

const CHIP_CLASS: Record<TimeStep['chipTone'], string> = {
  muted: 'bg-badge-neutral text-ink-strong',
  warn: 'bg-badge-warning text-warning-strong',
  primary: 'bg-badge-primary text-primary-strong',
};

const GAKYEYAK_TIPS = [
  '아무 권리가 없어요. 확정일자도 못 받고 대항력도 없음',
  '"다른 사람이 보러 온대요" 압박에 넘어가지 마세요',
  '문자로 주소·보증금·입주일이 오가면 계약 성립으로 볼 수 있어요',
  '최소 등기부·건축물대장·공시가격은 보고 넣으세요 (3분이면 확인)',
];

const CHECKS = [
  '임대인 신분증으로 등기부상 소유자와 대조',
  '대리인 계약이면 위임장 + 인감증명서',
  '중개대상물 확인설명서 수령',
  '공인중개사 공제증서 확인',
  '주택임대차 표준계약서 사용 요청',
  '부동산 전자계약 이용 (우대금리 0.1%p)',
];

const RATES = [
  { label: '5천만원 미만', rate: '0.5%', cap: '한도 20만' },
  { label: '5천 ~ 1억', rate: '0.4%', cap: '한도 30만' },
  { label: '1억 ~ 6억', rate: '0.3%', cap: '한도 없음' },
];
</script>

<template>
  <GuideFrame
    :coach-sheets="[COACH_TIME.contractTerms]"
    title="계약서·특약"
    @back="navigateTo(`/contract/${planId}/sign`)"
  >
    <!-- 섹션 1 · 필수 특약 4종 -->
    <p class="text-body3 text-ink-strong font-semibold">필수 특약 4종</p>

    <AppCard v-for="term in TERMS" :key="term.index" class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <span
          class="bg-primary-strong flex size-5.5 items-center justify-center rounded-full text-[11px] font-bold text-white"
        >
          {{ term.index }}
        </span>
        <p class="text-body3 text-ink-strong font-semibold">{{ term.title }}</p>
      </div>
      <div class="bg-surface-info rounded-field px-3.5 py-3">
        <p class="text-label2 text-ink-strong font-bold">{{ term.clause }}</p>
      </div>
      <p v-if="term.note" class="text-caption2 text-ink-card-body">{{ term.note }}</p>
    </AppCard>

    <!-- 섹션 2 · 왜 2번 특약이 필요한가 -->
    <p class="text-body3 text-ink-strong font-semibold pt-2">왜 2번 특약이 필요한가</p>

    <div class="bg-badge-warning rounded-field flex flex-col gap-3 p-4">
      <p class="text-body3 text-warning-strong font-semibold">
        전입신고를 해도 그날 밤은 무방비예요
      </p>
      <p class="text-caption2 text-ink-strong">
        "이 집 세입자"라는 법적 보호막은 전입신고 다음날 새벽 0시부터 생겨요.
      </p>

      <div
        v-for="step in TIMELINE"
        :key="step.chip"
        class="bg-surface rounded-chip flex flex-col gap-1.5 px-3.5 py-3"
      >
        <div class="flex items-center gap-2">
          <span
            class="rounded-chip-sm text-caption2 px-2 py-0.5 font-semibold"
            :class="CHIP_CLASS[step.chipTone]"
          >
            {{ step.chip }}
          </span>
          <span class="text-caption2 text-ink-card-body font-medium">{{ step.when }}</span>
        </div>
        <p class="text-caption2 text-ink-strong">{{ step.body }}</p>
      </div>

      <div class="bg-surface-info rounded-chip flex flex-col gap-1 px-3.5 py-3">
        <p class="text-caption2 text-primary-strong font-semibold">그래서 이 두 가지가 필요해요</p>
        <p class="text-caption2 text-ink-strong">
          • 특약 2번 · 잔금일 다음날까지 임대인이 새 근저당을 걸 수 없다는 조항
        </p>
        <p class="text-caption2 text-ink-strong">
          • 잔금일 아침에 등기부를 한 번 더 떼서 새로 걸린 게 없는지 확인
        </p>
      </div>
    </div>

    <!-- 섹션 3 · 가계약금 주의 -->
    <p class="text-body3 text-ink-strong font-semibold pt-2">가계약금 주의</p>

    <AppCard class="flex flex-col gap-2">
      <p class="text-body3 text-ink-strong font-semibold">계약서 없이 먼저 넣는 돈은 위험해요</p>
      <p v-for="tip in GAKYEYAK_TIPS" :key="tip" class="text-caption2 text-ink-strong">
        • {{ tip }}
      </p>
    </AppCard>

    <!-- 섹션 4 · 계약 때 챙길 것 -->
    <p class="text-body3 text-ink-strong font-semibold pt-2">계약 때 챙길 것</p>

    <AppCard class="flex flex-col gap-2">
      <p class="text-body3 text-ink-strong font-semibold">서류·확인 체크</p>
      <p v-for="c in CHECKS" :key="c" class="text-caption2 text-ink-strong">☐ {{ c }}</p>

      <div class="bg-surface-info rounded-field flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption2 text-primary-strong font-semibold">계약금 영수증</p>
        <p class="text-caption2 text-ink-strong">• 계약금은 등기부상 소유자 명의 계좌로만 송금</p>
        <p class="text-caption2 text-ink-strong">
          • 이체확인증 즉시 발급·보관 (대출 신청 시 필수 증빙)
        </p>
      </div>
    </AppCard>

    <!-- 섹션 5 · 중개보수 계산 -->
    <p class="text-body3 text-ink-strong font-semibold pt-2">중개보수 계산</p>

    <AppCard class="flex flex-col gap-2.5">
      <p class="text-body3 text-ink-strong font-semibold">전세 요율표</p>
      <div
        v-for="row in RATES"
        :key="row.label"
        class="bg-surface-info-soft rounded-chip flex items-center justify-between px-3 py-2"
      >
        <span class="text-caption2 text-ink-strong font-medium">{{ row.label }}</span>
        <div class="flex items-center gap-2">
          <span class="text-caption2 text-primary-strong font-semibold">{{ row.rate }}</span>
          <span class="text-micro text-ink-muted font-medium">{{ row.cap }}</span>
        </div>
      </div>

      <div class="bg-surface-info rounded-field flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption2 text-primary-strong font-semibold">예시 · 정하은</p>
        <p class="text-caption2 text-ink-strong">1억 8,000만 × 0.3% = 54만</p>
        <p class="text-caption2 text-ink-strong">+ 부가세(10%) = 총 59.4만</p>
        <p class="text-caption2 text-ink-strong pt-1">
          상한이지 정가가 아니라 협의 가능. 보통 잔금일에 지급.
        </p>
      </div>
    </AppCard>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/sign`)">
        돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
