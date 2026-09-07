<script setup lang="ts">
import type { DiagnosisStep, DiagnosisStepPatch } from '~/api/plan';
import { useInputRevision } from '~/composables/useInputRevision';
import { messageFrom } from '~/utils/error';

/**
 * 1루 진단 문진.
 *
 * 껍데기가 여섯 다 같다 — 상단 바 · 진행 표시 · 질문 카드 · 안내 · 버튼.
 * 카드 안 선택지만 다르다. 그래서 한 화면에서 단계를 넘긴다.
 *
 * 단계마다 바로 저장한다. 백엔드가 부분 저장을 받고(`.../input/steps/{code}`)
 * 다음 단계와 새 `revision` 을 돌려준다. 그 값을 다음 저장에 그대로 실어야
 * 다른 기기가 먼저 고친 걸 서버가 알아챈다.
 *
 * 시작값은 서버에서 읽어야 한다. `prep` 이 계획을 만들면서 이미 한 번
 * 저장하기 때문에, 0 에서 시작하면 첫 답부터 어긋난다.
 *
 * 플랜 번호는 주소에 있다. 새로고침해도 이어서 할 수 있어야 한다. 남의 플랜을
 * 넣어도 백엔드가 소유자를 확인해서 막는다.
 */
definePageMeta({ middleware: 'auth' });

interface Choice {
  value: string;
  label: string;
  /** 아직 못 도와주는 경로. 고르면 준비 중 안내를 딤으로 띄운다. */
  blocked?: boolean;
}

interface Question {
  step: DiagnosisStep;
  title: string;
  choices: Choice[];
  /** 고르기 전에도 늘 보이는 설명. */
  note?: string;
  /** 고른 값을 요청 본문으로 바꾼다. */
  toPatch: (value: string) => DiagnosisStepPatch;
}

/**
 * 준비 중 경로 안내.
 *
 * 기혼·유주택·무직은 아직 진단 경로가 없다. 시안(1루 7)은 이 셋을 카드 밑
 * 문구가 아니라 딤 안내로 묶어 보여준다 — 고르는 순간 흐름을 멈추고 알린다.
 */
const BLOCKED_NOTICE = {
  title: '아직 준비 중이에요',
  body: '지금은 미혼·무주택·재직 중인 청년의 전세 경로만 도와드릴 수 있어요. 기혼, 유주택, 무직 경로는 곧 열려요',
};

const QUESTIONS: Question[] = [
  {
    step: 'HOUSEHOLDER',
    title: '현재 세대주이신가요?',
    choices: [
      { value: 'CURRENT', label: '네, 세대주입니다' },
      { value: 'EXPECTED', label: '곧 세대주가 될 예정입니다 (예비 세대주)' },
      { value: 'NOT_HOUSEHOLDER', label: '아니요, 세대원입니다' },
    ],
    toPatch: (value) => ({ householderStatus: value as never }),
  },
  {
    step: 'HOMELESS',
    title: '본인 명의로 소유한 주택이 있나요?',
    choices: [
      { value: 'OWNED', label: '있습니다', blocked: true },
      { value: 'NONE', label: '없습니다' },
    ],
    note: '함께 사는 가족(부모님 등)의 주택 소유 여부는 상관없습니다 — 독립 후 본인 명의 기준입니다',
    toPatch: (value) => ({ isHomeless: value === 'NONE' }),
  },
  {
    step: 'MARITAL_STATUS',
    title: '혼인 여부를 알려주세요',
    choices: [
      { value: 'MARRIED', label: '기혼', blocked: true },
      { value: 'SINGLE', label: '미혼' },
    ],
    toPatch: (value) => ({ maritalStatus: value as never }),
  },
  {
    step: 'EMPLOYMENT_TYPE',
    title: '현재 고용 형태를 선택해주세요',
    choices: [
      { value: 'FULL_TIME', label: '정규직' },
      { value: 'CONTRACT', label: '계약직' },
      { value: 'DAILY_WORKER', label: '일용직' },
      { value: 'INTERN', label: '인턴' },
      { value: 'FREELANCER', label: '프리랜서' },
      { value: 'UNEMPLOYED', label: '무직', blocked: true },
    ],
    toPatch: (value) => ({ employmentType: value as never }),
  },
  {
    step: 'COMPANY_SIZE',
    title: '재직 중인 회사 규모를 알려주세요',
    choices: [
      { value: 'LARGE', label: '대기업' },
      { value: 'MID_SIZE', label: '중견기업' },
      { value: 'SMALL', label: '중소기업' },
      { value: 'PUBLIC', label: '공공기관·공기업' },
      { value: 'STARTUP', label: '스타트업' },
      { value: 'OTHER', label: '기타' },
    ],
    toPatch: (value) => ({ companySize: value as never }),
  },
  {
    step: 'EMPLOYMENT_PERIOD',
    title: '현재 회사에서 근무한 기간을 알려주세요',
    choices: [
      { value: '12', label: '1년 이상' },
      { value: '6', label: '1년 미만' },
    ],
    note: '1년 미만 근무 시 소득은 최근 급여×12로 환산되며, 급여통장 사본·거래내역서가 추가로 필요합니다. 대출 한도는 2천만 원입니다',
    toPatch: (value) => ({ employmentMonths: Number(value) }),
  },
];

const route = useRoute();
const planId = Number(route.params.planId);

const index = ref(0);
const answers = ref<Record<string, string>>({});
const { load, saveStep } = useInputRevision(planId);
const pending = ref(false);
const error = ref('');

const question = computed(() => QUESTIONS[index.value]!);
const answer = computed({
  get: () => answers.value[question.value.step] ?? null,
  set: (value: string | null) => {
    if (value) answers.value[question.value.step] = value;
  },
});
const isLast = computed(() => index.value === QUESTIONS.length - 1);

/** 단계마다 늘 보이는 설명. */
const notice = computed(() => question.value.note);

/**
 * 준비 중 경로를 골랐다. 딤 안내를 띄운다.
 *
 * 닫으면 그 답을 지운다 — 실수로 눌렀을 수 있으니 다른 답을 다시 고를 수
 * 있어야 하고, 지우지 않으면 다음 버튼이 막힌 답으로 열려 버린다.
 */
const blocked = computed(() =>
  question.value.choices.find((c) => c.value === answer.value && c.blocked),
);

function dismissBlocked() {
  answers.value[question.value.step] = '';
}

onMounted(load);

async function next() {
  if (!answer.value || pending.value || blocked.value) return;

  pending.value = true;
  error.value = '';
  try {
    await saveStep(question.value.step, question.value.toPatch(answer.value));

    if (isLast.value) {
      await navigateTo(`/diagnosis/${planId}/finance`);
      return;
    }
    index.value += 1;
  } catch (cause) {
    error.value = messageFrom(cause, '저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
}

function back() {
  if (index.value === 0) {
    navigateTo('/prep');
    return;
  }
  index.value -= 1;
}
</script>

<template>
  <PhoneFrame>
    <StageBar title="사용자 정보 입력" base="1루" @back="back" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 p-4">
      <QuestionCard :question="question.title">
        <PillGroup v-model="answer" :options="question.choices" />
      </QuestionCard>

      <div v-if="notice" class="bg-surface border-line rounded-field border p-3.5">
        <p class="text-caption2 text-ink-hero-body font-medium">{{ notice }}</p>
      </div>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton variant="strong" :disabled="!answer || pending" @click="next">
        {{ pending ? '저장 중…' : isLast ? '스펙 확인하러 가기' : '다음' }}
      </AppButton>
    </footer>

    <!--
      준비 중 경로 안내(1루 7). 기혼·유주택·무직을 고르면 흐름을 멈추고 딤으로
      알린다. 바깥이나 처음으로 돌아가기로 닫는다.
    -->
    <DimOverlay v-if="blocked" @close="dismissBlocked">
      <div class="flex flex-col items-center gap-3 text-center">
        <h2 class="text-headline1 text-ink-hero">{{ BLOCKED_NOTICE.title }}</h2>
        <p class="text-caption2 text-ink-hero-body">{{ BLOCKED_NOTICE.body }}</p>

        <div class="mt-3 flex w-full flex-col gap-2">
          <!-- 알림 신청을 받아 둘 API 가 아직 없다. 자리는 두되 눌리지 않게 한다. -->
          <AppButton variant="strong" disabled>열리면 알림 받기</AppButton>
          <AppButton variant="white" @click="navigateTo('/')">처음으로 돌아가기</AppButton>
        </div>
      </div>
    </DimOverlay>
  </PhoneFrame>
</template>
