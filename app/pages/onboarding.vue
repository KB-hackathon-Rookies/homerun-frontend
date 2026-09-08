<script setup lang="ts">
import type { Base } from '~/components/common/StepIndicator.vue';
import type { MatchRow } from '~/components/onboarding/MatchCard.vue';
import type { SettleRow } from '~/components/onboarding/SettleCard.vue';
import type { Task } from '~/components/onboarding/TaskCard.vue';

/**
 * OB-01 ~ OB-04 온보딩.
 *
 * 피그마는 네 장으로 그려져 있지만 뼈대가 완전히 같다. 진행 표시 · 제목 · 설명 ·
 * 카드 · 안내 · 버튼. 달라지는 건 카드 안쪽뿐이라 화면을 넷으로 쪼개는 대신
 * 한 화면에서 단계만 넘긴다. 뒤로 가기도 자연스럽게 붙는다.
 *
 * 카드에 보이는 숫자는 전부 예시다. 실제 판정은 백엔드가 한다.
 */
interface Step {
  base: Base;
  title: string;
  description: string;
  note: string;
  noteTone?: 'primary' | 'success';
  card:
    | { kind: 'match'; badge: string; rows: MatchRow[] }
    | { kind: 'task'; label: string; value: string; progress: number; tasks: Task[] }
    | { kind: 'settle'; label: string; value: string; progress: number; rows: SettleRow[] };
}

const STEPS: Step[] = [
  {
    base: '1루',
    title: '내가 받을 수 있는\n대출·정책을 찾아요',
    description: '내 조건과 정책 조건을 자동으로 매칭해줘요.',
    note: '공고 원문의 기준값과 대조합니다 · 규칙 버전 v2026.09-01',
    card: {
      kind: 'match',
      badge: '내 조건',
      rows: [
        { icon: 'user', mine: '만 나이 33세', target: '만 19~34세' },
        { icon: 'coin', mine: '연 소득 3,216만', target: '3,600만 이하' },
        { icon: 'home', mine: '보증금 6,000만', target: '5,000만 이하' },
      ],
    },
  },
  {
    base: '2루',
    title: '내 매물이\n안전한지 확인해요',
    description: '등기부·위반건축물·반환보증 조건을 함께 판정해요.',
    note: '매물 정보를 검증 기준과 대조합니다 · 검증 규칙 v2026.09-01',
    card: {
      kind: 'match',
      badge: '매물 확인',
      rows: [
        { icon: 'document', mine: '등기부등본', target: '근저당 없음' },
        { icon: 'building', mine: '위반건축물', target: '미등재 확인' },
        { icon: 'shield', mine: '반환보증', target: 'HUG 가능' },
      ],
    },
  },
  {
    base: '3루',
    title: '계약과 대출\n실행까지 챙겨드려요',
    description: '잔금일부터 이사까지, 챙길 서류와 순서를 알아서 정리해요.',
    note: '잔금일까지 자동 알림으로 놓치지 않아요.',
    card: {
      kind: 'task',
      label: 'D-day',
      value: '11.20',
      // 피그마의 막대가 318 중 231 이라 그 비율을 그대로 옮겼다.
      progress: 231 / 318,
      tasks: [
        { title: '잔금일 대조 & 송금', meta: '오늘 9시부터 순서대로', state: 'done' },
        { title: '서류 일괄 발급', meta: 'D-14 완료', state: 'current' },
        { title: '은행 방문 예약', meta: 'D-21 완료', state: 'locked' },
      ],
    },
  },
  {
    base: '홈',
    title: '이사 후\n정착까지 함께해요',
    description: '이사 후에 챙길 것들을, 때에 맞춰 알려드려요.',
    note: '홈런이 든든한 코치가 되어 끝까지 함께할게요!',
    noteTone: 'success',
    card: {
      kind: 'settle',
      label: '정착 관리 중',
      value: 'D+32일',
      progress: 14 / 318,
      rows: [
        { label: '지금 해야 할 일', value: '보증료 지원 신청 · D-7' },
        { label: '보증 상태', value: '반환보증 유효 · D-334' },
        { label: '다가오는 일정', value: '계약 갱신 검토 · 2027. 9.' },
      ],
    },
  },
];

const index = ref(0);
const step = computed(() => STEPS[index.value]!);
const isLast = computed(() => index.value === STEPS.length - 1);

function next() {
  if (isLast.value) {
    // 이 화면은 웰컴의 "시작하기" 로 들어오는 로그인 전 소개다. 서비스가 무엇을 하는지
    // 보여줬으면 다음은 로그인이다. 계정이 없는 사람은 로그인 화면의 회원가입으로 간다.
    navigateTo('/login');
    return;
  }
  index.value += 1;
}

/** 첫 단계에서 뒤로 가면 온보딩을 벗어난다. */
function back() {
  if (index.value === 0) {
    navigateTo('/welcome');
    return;
  }
  index.value -= 1;
}
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />

    <header class="h-topbar px-gutter flex shrink-0 items-center">
      <button type="button" class="text-ink -ml-1 p-1" aria-label="뒤로" @click="back">
        <AppIcon name="chevron-left" class="size-icon" />
      </button>
    </header>

    <div class="px-gutter flex flex-1 flex-col gap-6 pt-2 pb-6">
      <StepIndicator :current="step.base" />

      <div class="flex flex-col gap-3 pt-2">
        <h1 class="text-title2 text-ink whitespace-pre-line">{{ step.title }}</h1>
        <p class="text-body2 text-ink-body">{{ step.description }}</p>
      </div>

      <MatchCard
        v-if="step.card.kind === 'match'"
        :badge="step.card.badge"
        :rows="step.card.rows"
      />
      <TaskCard
        v-else-if="step.card.kind === 'task'"
        :label="step.card.label"
        :value="step.card.value"
        :progress="step.card.progress"
        :tasks="step.card.tasks"
      />
      <SettleCard
        v-else
        :label="step.card.label"
        :value="step.card.value"
        :progress="step.card.progress"
        :rows="step.card.rows"
      />
    </div>

    <footer class="px-gutter flex shrink-0 flex-col gap-2.5 pb-cta-pad">
      <NoteCard :tone="step.noteTone">{{ step.note }}</NoteCard>
      <AppButton @click="next">{{ isLast ? '시작하기' : '다음' }}</AppButton>
    </footer>
  </PhoneFrame>
</template>
