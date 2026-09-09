<script setup lang="ts">
import { useConsultationApi, type Consultation } from '~/api/consultation';
import { usePlanApi } from '~/api/plan';
import { usePropertyApi } from '~/api/property';
import { useSecondBaseApi } from '~/api/secondBase';
import {
  collateralLabel,
  isFinalTerms,
  missingFinalTerms,
  productLabel,
} from '~/components/property/consultation';
import { useProperty } from '~/composables/useProperty';
import { messageFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';
import { COACH_TIME } from '~/components/property/coachSheets';

/**
 * 2루-7 최종 확정.
 *
 * 여기 적힌 값은 전부 **은행에서 들은 말**이지 판정 결과가 아니다. 앞 화면의
 * 예상 한도와 다를 수 있고, 다르면 이쪽이 맞다 — 실제로 심사할 곳이 은행이다.
 *
 * "가능" 을 들었더라도 상품·담보·승인한도·금리를 다 듣고 온 상담이라야 2루를
 * 닫을 수 있다. 그런 상담이 여럿이면 먼저 들은 것을 쓴다. 은행을 고르는 화면은
 * 아직 없다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

const { property, title } = useProperty(planId, propertyId);

const consultations = ref<Consultation[]>([]);
const pending = ref(true);
const error = ref('');
const saving = ref(false);
/** 저장 실패는 따로 담는다. `error` 에 넣으면 확정 카드가 사라져 무엇을 확정하려던 건지 안 보인다. */
const saveError = ref('');

/**
 * 2루를 닫을 수 있는 첫 상담.
 *
 * "가능" 만 보고 고르면 안 된다 — 서버는 상품·담보·승인한도·금리가 다 있는
 * 상담만 최종 조건으로 받는다. A은행(가능·한도 못 들음)을 먼저, B은행(가능·완전)을
 * 나중에 적은 경우가 실제로 나오는데, 먼저 들은 것만 집으면 살릴 수 있는 상황이
 * 막다른 길이 된다.
 */
const settled = computed(() => consultations.value.find(isFinalTerms) ?? null);

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
  const item = settled.value;
  if (!item) return [];

  return [
    { label: '매물', value: property.value?.roadAddress ?? '—' },
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
  if (!settled.value || saving.value) return;

  saving.value = true;
  saveError.value = '';
  try {
    const decision = await usePropertyApi().decide(
      planId,
      propertyId,
      settled.value.consultationId,
    );

    /*
     * 확정을 저장하는 것만으로는 계획이 2루에 남는다. 2루 최종 제출을 불러 서버가
     * 최종 조건을 확인하고 계획을 3루로 넘기게 한다. 서버가 완료를 승인한 뒤에만
     * 3루로 넘어간다.
     */
    const plan = await usePlanApi().get(planId);
    if (!plan.ruleVersion) throw new Error('계획 규칙 버전을 확인할 수 없어요.');
    await useSecondBaseApi().complete(planId, decision.decisionRevision, plan.ruleVersion);

    // 서버가 완료를 받아준 뒤에만 축하한다. 3루로는 사용자가 눌러서 넘어간다.
    arrived.value = true;
  } catch (cause) {
    saveError.value = messageFrom(cause, '확정을 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    consultations.value = await useConsultationApi().list(planId, propertyId);
  } catch (cause) {
    error.value = messageFrom(cause, '상담 기록을 불러오지 못했어요.');
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <StageShell :coach-sheets="[COACH_TIME.depositOrder]" title="이걸로 진행할게요"
   base="2루"
   @back="navigateTo(`/property/${planId}/${propertyId}/consultations`)">

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 py-4">
      <CoachTip
        >계약금은 대출 신청 전에 내는 거야. 순서가 바뀌면 곤란해지니 지금 확인해두자</CoachTip
      >

      <div v-if="settled" class="bg-surface-info rounded-field flex flex-col gap-1 p-4">
        <p class="text-body3 text-primary-strong font-bold">축하해!</p>
        <p class="text-label2 text-ink-hero-body">
          상담 완료! 확정된 조건으로 3루(계약+대출 실행)를 진행하자
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
        <h2 class="text-body3 text-ink-hero font-bold">확정된 조건</h2>

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

      <p class="text-caption2 text-ink-muted">{{ title }}</p>
    </div>

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

      3루 진행 (부동산 계약)
    </StepFooter>

    <!--
      2루 안착. 닫으면 확정 화면에 그대로 남는다 — 축하를 놓쳤다고 3루로
      못 가는 건 아니어야 한다.
    -->
    <DimOverlay v-if="arrived" @close="arrived = false">
      <div class="flex flex-col items-center gap-2.5 text-center">
        <p class="text-caption1 text-primary-strong">2루 안착!</p>
        <h2 class="text-headline1 text-ink-hero">이 리스트 들고 부동산 가자</h2>
        <p class="text-label2 text-ink-hero-body">
          매물 진단부터 은행 사전상담까지 끝났어. 부동산에서 집을 정하면 3루가 시작돼
        </p>
        <p class="bg-surface-info rounded-pill text-caption2 text-primary-deep px-3.5 py-2">
          ⚾ 다음은 3루 · 실행
        </p>
      </div>

      <AppButton variant="strong" class="mt-5" @click="navigateTo(`/contract/${planId}/visit`)">
        부동산 가기
      </AppButton>
    </DimOverlay>
  </StageShell>
</template>
