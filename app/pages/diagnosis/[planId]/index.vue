<script setup lang="ts">
import type { DiagnosisStep, DiagnosisStepPatch, PlanInput } from '~/api/plan';
import { usePlanApi } from '~/api/plan';
import type { CoachSheet } from '~/components/coach/sheet';
import { useInputRevision } from '~/composables/useInputRevision';
import { useAuthStore } from '~/stores/auth';
import { messageFrom } from '~/utils/error';

/**
 * 1루 진단 문진 — 기본 정보 · 회사 정보(시안 1루 1·2).
 *
 * 시안은 여섯 문항을 **두 묶음**으로 묶는다. 예전에는 한 화면에 한 문항씩 여섯
 * 화면이었는데, 세대주·주택·혼인은 서로 붙어 다니는 짧은 질문이라 한 장에서
 * 훑는 편이 빠르다. 서버는 여전히 문항 단위로 저장하므로 다음을 누를 때
 * 그 묶음의 문항을 순서대로 보낸다 — `saveStep` 이 `revision` 을 이어 받는다.
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
  /** 앞 답에 따라 이어지는 문항. 파란 카드로 그리고 조건이 맞을 때만 보인다. */
  follow?: { hint: string; when: () => boolean };
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

const answers = ref<Record<string, string>>({});

/**
 * 회사 정보를 이어 물을 고용 형태.
 *
 * 시안이 카드에 적어 둔 그대로다 — "정규직·계약직·일용직·인턴을 고르면 이어져요".
 * 프리랜서는 소속 회사가 없어서 규모·재직기간을 물을 수 없고, 무직은 아예 준비 중
 * 경로다. 둘 다 여기서 빠진다.
 */
const COMPANY_TYPES = ['FULL_TIME', 'CONTRACT', 'DAILY_WORKER', 'INTERN'];
const employed = () => COMPANY_TYPES.includes(answers.value.EMPLOYMENT_TYPE ?? '');

const QUESTIONS: Question[] = [
  {
    step: 'HOUSEHOLDER',
    title: '지금 세대주이신가요?',
    choices: [
      { value: 'CURRENT', label: '세대주예요' },
      { value: 'EXPECTED', label: '곧 세대주가 될 예정이에요 (예비세대주)' },
      { value: 'NOT_HOUSEHOLDER', label: '아니요, 세대원이에요' },
    ],
    toPatch: (value) => ({ householderStatus: value as never }),
  },
  {
    step: 'HOMELESS',
    title: '본인 명의로 소유한 주택이 있나요?',
    choices: [
      { value: 'NONE', label: '없어요' },
      { value: 'OWNED', label: '있어요', blocked: true },
    ],
    toPatch: (value) => ({ isHomeless: value === 'NONE' }),
  },
  {
    step: 'MARITAL_STATUS',
    title: '혼인하셨나요?',
    choices: [
      { value: 'SINGLE', label: '미혼' },
      { value: 'MARRIED', label: '기혼', blocked: true },
    ],
    toPatch: (value) => ({ maritalStatus: value as never }),
  },
  {
    step: 'EMPLOYMENT_TYPE',
    title: '지금 하시는 일의 고용 형태를 알려주세요',
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
    title: '재직 중인 회사의 규모를 알려주세요',
    choices: [
      { value: 'LARGE', label: '대기업' },
      { value: 'MID_SIZE', label: '중견기업' },
      { value: 'SMALL', label: '중소기업' },
      { value: 'PUBLIC', label: '공공기관·공기업' },
      { value: 'STARTUP', label: '스타트업' },
      { value: 'OTHER', label: '기타' },
    ],
    follow: { hint: '정규직·계약직·일용직·인턴을 고르면 이어져요', when: employed },
    toPatch: (value) => ({ companySize: value as never }),
  },
  {
    step: 'EMPLOYMENT_PERIOD',
    title: '지금 회사에서 재직한 기간이 얼마나 되셨나요?',
    choices: [
      { value: '12', label: '1년 이상' },
      { value: '6', label: '1년 미만' },
    ],
    follow: {
      hint: '회사 규모 다음에 이어져요',
      when: () => employed() && !!answers.value.COMPANY_SIZE,
    },
    toPatch: (value) => ({ employmentMonths: Number(value) }),
  },
];

/** 시안이 나눈 두 묶음. 문항 순서는 서버가 기대하는 STEP 순서 그대로다. */
const GROUPS = [
  {
    label: '기본 정보',
    overline: '1루 · 기본 정보',
    title: '기본 정보를 알려주세요',
    steps: ['HOUSEHOLDER', 'HOMELESS', 'MARITAL_STATUS'] as DiagnosisStep[],
  },
  {
    label: '회사 정보',
    overline: '1루 · 회사 정보',
    title: '회사 정보를 알려주세요',
    steps: ['EMPLOYMENT_TYPE', 'COMPANY_SIZE', 'EMPLOYMENT_PERIOD'] as DiagnosisStep[],
  },
] as const;

/** 진행 표시. 뒤 두 칸은 이 화면이 아니라 다음 화면들이 채운다. */
const SUB_STEPS = ['기본 정보', '회사 정보', '추가 정보', '예상 진단'];

const route = useRoute();
const planId = Number(route.params.planId);

const group = ref(0);
const { revision, saveStep } = useInputRevision(planId);
const pending = ref(false);
const error = ref('');

const current = computed(() => GROUPS[group.value]!);

/** 이 묶음에서 지금 보이는 문항. 이어지는 문항은 조건이 맞아야 낀다. */
const visible = computed(() =>
  QUESTIONS.filter((q) => current.value.steps.includes(q.step) && (!q.follow || q.follow.when())),
);

/** 답을 고른다. 알약은 되돌리기(선택 해제)가 없어서 빈 값은 오지 않는다. */
function choose(step: DiagnosisStep, value: string | null) {
  if (value) answers.value[step] = value;
}

/**
 * 준비 중 경로를 골랐다. 딤 안내를 띄운다.
 *
 * 닫으면 그 답을 지운다 — 실수로 눌렀을 수 있으니 다른 답을 다시 고를 수
 * 있어야 하고, 지우지 않으면 다음 버튼이 막힌 답으로 열려 버린다.
 */
const blocked = computed(() => {
  for (const q of visible.value) {
    const hit = q.choices.find((c) => c.value === answers.value[q.step] && c.blocked);
    if (hit) return { step: q.step, choice: hit };
  }
  return null;
});

function dismissBlocked() {
  if (blocked.value) answers.value[blocked.value.step] = '';
}

/** 보이는 문항이 다 채워져야 넘어간다. */
const canProceed = computed(() => visible.value.every((q) => !!answers.value[q.step]));

/**
 * 코치 TIME(시안 1루 1·2 모달).
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

const coach = computed(() => (group.value === 0 ? BASIC_COACH : COMPANY_COACH));
const coachOpen = ref(false);

/**
 * 회원정보에서 가져온 값(시안 1루 1).
 *
 * 가입 때 받은 것만 보여준다. 서버가 값을 안 주면 그 조각을 뺀다 — 자리를 비워
 * 두면 빈 구분자만 남는다.
 */
const auth = useAuthStore();
const prefill = ref<{ birthDate: string | null; militaryMonths: number | null }>({
  birthDate: null,
  militaryMonths: null,
});

/** 생일이 지났는지까지 보고 센다. 만 나이는 생일 전후로 한 살 다르다. */
function ageFrom(birthDate: string) {
  const born = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const before =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (before) age -= 1;
  return age;
}

const memberFacts = computed(() => {
  const facts: string[] = [];
  if (auth.user?.name) facts.push(auth.user.name);
  const { birthDate, militaryMonths } = prefill.value;
  if (birthDate) facts.push(`${birthDate.replaceAll('-', '.')} (만 ${ageFrom(birthDate)}세)`);
  // 시안은 병역을 일 수로 적었지만 서버가 주는 것은 개월이다. 없는 정밀도를 지어내지 않는다.
  if (militaryMonths) facts.push(`병역 ${militaryMonths}개월`);
  return facts;
});

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

/** 서버가 준 다음 STEP 이 든 묶음. 이 화면에 없으면 -1. */
const groupOf = (step: string | null) =>
  GROUPS.findIndex((g) => (g.steps as readonly string[]).includes(step ?? ''));

/**
 * 이어하기.
 *
 * 서버가 저장된 답·다음 STEP 을 준다. 답을 복원하고 그 STEP 이 든 묶음으로
 * 자리를 맞춘다. 다음 STEP 이 이 화면에 없으면(재무·희망보증금·지역·검토) 바로
 * 다음 화면으로 보낸다 — 새 계획을 만들지 않고 기존 planId 를 그대로 쓴다.
 */
/** 뒤 화면에서 앞 답을 고치러 돌아왔는가. 이어하기와 구분해야 제자리를 돌지 않는다. */
const editing = route.query.edit === '1';

onMounted(async () => {
  const api = usePlanApi();

  try {
    const resumed = await api.resume(planId);
    revision.value = resumed.revision;
    restore(resumed.input);

    /*
     * 이어하기면 서버가 정한 자리로 간다. 다음 STEP 이 이 화면에 없으면 다음 화면으로.
     *
     * 다만 뒤 화면에서 **고치러 돌아온 것**이라면(`?edit=1`) 밀어내지 않는다. 그러면
     * 이전을 눌러도 곧장 되돌려 보내져 앞 답을 고칠 수 없다. 그때는 이 화면의 마지막
     * 묶음에 세운다 — 방금 지나온 자리가 거기다.
     */
    const target = groupOf(resumed.resumeStep);
    if (target === -1) {
      if (editing) {
        group.value = GROUPS.length - 1;
        return;
      }
      await navigateTo(`/diagnosis/${planId}/finance`, { replace: true });
      return;
    }
    group.value = target;
  } catch {
    // 이어할 게 없거나 조회가 막히면 처음부터. 저장은 서버가 소유자·revision 으로 막는다.
    revision.value = 0;
  }

  try {
    const profile = await api.profilePrefill(planId);
    prefill.value = {
      birthDate: profile.birthDate.value,
      militaryMonths: profile.militaryMonths.value,
    };
  } catch {
    // 프로필을 못 읽어도 문진은 진행한다. 카드만 안 보인다.
  }
});

/**
 * 이 묶음의 답을 순서대로 저장한다.
 *
 * 서버는 문항 하나씩 받는다. 한 번에 묶어 보내는 길이 없으므로 순서대로 부르고,
 * 마지막이 알려준 다음 STEP 으로 자리를 옮긴다. 중간에서 실패하면 거기까지는
 * 저장된 채로 멈춘다 — 다시 누르면 같은 값을 다시 보내므로 덧나지 않는다.
 */
async function next() {
  if (!canProceed.value || pending.value || blocked.value) return;

  pending.value = true;
  error.value = '';
  try {
    let nextStep: string | null = null;
    for (const q of visible.value) {
      const result = await saveStep(q.step, q.toPatch(answers.value[q.step]!));
      nextStep = result.nextStep;
    }

    const target = groupOf(nextStep);
    if (target === -1 || target === group.value) {
      await navigateTo(`/diagnosis/${planId}/finance`);
      return;
    }
    group.value = target;
  } catch (cause) {
    error.value = messageFrom(cause, '저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
}

function back() {
  if (group.value === 0) {
    navigateTo('/prep');
    return;
  }
  group.value -= 1;
}
</script>

<template>
  <StageShell v-model:coach-open="coachOpen" :coach-sheets="[coach]" brand base="1루">
    <div class="bg-canvas-soft flex min-h-full flex-col gap-2.5 px-4 pt-4 pb-6">
      <SubStep :steps="SUB_STEPS" :current="group" />

      <p class="text-caption1 text-ink-label font-medium">{{ current.overline }}</p>
      <h1 class="text-question text-ink-card">{{ current.title }}</h1>

      <MemberFactCard v-if="group === 0 && memberFacts.length" :facts="memberFacts" />

      <QuestionBlock
        v-for="q in visible"
        :key="q.step"
        :question="q.title"
        :follow="!!q.follow"
        :hint="q.follow?.hint"
      >
        <PillGroup
          :model-value="answers[q.step] ?? null"
          :options="q.choices"
          variant="small"
          @update:model-value="(value: string | null) => choose(q.step, value)"
        />
      </QuestionBlock>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <!--
      시안(1루 1·2)은 이전·다음을 하단 CTA 줄에 나란히 둔다. 상단 바에 뒤로가기가
      없어서 엄지가 닿는 자리에 되돌아갈 길이 여기뿐이다. 첫 묶음은 시안대로
      다음만 세운다.
    -->
    <template #footer>
      <footer class="px-gutter-tight border-line pt-2.5 pb-cta-pad flex shrink-0 gap-2.5 border-t">
        <div v-if="group > 0" class="w-29 shrink-0">
          <AppButton variant="white" :disabled="pending" @click="back">이전</AppButton>
        </div>

        <AppButton variant="strong" :disabled="!canProceed || pending" @click="next">
          {{ pending ? '저장 중…' : '다음' }}
        </AppButton>
      </footer>
    </template>

    <!--
      준비 중 경로 안내(1루 7). 기혼·유주택·무직을 고르면 흐름을 멈추고 딤으로
      알린다. 바깥이나 처음으로 돌아가기로 닫는다.
    -->
    <DimOverlay v-if="blocked" placement="center" @close="dismissBlocked">
      <!--
        시안은 여기를 "처음으로 돌아가기" 로 두었지만 그러면 지금까지 채운 답이
        통째로 날아간다. 막힌 건 이 문항 하나뿐이라, 그 답만 지우고 이어서 고르게 한다.
      -->
      <PreparingNotice
        :title="BLOCKED_NOTICE.title"
        :body="BLOCKED_NOTICE.body"
        link-label="다른 답으로 고를게요"
        @link="dismissBlocked"
      />
    </DimOverlay>
  </StageShell>
</template>
