<script setup lang="ts">
import type { DiagnosisStep, DiagnosisStepPatch, PlanInput } from '~/api/plan';
import { usePlanApi } from '~/api/plan';
import type { CoachSheet } from '~/components/coach/sheet';
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
const { revision, saveStep } = useInputRevision(planId);
const pending = ref(false);
const error = ref('');

/** STEP 이름으로 질문 위치를 찾는다. 이 화면에 없으면(재무 이후) -1. */
const stepIndex = (step: string | null) => QUESTIONS.findIndex((q) => q.step === step);

const question = computed(() => QUESTIONS[index.value]!);
const answer = computed({
  get: () => answers.value[question.value.step] ?? null,
  set: (value: string | null) => {
    if (value) answers.value[question.value.step] = value;
  },
});

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

/**
 * 코치 TIME(시안 1루 1·2 모달).
 *
 * 시안은 이 화면을 기본 정보와 회사 정보 두 묶음으로 나누고, 묶음마다 왜 묻는지
 * 알려주는 모달을 따로 둔다. 코드는 한 화면에서 단계를 넘기므로 지금 질문이
 * 어느 묶음인지 보고 고른다.
 *
 * 내용은 시안 문구 그대로다. 지어내지 않는다.
 */
const BASIC_COACH: CoachSheet = {
  title: '기본 정보, 왜 묻는지 알려줄게',
  intro:
    '전세자금대출이 뭐냐면, 전세보증금 일부를 빌려주는 거야. 우선 네가 전세자금대출을 어느 정도 받을 수 있는지 판단해 보려고 해. 세대주·주택 여부, 근로 형태, 쓸 수 있는 보증금을 적어주면 받을 수 있는 대출 안에서 매물 스펙을 뽑아줄게!',
  qa: [
    {
      q: '세대주 여부',
      a: '부모님 집에 살아서 세대주가 아니어도 괜찮아. 예비 세대주로 신청할 수 있어. 대출 실행일부터 1개월 안에 전입신고해서 세대주가 되면 돼',
    },
    {
      q: '무주택 여부',
      a: '지금 함께 사는 가족(부모님 등)의 주택은 상관없어. 독립 후 본인 명의 기준이야. 있으면 아직 준비 중인 서비스라 여기서 마무리돼',
    },
    {
      q: '혼인 여부',
      a: '지금은 미혼 경로만 열려 있어. 기혼이면 준비 중 안내로 마무리돼',
    },
  ],
  related: [
    { id: 'safe-contract-333', label: '안심계약 3·3·3 법칙' },
    { id: 'changes-2026', label: '2026년 달라진 것' },
  ],
};

const COMPANY_COACH: CoachSheet = {
  title: '회사 정보, 왜 묻는지 알려줄게',
  intro:
    '고용 형태와 회사 규모, 재직 기간은 대출 조건과 우대금리를 정하는 데 써. 중소기업 정규직이면 청년 버팀목 우대금리 0.3%p를 받을 수 있어',
  qa: [
    {
      q: '재직 1년 미만이면',
      a: '소득이 최근 급여를 12배해서 환산돼. 상여금이 빠져서 실제 연봉보다 적게 잡힐 수 있어',
    },
    {
      q: '서류가 하나 늘어',
      a: '급여통장 사본 또는 거래내역서가 추가로 필요해. 은행 앱에서 바로 발급돼',
    },
    {
      q: '수습 중이어도 돼',
      a: '버팀목은 재직기간 조건이 없어. 다만 1개월 이상 재직해서 온전한 한 달치 소득은 있어야 해',
    },
  ],
  related: [{ id: 'changes-2026', label: '2026년 달라진 것' }],
};

/** 시안이 회사 정보로 묶은 질문들. 나머지는 기본 정보다. */
const COMPANY_STEPS: DiagnosisStep[] = ['EMPLOYMENT_TYPE', 'COMPANY_SIZE', 'EMPLOYMENT_PERIOD'];

const coach = computed(() =>
  COMPANY_STEPS.includes(question.value.step) ? COMPANY_COACH : BASIC_COACH,
);

const coachOpen = ref(false);

/** 저장된 답을 화면 선택지로 되살린다. 값이 없는 항목은 그대로 둔다. */
function restore(input: PlanInput | null) {
  if (!input) return;
  const set = (step: DiagnosisStep, value: string | number | null) => {
    if (value !== null && value !== undefined) answers.value[step] = String(value);
  };
  set('HOUSEHOLDER', input.householderStatus);
  if (input.isHomeless !== null && input.isHomeless !== undefined) {
    answers.value.HOMELESS = input.isHomeless ? 'NONE' : 'OWNED';
  }
  set('MARITAL_STATUS', input.maritalStatus);
  set('EMPLOYMENT_TYPE', input.employmentType);
  set('COMPANY_SIZE', input.companySize);
  set('EMPLOYMENT_PERIOD', input.employmentMonths);
}

/**
 * 이어하기.
 *
 * 서버가 저장된 답·완료 단계·다음 STEP 을 준다. 답을 복원하고 다음 STEP 으로
 * 자리를 맞춘다. 다음 STEP 이 이 화면에 없으면(재무·희망보증금·지역·검토) 바로
 * 다음 화면으로 보낸다 — 새 계획을 만들지 않고 기존 planId 를 그대로 쓴다.
 */
/** 뒤 화면에서 앞 답을 고치러 돌아왔는가. 이어하기와 구분해야 제자리를 돌지 않는다. */
const editing = route.query.edit === '1';

onMounted(async () => {
  try {
    const resumed = await usePlanApi().resume(planId);
    revision.value = resumed.revision;
    restore(resumed.input);

    /*
     * 이어하기면 서버가 정한 자리로 간다. 다음 STEP 이 이 화면에 없으면 다음 화면으로.
     *
     * 다만 뒤 화면에서 **고치러 돌아온 것**이라면(`?edit=1`) 밀어내지 않는다. 그러면
     * 이전을 눌러도 곧장 되돌려 보내져 앞 답을 고칠 수 없다. 그때는 이 화면의 마지막
     * 질문에 세운다 — 방금 지나온 자리가 거기다.
     */
    const target = stepIndex(resumed.resumeStep);
    if (target === -1) {
      if (editing) {
        index.value = QUESTIONS.length - 1;
        return;
      }
      await navigateTo(`/diagnosis/${planId}/finance`, { replace: true });
      return;
    }
    index.value = target;
  } catch {
    // 이어할 게 없거나 조회가 막히면 처음부터. 저장은 서버가 소유자·revision 으로 막는다.
    revision.value = 0;
  }
});

async function next() {
  if (!answer.value || pending.value || blocked.value) return;

  pending.value = true;
  error.value = '';
  try {
    const result = await saveStep(question.value.step, question.value.toPatch(answer.value));

    // 서버가 정한 다음 STEP 을 따른다. 이 화면에 없으면(프리랜서 분기·재무 이후) 다음 화면으로.
    const target = stepIndex(result.nextStep);
    if (target === -1) {
      await navigateTo(`/diagnosis/${planId}/finance`);
      return;
    }
    index.value = target;
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
  <PhoneFrame v-model:coach-open="coachOpen" :coach-sheets="[coach]">
    <StageBar title="사용자 정보 입력" base="1루" @back="back" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 p-4">
      <!-- 코치 팁 전체가 코치 TIME 을 여는 자리다. 오른쪽 아래 코치 FAB 과 같은 시트를 연다. -->
      <button type="button" class="w-full text-left" @click="coachOpen = true">
        <CoachTip label="⚾ 코치 TIME · 눌러서 자세히 보기">{{ coach.title }}</CoachTip>
      </button>

      <QuestionCard :question="question.title">
        <PillGroup v-model="answer" :options="question.choices" />
      </QuestionCard>

      <div v-if="notice" class="bg-surface border-line rounded-field border p-3.5">
        <p class="text-caption2 text-ink-hero-body font-medium">{{ notice }}</p>
      </div>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <!--
      시안(1루 1·2)은 이전·다음을 하단 CTA 줄에 나란히 둔다. 헤더 셰브론만 두면
      엄지가 닿는 자리에 되돌아갈 길이 없다. 첫 질문은 되돌아갈 앞 단계가 이
      화면에 없어서 시안대로 다음만 세운다.
    -->
    <footer class="px-gutter-tight flex shrink-0 gap-2.5 pt-2.5 pb-cta-pad">
      <div v-if="index > 0" class="w-28 shrink-0">
        <AppButton variant="white" :disabled="pending" @click="back">이전</AppButton>
      </div>

      <div class="flex-1">
        <AppButton variant="strong" :disabled="!answer || pending" @click="next">
          {{ pending ? '저장 중…' : '다음' }}
        </AppButton>
      </div>
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
