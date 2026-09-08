<script setup lang="ts">
import { usePropertyApi, type OfficialPriceSource, type RegistryStepPatch } from '~/api/property';
import { useProperty } from '~/composables/useProperty';
import { messageFrom } from '~/utils/error';
import { propertyStepRoute } from '~/utils/propertyStep';
import { COACH_TIME } from '~/components/property/coachSheets';

/**
 * 2루-3 등기부 체크리스트 (STEP 4).
 *
 * 등기부를 보고 온 값을 받는다. 답이 셋인 이유가 있다 — **"모르겠어요" 를
 * 그대로 저장해야** 한다. 안 본 것을 "없어요" 로 채우면 백엔드가 확인된
 * 사실로 받아 신호등을 초록으로 올린다. 모르면 노랑에 머물러야 맞다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

/** 알약 값 ↔ 사실값. `UNKNOWN` 이 `null` 이다. */
type Answer = 'YES' | 'NO' | 'UNKNOWN';
const toFact = (answer: Answer | null) =>
  answer === null || answer === 'UNKNOWN' ? null : answer === 'YES';

interface Question {
  key: string;
  title: string;
  /** `YES` 에 붙는 말. 질문마다 "있어요 / 같아요" 로 다르다. */
  yes: string;
  no: string;
}

/**
 * 시안은 압류·가압류·가처분·경매를 한 줄로 묻는데 백엔드는 둘로 나눠 받는다.
 * 한 답을 두 칸에 나눠 적으면 보지 않은 것을 봤다고 기록하게 되어 질문을 쪼갰다.
 */
const QUESTIONS: Question[] = [
  { key: 'ownerMatches', title: '소유자가 계약 상대와 같나요', yes: '같아요', no: '달라요' },
  { key: 'trustRegistered', title: '신탁등기가 있나요', yes: '있어요', no: '없어요' },
  { key: 'leaseholdRegistered', title: '임차권등기가 있나요', yes: '있어요', no: '없어요' },
  {
    key: 'seizureOrDispositionRestricted',
    title: '압류·가압류·가처분이 있나요',
    yes: '있어요',
    no: '없어요',
  },
  { key: 'auctionInProgress', title: '경매가 진행 중인가요', yes: '있어요', no: '없어요' },
];

const optionsOf = (question: Question) => [
  { value: 'NO', label: question.no },
  { value: 'YES', label: question.yes },
  { value: 'UNKNOWN', label: '모르겠어요' },
];

const answers = ref<Record<string, Answer | null>>({});
const seniorDebt = ref('');
const officialPrice = ref('');

const { property } = useProperty(planId, propertyId);
const revision = ref(0);
const pending = ref(true);
const saving = ref(false);
const error = ref('');

/**
 * 검사한 뒤에 만 원을 원으로 바꾼다. 두 값 다 비워 두는 것(모름)은 허용한다.
 *
 * 전에는 숫자가 아닌 글자를 지워서 값을 만들었다. 채권최고액에 `abc` 를 치면 0원이 되어
 * "확인했더니 근저당이 없다" 가 됐다. 매물 위험 판정의 근거라서 그대로 두면 안 된다.
 */
const parsedSeniorDebt = computed(() => parseManwon(seniorDebt.value));
const parsedOfficialPrice = computed(() => parseManwon(officialPrice.value));

/**
 * 공시가격을 어디서 보는지는 주택 유형이 정한다 — 빌라·아파트·연립은
 * 부동산공시가격 알리미, 오피스텔은 홈택스 기준시가다. 사용자에게 다시
 * 묻지 않고 등록할 때 확인된 유형에서 끌어온다.
 */
const priceSource = computed<OfficialPriceSource>(() => {
  const houseType = property.value?.houseType;
  if (houseType === 'OFFICETEL') return 'HOMETAX_STANDARD_VALUE';
  if (houseType === 'DETACHED' || houseType === 'MULTI_FAMILY') return 'REALTY_PRICE_DETACHED';
  return 'REALTY_PRICE_APARTMENT';
});

/** 모든 질문에 답해야 넘어간다. "모르겠어요" 도 답이다. */
const answered = computed(() => QUESTIONS.every((question) => answers.value[question.key]));

onMounted(async () => {
  try {
    const workflow = await usePropertyApi().resume(planId, propertyId);
    // STEP 4 는 워크플로가 REGISTRY 일 때만 저장된다. 아직 앞 STEP 이면(또는 이미 끝났으면)
    // 지금 단계 화면으로 돌려보내 막다른 저장을 막는다.
    if (workflow.currentStep !== 'REGISTRY') {
      await navigateTo(propertyStepRoute(planId, propertyId, workflow.currentStep), {
        replace: true,
      });
      return;
    }
    revision.value = workflow.revision;
  } catch (cause) {
    error.value = messageFrom(cause, '진행 상태를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
});

async function save() {
  if (!answered.value || saving.value) return;

  const price = parsedOfficialPrice.value.value;
  const patch: RegistryStepPatch = {
    ownerMatches: toFact(answers.value.ownerMatches ?? null),
    trustRegistered: toFact(answers.value.trustRegistered ?? null),
    leaseholdRegistered: toFact(answers.value.leaseholdRegistered ?? null),
    seizureOrDispositionRestricted: toFact(answers.value.seizureOrDispositionRestricted ?? null),
    auctionInProgress: toFact(answers.value.auctionInProgress ?? null),
    seniorDebt: parsedSeniorDebt.value.value,
    // 금액·기준연도·출처는 셋이 함께 가거나 셋 다 비어야 한다.
    officialPrice: price,
    officialPriceYear: price === null ? null : new Date().getFullYear(),
    officialPriceSource: price === null ? null : priceSource.value,
  };

  saving.value = true;
  error.value = '';
  try {
    await usePropertyApi().saveRegistry(planId, propertyId, revision.value, patch);
    await navigateTo(`/property/${planId}/${propertyId}/consultations`);
  } catch (cause) {
    error.value = messageFrom(cause, '저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <PhoneFrame :coach-sheets="[COACH_TIME.registryChecklist]">
    <StageBar
      title="등기부 체크리스트"
      base="2루"
      @back="navigateTo(`/property/${planId}/${propertyId}/registry`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 py-4">
      <CoachTip>본 대로 하나씩 답해줘. 모르는 건 모른다고 둬도 판정에 그대로 반영돼</CoachTip>

      <h2 class="text-headline1 text-ink-hero">등기부를 보고 답해주세요</h2>

      <AppCard v-for="question in QUESTIONS" :key="question.key" class="flex flex-col gap-3">
        <p class="text-body3 text-ink-hero font-bold">{{ question.title }}</p>
        <PillGroup v-model="answers[question.key]" :options="optionsOf(question)" />
      </AppCard>

      <AppCard class="flex flex-col gap-3">
        <p class="text-body3 text-ink-hero font-bold">근저당 채권최고액 (만 원)</p>
        <input
          v-model="seniorDebt"
          inputmode="numeric"
          placeholder="금액 입력 — 모르면 비워두세요"
          class="bg-canvas rounded-chip text-body3 text-ink-hero placeholder:text-ink-muted w-full px-3.5 py-3 outline-none"
        />
        <p v-if="parsedSeniorDebt.error" class="text-label2 text-danger">
          {{ parsedSeniorDebt.error }}
        </p>
      </AppCard>

      <AppCard class="flex flex-col gap-3">
        <p class="text-body3 text-ink-hero font-bold">공시가격도 같이 입력해주세요 (만 원)</p>
        <p class="text-caption2 text-ink-muted">반환보증 가입 가능 여부를 판단하는 데 필요해요</p>
        <input
          v-model="officialPrice"
          inputmode="numeric"
          placeholder="공시가격 입력 — 모르면 비워두세요"
          class="bg-canvas rounded-chip text-body3 text-ink-hero placeholder:text-ink-muted w-full px-3.5 py-3 outline-none"
        />
        <p v-if="parsedOfficialPrice.error" class="text-label2 text-danger">
          {{ parsedOfficialPrice.error }}
        </p>
        <p class="text-micro text-ink-muted">
          빌라·아파트·연립: 부동산공시가격 알리미 / 오피스텔: 홈택스 기준시가
        </p>
      </AppCard>

      <AppCard class="flex flex-col gap-3">
        <p class="text-label2 text-ink-hero-body font-bold">
          ⚠️ 반환보증 가입 가능 = 전세보증금 ≤ 공시가격 × 1.26
        </p>
        <p class="text-caption2 text-ink-muted">
          빌라 전세에서 "보증보험 가입 거절"이 나오는 대부분의 이유예요. 대출 승인과 반환보증 가입은
          별개 심사예요
        </p>
      </AppCard>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <StepFooter
      :disabled="
        !answered || !!parsedSeniorDebt.error || !!parsedOfficialPrice.error || pending || saving
      "
      @back="navigateTo(`/property/${planId}/${propertyId}/registry`)"
      @next="save"
    >
      {{ saving ? '저장 중…' : '확인 완료' }}
    </StepFooter>
  </PhoneFrame>
</template>
