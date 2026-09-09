<script setup lang="ts">
import { COACH_TIME } from '~/components/contract/coachSheets';
/**
 * 3루 1 · 임장 상세.
 *
 * 순서가 뜻을 갖는다. 수압을 제일 먼저 보는 이유는 물을 다 틀어 놓고
 * 나머지를 도는 동안 배수가 밀리는지 알 수 있어서다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

interface Script {
  title: string;
  line: string;
  required: boolean;
}

const SCRIPTS: Script[] = [
  { title: '받고자 하는 대출상품', line: '"청년 버팀목대출을 받을 예정입니다"', required: true },
  { title: '예산 (보증금 한도)', line: '"예산은 ____만원으로 잡고 있습니다"', required: true },
  {
    title: '전세대출 협조 여부',
    line: '"임대인분이 질권설정이나 채권양도에 협조 가능하신지 확인 부탁드립니다"',
    required: true,
  },
];

const STEPS = [
  {
    title: '수압 · 배수 (제일 먼저)',
    body: '세면대·샤워기·싱크대를 동시에 튼 상태로 변기 물 내리기. 뜨거운 물도 틀어보고 보일러 연식 확인 (10년 이내면 좋음).',
  },
  {
    title: '곰팡이 · 누수',
    body: '창가·현관 벽에 새로 도배한 흔적이 있으면 의심. 벽지를 살짝 만졌을 때 축축하면 누수.',
  },
  { title: '단열 · 방음', body: '이중창인지 단창인지 확인. 창틀·문틀 실리콘이 갈라졌는지 체크.' },
  {
    title: '채광 · 환기',
    body: '남향이어도 앞 건물에 가려 빛이 안 드는 경우가 있어요. 채광 시간이 얼마나 되는지 물어보기.',
  },
  {
    title: '관리비 상세',
    body: '관리비에 무엇이 포함되는지 반드시 확인. 인터넷·수도·전기가 별도인지 체크.',
  },
  {
    title: '옵션 상태',
    body: '에어컨 켰을 때 곰팡이 냄새가 나는지. 옵션 목록을 계약서에 적어달라고 요청.',
  },
  { title: '안전', body: 'CCTV 위치 · 방범창 · 도어락 작동 확인.' },
];
</script>

<template>
  <GuideFrame
    :coach-sheets="[COACH_TIME.visitChecklist]"
    title="임장 체크리스트"
    @back="navigateTo(`/contract/${planId}/visit`)"
  >
    <h2 class="text-option text-ink-hero px-1 pt-2">공인중개사에게 이렇게 말해요</h2>

    <AppCard
      v-for="script in SCRIPTS"
      :key="script.title"
      class="flex flex-col gap-1.5 px-3.5 py-3"
    >
      <div class="flex items-center gap-1.5">
        <span
          v-if="script.required"
          class="bg-primary-strong rounded-chip text-micro px-1.5 py-0.5 font-semibold text-white"
        >
          필수
        </span>
        <span class="text-label2 text-ink-hero font-semibold">{{ script.title }}</span>
      </div>
      <p class="bg-surface-info rounded-field text-caption2 text-ink-hero px-3 py-2.5 font-medium">
        {{ script.line }}
      </p>
    </AppCard>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-label2 text-ink-hero font-semibold">선택 · 기타 조건</p>
      <p class="text-caption2 text-ink-hero">• 전용면적 85제곱미터 이하</p>
      <p class="text-caption2 text-ink-hero">• 위반건축물이 아닌 곳</p>
      <p class="text-caption2 text-ink-hero">• 다가구보다는 다세대</p>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">임장 체크 · 이 순서로 5분</h2>

    <NumberedCard
      v-for="(step, index) in STEPS"
      :key="step.title"
      :index="index + 1"
      :title="step.title"
    >
      <p class="text-caption2 text-ink-hero">{{ step.body }}</p>
    </NumberedCard>

    <div class="bg-badge-warning rounded-field flex flex-col gap-1.5 p-3.5">
      <p class="text-label2 text-warning-strong font-semibold">관리비는 특약에 적어야 해요</p>
      <p class="text-caption2 text-ink-hero">
        구두로 들었어도 특약에 없으면 나중에 증명하기 어려워요. 정액 4만원인 줄 알았다가 여름에
        10만원 넘게 나오는 경우가 있어요.
      </p>
    </div>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/visit`)">
        돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
