<script setup lang="ts">
import { useContractApi, type RegistryComparison, type RegistryFacts } from '~/api/contract';
import { usePlanApi } from '~/api/plan';
import { messageFrom } from '~/utils/error';
import { THIRD_BASE_STEPS } from '~/components/contract/steps';
import { COACH_TIME } from '~/components/contract/coachSheets';

/**
 * 3루 11 · 잔금일.
 *
 * **돈을 보내기 전에 등기부를 한 번 더 뗀다.** 700원이면 되는 일이고,
 * 이걸 안 하면 특약 2번이 무용지물이 된다.
 *
 * 대조는 눈으로 하지 않는다. 오늘 읽은 값을 넣으면 **서버가 계약 때와
 * 비교해 SAFE·NEED_INFO·BLOCK 을 정한다** — 체크박스로 "같다" 를 스스로
 * 확인하는 것과 다르다. **SAFE 일 때만** 잔금 송금 완료로 넘어간다. 미확인
 * (NEED_INFO)을 안전으로 그리지 않는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const TIMELINE = [
  { when: '오전 9시', what: '등기부등본 재발급 → 계약 때와 대조' },
  { when: '오전', what: '은행에서 임대인 계좌로 대출금 송금' },
  { when: '오전', what: '나머지 잔금을 내가 임대인에게 송금' },
  { when: '오전~오후', what: '이사·입주 사진 촬영' },
  { when: '오후', what: '주민센터에서 전입신고 (18시까지)' },
];

// 잔금일에는 계약 때 기록한 일곱 사실을 모두 다시 대조한다. 다른 화면 체크리스트와 같이 저장하지 않고,
// 다 체크해야 다음(대조 요청)이 열린다.
const checkedOwner = ref(false);
const checkedSeniorDebt = ref(false);
const checkedMortgageCount = ref(false);
const checkedSeizure = ref(false);
const checkedLeasehold = ref(false);
const checkedAuction = ref(false);
const checkedTrust = ref(false);

const answered = computed(
  () =>
    checkedOwner.value &&
    checkedSeniorDebt.value &&
    checkedMortgageCount.value &&
    checkedSeizure.value &&
    checkedLeasehold.value &&
    checkedAuction.value &&
    checkedTrust.value,
);

const facts = computed<RegistryFacts>(() => ({
  ownerMatchesContractParty: checkedOwner.value ? true : null,
  seizureOrDispositionRestricted: checkedSeizure.value ? false : null,
  leaseholdRegistered: checkedLeasehold.value ? false : null,
  auctionInProgress: checkedAuction.value ? false : null,
  trustRegistered: checkedTrust.value ? false : null,
  seniorDebt: checkedSeniorDebt.value ? 0 : null,
  mortgageCount: checkedMortgageCount.value ? 0 : null,
}));

const result = ref<RegistryComparison | null>(null);
const saving = ref(false);
const completing = ref(false);
const error = ref('');

const today = () => new Date().toISOString().slice(0, 10);

/** 실제로 낸 날. 오늘이 D-day라 기본값은 오늘이되, 다른 날이면 고칠 수 있다. */
const balancePaidAt = ref(today());
const moveInReportAt = ref(today());
const datesReady = computed(() => !!balancePaidAt.value && !!moveInReportAt.value);

/**
 * 답을 하나라도 고치면 대조 결과를 버린다.
 *
 * 안 그러면 "같아요" 로 통과한 뒤 답을 고쳐도 통과가 남아 잔금을 보낼 수 있다.
 * 이 화면에서 그건 그냥 두면 안 되는 상태다.
 */
watch(
  [
    checkedOwner,
    checkedSeniorDebt,
    checkedMortgageCount,
    checkedSeizure,
    checkedLeasehold,
    checkedAuction,
    checkedTrust,
  ],
  () => {
    result.value = null;
  },
);

const isSafe = computed(() => result.value?.status === 'SAFE');
const isBlock = computed(() => result.value?.status === 'BLOCK');
const isNeedInfo = computed(() => result.value?.status === 'NEED_INFO');

/** 결과 카드 색·문구. NEED_INFO 는 초록(안전)이 아니라 주의로 그린다. */
const resultTone = computed(() => {
  if (isSafe.value)
    return { box: 'bg-badge-success', text: 'text-success', title: '계약 때와 같아요' };
  if (isBlock.value)
    return { box: 'bg-badge-danger', text: 'text-danger', title: '잔금을 보내지 마세요' };
  return { box: 'bg-badge-warning', text: 'text-warning', title: '아직 확인이 필요해요' };
});

async function compare() {
  if (!answered.value || saving.value) return;

  saving.value = true;
  error.value = '';
  try {
    result.value = await useContractApi().recordRegistry(
      planId,
      'SETTLEMENT_DAY',
      today(),
      facts.value,
    );
  } catch (cause) {
    error.value = messageFrom(cause, '대조하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}

/**
 * 잔금 송금을 마치고 3루를 닫는다.
 *
 * SAFE 일 때만 부른다. 실제 잔금 지급일·전입신고일을 남긴 뒤 서버 완료를 호출하면,
 * 서버가 그 날짜와 SAFE 대조를 다시 확인하고 통과할 때만 HOME 으로 넘긴다. 승인
 * 뒤에만 다음 화면으로 이동한다.
 */
async function finish() {
  if (!isSafe.value || !datesReady.value || completing.value) return;

  completing.value = true;
  error.value = '';
  try {
    const { saveExecutionFacts, complete } = useContractApi();
    await saveExecutionFacts(planId, balancePaidAt.value, moveInReportAt.value);

    const plan = await usePlanApi().get(planId);
    if (!plan.ruleVersion) throw new Error('계획 규칙 버전을 확인할 수 없어요.');
    await complete(planId, plan.ruleVersion);

    // done=1 은 안착 축하를 여는 표시다. 서버 완료가 승인된 뒤에만 붙는다.
    await navigateTo(`/contract/${planId}/after-settlement?done=1`);
  } catch (cause) {
    error.value = messageFrom(cause, '3루를 완료하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    completing.value = false;
  }
}

/** ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="[COACH_TIME.registryTrap]"
    brand
    base="3루"
  >
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="THIRD_BASE_STEPS" :current="4" />

      <h1 class="text-question text-ink-card">D-day 잔금일</h1>
      <div class="bg-surface border-danger rounded-field flex flex-col gap-1 border p-3.5">
        <p class="text-label2 text-danger font-bold">
          돈을 보내기 전에 등기부를 한 번 더 떼야 해요
        </p>
        <p class="text-caption2 text-ink-hero-body">
          700원이면 되는 일. 이걸 안 하면 특약 2번이 무용지물이 돼요
        </p>
      </div>

      <h2 class="text-body3 text-ink-hero font-bold">오늘의 타임라인</h2>

      <div v-for="row in TIMELINE" :key="row.what" class="flex items-center gap-2.5">
        <span class="text-caption1 text-primary-strong w-16 shrink-0">{{ row.when }}</span>
        <span class="text-caption2 text-ink-hero flex-1">{{ row.what }}</span>
      </div>

      <h2 class="text-body3 text-ink-hero font-bold">송금 전 대조표</h2>

      <AppCard class="flex flex-col gap-1 p-2.5">
        <CheckItem v-model="checkedOwner" tone="filled">
          <span class="flex items-center justify-between gap-2">
            <span>소유자</span>
            <span class="text-micro text-warning-strong font-normal">다르면 중단</span>
          </span>
        </CheckItem>
        <CheckItem v-model="checkedSeniorDebt" tone="filled">
          <span class="flex items-center justify-between gap-2">
            <span>채권최고액</span>
            <span class="text-micro text-warning-strong font-normal">늘었으면 중단</span>
          </span>
        </CheckItem>
        <CheckItem v-model="checkedMortgageCount" tone="filled">
          <span class="flex items-center justify-between gap-2">
            <span>근저당 건수</span>
            <span class="text-micro text-warning-strong font-normal">늘었으면 중단</span>
          </span>
        </CheckItem>
        <CheckItem v-model="checkedSeizure" tone="filled">
          <span class="flex items-center justify-between gap-2">
            <span>압류·가압류</span>
            <span class="text-micro text-warning-strong font-normal">새로 생겼으면 중단</span>
          </span>
        </CheckItem>
        <CheckItem v-model="checkedLeasehold" tone="filled">
          <span class="flex items-center justify-between gap-2">
            <span>임차권등기</span>
            <span class="text-micro text-warning-strong font-normal">새로 생겼으면 중단</span>
          </span>
        </CheckItem>
        <CheckItem v-model="checkedAuction" tone="filled">
          <span class="flex items-center justify-between gap-2">
            <span>경매 진행</span>
            <span class="text-micro text-warning-strong font-normal">진행 중이면 중단</span>
          </span>
        </CheckItem>
        <CheckItem v-model="checkedTrust" tone="filled">
          <span class="flex items-center justify-between gap-2">
            <span>신탁등기</span>
            <span class="text-micro text-warning-strong font-normal">있으면 중단</span>
          </span>
        </CheckItem>
      </AppCard>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>

      <!-- 판정은 서버가 한다. 화면은 SAFE·NEED_INFO·BLOCK 을 구분해 옮긴다. -->
      <div v-if="result" class="rounded-field flex flex-col gap-1.5 p-3.5" :class="resultTone.box">
        <p class="text-label2 font-bold" :class="resultTone.text">{{ resultTone.title }}</p>
        <p v-for="risk in result.changedRisks" :key="risk" class="text-caption2 text-ink-hero">
          · {{ risk }}
        </p>
        <p v-if="result.action" class="text-caption2 text-ink-hero-body">{{ result.action }}</p>
        <button
          v-if="isNeedInfo && !result.signingRegistryIssuedAt"
          type="button"
          class="bg-surface rounded-chip text-label2 text-primary-strong mt-1 self-start px-3.5 py-2.5 font-semibold"
          @click="navigateTo(`/contract/${planId}/registry?from=settlement`)"
        >
          계약 당시 등기부 기록하기 →
        </button>
        <button
          v-if="isBlock"
          type="button"
          class="bg-surface rounded-chip text-label2 text-primary-strong mt-1 self-start px-3.5 py-2.5 font-semibold"
          @click="navigateTo(`/contract/${planId}/registry-changed`)"
        >
          등기부 변동 대응 보기 →
        </button>
      </div>

      <!-- SAFE 일 때만 실제로 낸 날을 확인하고 완료한다. -->
      <AppCard v-if="isSafe" class="flex flex-col gap-3">
        <p class="text-label2 text-ink-hero font-semibold">실제 잔금 지급일</p>
        <input
          v-model="balancePaidAt"
          type="date"
          class="bg-canvas rounded-chip text-body3 text-ink-hero h-11 px-3.5 outline-none"
        />
        <p class="text-label2 text-ink-hero font-semibold">전입신고일</p>
        <input
          v-model="moveInReportAt"
          type="date"
          class="bg-canvas rounded-chip text-body3 text-ink-hero h-11 px-3.5 outline-none"
        />
      </AppCard>

      <DetailLink @open="navigateTo(`/contract/${planId}/settlement-detail`)">
        타임라인·돈 흐름·대조표 상세보기
      </DetailLink>
    </div>

    <template #footer>
      <footer class="px-gutter-tight flex shrink-0 gap-2 pt-2.5 pb-cta-pad">
        <div class="w-28 shrink-0">
          <AppButton variant="white" @click="navigateTo(`/contract/${planId}/review`)">
            이전
          </AppButton>
        </div>
        <AppButton
          v-if="isSafe"
          variant="strong"
          :disabled="completing || !datesReady"
          @click="finish"
        >
          {{ completing ? '완료 처리 중…' : '잔금 송금 완료 · 3루 마치기' }}
        </AppButton>
        <AppButton v-else-if="isNeedInfo || isBlock" variant="strong" disabled>
          {{ isBlock ? '잔금을 보낼 수 없어요' : '확인이 더 필요해요' }}
        </AppButton>
        <AppButton v-else variant="strong" :disabled="!answered || saving" @click="compare">
          {{ saving ? '대조 중…' : '잔금 송금' }}
        </AppButton>
      </footer>
    </template>
  </StageShell>
</template>
