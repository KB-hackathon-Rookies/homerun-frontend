<script setup lang="ts">
import { useConsultationApi, type Consultation } from '~/api/consultation';
import { usePlanApi } from '~/api/plan';
import { usePropertyApi, type PropertyCandidate } from '~/api/property';
import { useSecondBaseApi } from '~/api/secondBase';
import {
  collateralLabel,
  isFinalTerms,
  missingFinalTerms,
  productLabel,
} from '~/components/property/consultation';
import { messageFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';
import { COACH_TIME } from '~/components/property/coachSheets';
import { SECOND_BASE_STEPS } from '~/components/property/steps';

/**
 * 2루-7 최종 확정.
 *
 * 여기 적힌 값은 전부 **은행에서 들은 말**이지 판정 결과가 아니다. 앞 화면의
 * 예상 한도와 다를 수 있고, 다르면 이쪽이 맞다 — 실제로 심사할 곳이 은행이다.
 *
 * "가능" 을 들었더라도 상품·담보·승인한도·금리를 다 듣고 온 상담이라야 2루를
 * 닫을 수 있다. 완료된 상담 후보를 모두 모아, 사용자가 계약할 조합 하나를 고른다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

const consultations = ref<Consultation[]>([]);
type FinalCandidate = { property: PropertyCandidate; consultation: Consultation };
const finalCandidates = ref<FinalCandidate[]>([]);
const selectedConsultationId = ref<number | null>(null);

/**
 * 상담까지 끝낸(🔵 상담 완료) 매물 수. 배지 문구("매물 N개 확정!")가 이 값을 그대로 쓴다.
 *
 * 이 계획에 걸린 매물이 이 하나만은 아닐 수 있다 — 여러 매물이 상담까지 끝났으면
 * 부동산에 다 들고 간다. 숫자를 하드코딩하면 매물이 하나뿐이거나 셋이어도 항상
 * "2개" 로 보인다.
 */
const settledCount = ref(0);
const pending = ref(true);
const error = ref('');
const saving = ref(false);
/** 저장 실패는 따로 담는다. `error` 에 넣으면 확정 카드가 사라져 무엇을 확정하려던 건지 안 보인다. */
const saveError = ref('');

/**
 * 2루를 닫을 수 있는 사용자가 고른 상담 후보.
 */
const selectedCandidate = computed(
  () =>
    finalCandidates.value.find(
      (candidate) => candidate.consultation.consultationId === selectedConsultationId.value,
    ) ?? null,
);
const settled = computed(() => selectedCandidate.value?.consultation ?? null);

/** "가능" 은 들었는데 조건이 덜 찬 상담들. 무엇이 비었는지 이걸로 짚어준다. */
const incomplete = computed(() =>
  consultations.value.filter((item) => item.resultStatus === 'POSSIBLE' && !isFinalTerms(item)),
);

const blockedNotes = computed(() =>
  incomplete.value.map(
    (item) => `${item.bankName} — ${missingFinalTerms(item).join(' · ')} 미확인`,
  ),
);

const rows = computed(() => {
  const candidate = selectedCandidate.value;
  if (!candidate) return [];
  const { consultation: item, property } = candidate;

  return [
    { label: '매물', value: property.roadAddress },
    { label: '상품', value: productLabel(item.loanProduct) },
    {
      label: '은행',
      value: item.branchName ? `${item.bankName} ${item.branchName}` : item.bankName,
    },
    { label: '담보', value: collateralLabel(item.collateralMethod) },
    {
      label: '한도',
      value: item.approvedLimit === null ? '못 들음' : formatKoreanMoney(item.approvedLimit),
      strong: item.approvedLimit !== null,
    },
    {
      label: '금리',
      value: item.quotedRate === null ? '못 들음' : `연 ${item.quotedRate}%`,
      strong: item.quotedRate !== null,
    },
    { label: '기한', value: '잔금일 1개월 전까지 신청' },
  ];
});

/**
 * 2루 안착 축하. 시안 `2루 15 · 안착 (딤 · 축하)` 이다.
 *
 * 서버가 완료를 받아준 **뒤에** 뜬다. 저장하기 전에 띄우면 실패했는데 축하를
 * 본 꼴이 된다. 여기서 3루가 시작되는 걸 알려주지 않으면 화면이 소리 없이
 * 바뀌어, 2루를 끝냈다는 것도 모르고 넘어간다.
 */
const arrived = ref(false);

/**
 * 확정을 서버에 남기고 3루로 넘어간다.
 *
 * 화면에 "확정된 조건" 을 그려 놓고 넘어가기만 하면, 3루가 계약 초안을
 * 만들 때 확정을 찾지 못해 거기서 막힌다. 실패하면 넘어가지 않는다 —
 * 넘어간 뒤에 막히면 어디서 잘못됐는지 알 수 없다.
 */
async function proceed() {
  const candidate = selectedCandidate.value;
  if (!candidate || saving.value) return;

  saving.value = true;
  saveError.value = '';
  try {
    const decision = await usePropertyApi().decide(
      planId,
      candidate.property.propertyId,
      candidate.consultation.consultationId,
    );

    /*
     * 확정을 저장하는 것만으로는 계획이 2루에 남는다. 2루 최종 제출을 불러 서버가
     * 최종 조건을 확인하고 계획을 3루로 넘기게 한다. 서버가 완료를 승인한 뒤에만
     * 3루로 넘어간다.
     */
    const plan = await usePlanApi().get(planId);
    if (!plan.ruleVersion) throw new Error('계획 규칙 버전을 확인할 수 없어요.');
    await useSecondBaseApi().complete(planId, decision.decisionRevision, plan.ruleVersion);

    // 서버가 완료를 받아준 뒤에만 축하한다. 축하를 닫으면 3루로 넘어간다.
    arrived.value = true;
  } catch (cause) {
    saveError.value = messageFrom(cause, '확정을 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  const consultationApi = useConsultationApi();
  try {
    const [currentConsultations, properties] = await Promise.all([
      consultationApi.list(planId, propertyId),
      usePropertyApi().candidates(planId),
    ]);
    consultations.value = currentConsultations;
    settledCount.value = properties.filter((item) => item.trafficLight === 'BLUE').length;

    const groups = await Promise.all(
      properties.map(async (property) => {
        try {
          return {
            property,
            consultations: await consultationApi.list(planId, property.propertyId),
          };
        } catch {
          // 다른 매물의 상담 기록을 못 읽어도 현재 매물의 확정은 막지 않는다.
          return { property, consultations: [] as Consultation[] };
        }
      }),
    );
    finalCandidates.value = groups.flatMap(({ property, consultations }) =>
      consultations.filter(isFinalTerms).map((consultation) => ({ property, consultation })),
    );

    const currentPropertyCandidate = finalCandidates.value.find(
      (candidate) => candidate.property.propertyId === propertyId,
    );
    selectedConsultationId.value =
      currentPropertyCandidate?.consultation.consultationId ??
      finalCandidates.value[0]?.consultation.consultationId ??
      null;
  } catch (cause) {
    error.value = messageFrom(cause, '상담 기록을 불러오지 못했어요.');
  } finally {
    pending.value = false;
  }
});

/** ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="[COACH_TIME.depositOrder]"
    brand
    base="2루"
    @back="navigateTo(`/property/${planId}/${propertyId}/consultations`)"
  >
    <div class="bg-canvas-soft flex min-h-full flex-col gap-4 px-4 pt-4 pb-6">
      <SubStep :steps="SECOND_BASE_STEPS" :current="4" />

      <h1 class="text-question text-ink-card">부동산에 들고 갈 매물</h1>

      <div v-if="settled" class="bg-surface-info rounded-field flex flex-col gap-1 p-4">
        <p class="text-body3 text-primary-strong font-bold">🔵 매물 {{ settledCount }}개 확정!</p>
        <p class="text-label2 text-ink-hero-body">
          상담 카드까지 끝난 매물만 모았어. 이 리스트 들고 부동산 가자. 계약할 집을 정하면 3루
          일정을 만들어줄게
        </p>
      </div>

      <p v-if="pending" class="text-label2 text-ink-muted">상담 기록을 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <!--
        조건이 덜 찬 상담밖에 없을 때. 예전에는 이걸 그대로 확정으로 보내서 3루
        문턱에서 409 로 막혔다 — 확정은 이미 기록됐는데 계획은 2루에 갇혔다.
        이제 넘어가기 전에 무엇이 비었는지 여기서 말해준다.
      -->
      <AppCard v-else-if="incomplete.length" class="flex flex-col gap-3 p-5">
        <h2 class="text-body3 text-ink-hero font-bold">아직 확정할 수 없어요</h2>
        <p class="text-label2 text-ink-hero-body">
          2루를 닫으려면 한 은행에서 <strong>상품 · 담보 · 승인한도 · 금리</strong> 를 모두 듣고
          와야 해요. "가능" 은 들었지만 아래 항목을 아직 못 들은 상담뿐이에요
        </p>

        <ul class="flex flex-col gap-1.5">
          <li
            v-for="note in blockedNotes"
            :key="note"
            class="bg-surface-brand rounded-chip text-caption2 text-ink-hero-body p-3"
          >
            {{ note }}
          </li>
        </ul>

        <p class="text-caption2 text-ink-muted">
          은행에 다시 물어본 뒤 상담 결과를 새로 남기면 이 화면에서 확정할 수 있어요
        </p>
      </AppCard>

      <p v-else-if="!settled" class="text-label2 text-ink-muted">
        아직 "가능" 을 들은 은행이 없어요. 상담 결과를 먼저 입력해주세요.
      </p>

      <AppCard v-else class="flex flex-col gap-3 p-5">
        <div v-if="finalCandidates.length > 1" class="flex flex-col gap-2.5">
          <div>
            <h2 class="text-body3 text-ink-hero font-bold">상담 완료 후보</h2>
            <p class="text-caption2 text-ink-muted mt-1">
              계약할 매물과 은행 조건 하나를 골라주세요
            </p>
          </div>

          <button
            v-for="candidate in finalCandidates"
            :key="candidate.consultation.consultationId"
            type="button"
            class="border-line rounded-field flex flex-col gap-1 border p-3 text-left"
            :class="
              candidate.consultation.consultationId === selectedConsultationId
                ? 'border-primary-strong bg-surface-info'
                : 'bg-surface'
            "
            :aria-pressed="candidate.consultation.consultationId === selectedConsultationId"
            @click="selectedConsultationId = candidate.consultation.consultationId"
          >
            <div class="flex items-center gap-2">
              <span class="text-label2 text-ink-hero flex-1 font-bold">
                {{ candidate.property.roadAddress }}
              </span>
              <AppBadge
                :tone="
                  candidate.consultation.consultationId === selectedConsultationId
                    ? 'informative'
                    : 'positive'
                "
              >
                {{
                  candidate.consultation.consultationId === selectedConsultationId
                    ? '선택됨'
                    : '선택'
                }}
              </AppBadge>
            </div>
            <p class="text-caption2 text-ink-hero-body">
              {{ candidate.consultation.bankName }} ·
              {{ productLabel(candidate.consultation.loanProduct) }} · 연
              {{ candidate.consultation.quotedRate }}%
            </p>
          </button>
        </div>

        <div v-if="finalCandidates.length > 1" class="bg-line h-px" />

        <h2 class="text-body3 text-ink-hero font-bold">확정할 조건</h2>

        <div v-for="row in rows" :key="row.label" class="flex items-center py-1">
          <span class="text-label2 text-ink-hero-body w-24 shrink-0">{{ row.label }}</span>
          <span
            class="text-body3 flex-1 font-bold"
            :class="row.strong ? 'text-primary-strong' : 'text-ink-hero'"
          >
            {{ row.value }}
          </span>
        </div>
      </AppCard>

      <p class="bg-surface-brand rounded-chip text-caption2 text-ink-hero-body p-3">
        서류를 다 낸 후에도 조건이 달라질 수 있어요. 계약서 특약을 꼭 확인하세요
      </p>
    </div>

    <template #footer>
      <StepFooter
        :disabled="pending || saving || !settled"
        @back="navigateTo(`/property/${planId}/${propertyId}/consultations`)"
        @next="proceed"
      >
        <template #notice>
          <p v-if="saveError" class="text-label2 text-danger">{{ saveError }}</p>

          <!-- 막혔으면 되돌아갈 곳을 준다. 비활성 버튼만 두면 여기서 끝나 버린다. -->
          <AppButton
            v-if="!pending && !error && !settled"
            variant="white"
            @click="navigateTo(`/property/${planId}/${propertyId}/consult-banks`)"
          >
            상담 결과 다시 입력하기
          </AppButton>
        </template>

        부동산 가기
      </StepFooter>
    </template>

    <!--
      2루 안착. 시안(`687:16198`)에는 버튼이 없고 "화면을 터치하면 계속돼" 다 —
      닫는 동작이 곧 3루로 가는 동작이라 여기서 넘긴다.
    -->
    <DimOverlay v-if="arrived" placement="center" @close="navigateTo(`/contract/${planId}/visit`)">
      <img
        src="/tiger/flag-plain.png"
        alt=""
        width="150"
        height="132"
        class="w-celebrate-art h-auto"
      />
      <p class="text-heading text-primary-strong">2루 안착!</p>
      <h2 class="text-body-strong text-ink-strong">이 리스트 들고 부동산 가자</h2>
      <p class="text-note-body text-ink-card-body text-center">
        매물 진단부터 은행 사전상담까지 끝났어. 부동산에서 집을 정하면 3루가 시작돼
      </p>
      <p class="bg-surface-info rounded-pill text-caption2 text-primary-strong px-3.5 py-2">
        ⚾ 다음은 3루 · 실행
      </p>
      <!-- 시안은 버튼 없이 "화면을 터치하면 계속돼" 다. 닫으면 확정 화면이 그대로 남는다. -->
      <p class="text-micro text-ink-muted pt-1">화면을 터치하면 계속돼</p>
    </DimOverlay>
  </StageShell>
</template>
