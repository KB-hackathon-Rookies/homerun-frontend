<script setup lang="ts">
import { useFirstBaseApi } from '~/api/firstBase';
import { incomeSyncOutcome, useOpenBankingApi, type FinancialSummary } from '~/api/openbanking';
import {
  type DiagnosisStep,
  type DiagnosisStepPatch,
  type PlanInput,
  type PlanInputResume,
  usePlanApi,
} from '~/api/plan';
import { useRegionApi, type RegionOption } from '~/api/region';
import { useInputRevision } from '~/composables/useInputRevision';
import { manwonFromWon, parseManwon } from '~/utils/amount';
import { messageFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';

/**
 * 1루 추가 정보 입력.
 *
 * 시안(1루 3)이 한 장에 다 편다. 확인·직접입력·보증금·지역을 네 화면으로 넘기던 것을
 * 한 화면으로 모았다 — 서로 짧고 한 덩어리로 읽히는 값이라 훑는 편이 빠르다.
 * 서버는 여전히 STEP 단위로 받으므로 다음을 누를 때 순서대로 보낸다.
 *
 * 소득은 서버가 오픈뱅킹으로 검증한 값만 `OPEN_BANKING` 출처로 쓴다. 그래서
 * 먼저 서버에 동기화·확인을 요청하고, 그다음 STEP 을 저장한다. 요약 GET 만으로는
 * 서버가 출처를 기록하지 않아, 그대로 `OPEN_BANKING` 을 보내면 409 로 막힌다.
 *
 * 시안이 조회 카드에 나란히 놓은 `금융자산` 이 곧 진단이 쓰는 `순자산` 이다. 맞다고
 * 답하면 그 값을 순자산으로 그대로 쓰고, 아니라고 답할 때만 직접 받는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const { revision, load, saveStep } = useInputRevision(planId);
const pending = ref(false);
const error = ref('');

/** 오픈뱅킹 조회값. 못 가져오면 바로 직접 입력으로 보낸다. */
const summary = ref<FinancialSummary | null>(null);
const regions = ref<RegionOption[]>([]);

const useOpenBanking = ref<string | null>(null);
const income = ref('');
const assets = ref('');
/** 지금 당장 쓸 수 있는 현금(자기자금). 1루 완료 시 확인 대상이라 실제 값을 받는다. */
const availableCash = ref('');
const deposit = ref('');
const regionId = ref<string | null>(null);

/** 서버가 오픈뱅킹으로 확정해 저장한 월 소득(원). STEP 저장에 그대로 실어 보낸다. */
const openBankingIncome = ref<number | null>(null);

/** 오픈뱅킹을 골랐는데 직접 입력으로 되돌아온 이유. 없으면 빈 문자열. */
const preservedIncomeNotice = ref('');

/**
 * 화면은 만 원 단위로 받고 백엔드는 원 단위로 받는다. **검사한 뒤에** 바꾼다.
 *
 * 전에는 숫자가 아닌 글자를 지워서 값을 만들었다. `abc` 가 0원(= 무소득·무자산)이 되고
 * `-100` 이 100만 원으로 뒤집혔다. 진단은 이 값으로 부족자금을 계산하므로 조용히 통과하면
 * 결과가 통째로 어긋난다.
 */
const parsedIncome = computed(() => parseManwon(income.value));
const parsedAssets = computed(() => parseManwon(assets.value));
const parsedCash = computed(() => parseManwon(availableCash.value));
const parsedDeposit = computed(() => parseManwon(deposit.value));

/**
 * 저장된 답을 칸에 되돌려 놓는다.
 *
 * 전에는 `revision` 만 읽어서, 지역 입력에서 새로고침하면 **빈 금융 문진이 처음부터**
 * 다시 나왔다. 서버는 답을 들고 있는데 화면이 안 읽었다. 금액은 원으로 저장돼 있어
 * 만 원 칸으로 되돌릴 때 버리지 않고 소수까지 그대로 적는다.
 */
function restore(input: PlanInput | null) {
  if (!input) return;

  income.value = manwonFromWon(input.monthlyIncome);
  assets.value = manwonFromWon(input.netAssets);
  availableCash.value = manwonFromWon(input.availableCash);
  deposit.value = manwonFromWon(input.hopeDeposit);
  regionId.value = input.regionId === null ? null : String(input.regionId);

  // 이미 확인해 둔 오픈뱅킹 소득은 STEP 저장에 그대로 실어야 출처 검증에 걸리지 않는다.
  if (input.incomeSource === 'OPEN_BANKING') openBankingIncome.value = input.monthlyIncome;
}

onMounted(async () => {
  const { financialSummary } = useOpenBankingApi();
  const { jeonseOptions } = useRegionApi();

  try {
    regions.value = await jeonseOptions();
  } catch {
    // 지역 목록은 뒤 단계에서야 쓴다. 여기서 막지 않는다.
  }

  // 문진에서 이어 오므로 서버가 들고 있는 판이 이미 여러 번 올라가 있다.
  let resumed: PlanInputResume | null = null;
  try {
    resumed = await usePlanApi().resume(planId);
    revision.value = resumed.revision;
    restore(resumed.input);
  } catch {
    // 이어할 게 없거나 조회가 막혔다. 저장은 서버가 소유자·revision 으로 막는다.
    await load();
  }

  // 소득을 이미 확인해 뒀으면 오픈뱅킹을 다시 물을 이유가 없다. 직접 입력 칸만 편다.
  if (resumed?.input?.incomeSource === 'OPEN_BANKING') return;

  try {
    summary.value = await financialSummary();
  } catch {
    // 연동을 안 했거나 조회가 실패했다. 물어볼 값이 없으니 직접 입력만 남긴다.
    useOpenBanking.value = 'MANUAL';
  }
});

/** 오픈뱅킹으로 확인할 값이 있는가. 없으면 확인 카드를 아예 세우지 않는다. */
const hasSummary = computed(() => !!summary.value);
/** 직접 입력 칸을 펴야 하는가. 조회값이 없으면 처음부터 편다. */
const manual = computed(() => !hasSummary.value || useOpenBanking.value === 'MANUAL');

const canProceed = computed(() => {
  if (hasSummary.value && !useOpenBanking.value) return false;
  // 값이 채워졌는지가 아니라 형식을 통과했는지를 본다. `abc` 는 채워진 것이 아니다.
  if (manual.value && (parsedIncome.value.value === null || parsedAssets.value.value === null)) {
    return false;
  }
  return parsedCash.value.value !== null && parsedDeposit.value.value !== null && !!regionId.value;
});

/** 진행 표시. 앞 두 칸은 문진에서 이미 지나왔다. */
const SUB_STEPS = ['기본 정보', '회사 정보', '추가 정보', '예상 진단'];

const REGION_OPTIONS = computed(() =>
  regions.value.map((region) => ({ value: String(region.id), label: region.name })),
);

/** 3억을 넘으면 기금대출이 막힌다. 미리 알려준다. */
const depositNotice = computed(() =>
  (parsedDeposit.value.value ?? 0) > 300_000_000
    ? '3억 원을 초과하면 정부 지원 전세자금대출(기금대출)은 한정적일 수 있어요. 대신 은행 전세자금대출은 보증금 한도가 없어서 계속 진행할 수 있어요'
    : null,
);

async function save(code: DiagnosisStep, patch: DiagnosisStepPatch) {
  await saveStep(code, patch);
}

/**
 * 오픈뱅킹 소득을 서버에 동기화하고 확인받는다.
 *
 * **서버가 늘 추정값을 저장하지는 않는다.** 사용자가 직접 적어 둔 소득이 있거나
 * 이미 확인을 마친 값이 있으면 서버는 그것을 지키고 추정값을 버린다. 무엇을 했는지는
 * `monthlyIncomeSyncStatus` 가 말하고, 실제로 저장된 값은 `input` 에 실려 온다.
 *
 * 전에는 상태를 보지 않고 추정값을 저장값처럼 쓰면서 확인을 무조건 호출했다. 그래서
 * 수동 입력이 보존된 사용자는 확인 요청이 409(`PLAN_017`)로 튕겨 나가 이유도 모른 채
 * 막혔고, 이미 확인된 사용자는 저장값과 다른 추정값을 다음 단계로 실어 보냈다.
 *
 * @returns 소득을 확정했으면 true. false 면 직접 입력 칸이 펴진 채 멈춘다.
 */
async function confirmOpenBankingIncome() {
  const { syncPlanIncome, confirmPlanIncome } = useOpenBankingApi();

  const synced = await syncPlanIncome(planId);
  const stored = synced.input;

  // 서버가 들고 있는 값이 기준이다. 추정값은 반영됐을 때만 이 안에 들어 있다.
  restore(stored);

  const outcome = incomeSyncOutcome(synced);

  if (outcome === 'MANUAL') {
    // 왜 직접 입력으로 왔는지 말해 준다. 적어 둔 값이 그대로 있는데 설명이 없으면
    // 오픈뱅킹이 실패한 것으로 읽힌다.
    preservedIncomeNotice.value =
      synced.monthlyIncomeSyncStatus === 'MANUAL_VALUE_PRESERVED'
        ? '직접 입력해 두신 소득이 있어 그대로 두었어요. 오픈뱅킹 값으로 바꾸시려면 아래에서 고쳐주세요'
        : '';
    useOpenBanking.value = 'MANUAL';
    return false;
  }

  preservedIncomeNotice.value = '';
  if (outcome === 'CONFIRM') await confirmPlanIncome(planId);
  // 동기화·확인으로 서버 revision 이 올라갔으니 최신값을 물려받는다.
  await load();
  return true;
}

/**
 * 한 화면에 모인 답을 서버가 받는 순서대로 보낸다.
 *
 * 중간에서 실패하면 거기까지는 저장된 채로 멈춘다. 다시 누르면 같은 값을 다시
 * 보내므로 덧나지 않는다.
 */
async function next() {
  if (!canProceed.value || pending.value) return;

  pending.value = true;
  error.value = '';
  try {
    let financePatch: DiagnosisStepPatch;
    if (manual.value) {
      financePatch = {
        // canProceed 가 manual 일 때 income·assets 를 non-null 로 보장한다. 0 fallback 이 아니다.
        monthlyIncome: parsedIncome.value.value!,
        incomeSource: 'MANUAL',
        netAssets: parsedAssets.value.value!,
        assetSource: 'MANUAL',
      };
    } else {
      // 확정하지 못하면 직접 입력 칸이 펴진 채로 멈춘다. 0원으로 조용히 넘기지 않는다.
      if (!(await confirmOpenBankingIncome())) return;
      // 소득은 서버가 확인한 값을, 순자산은 조회 카드에 보여준 금융자산을 쓴다.
      financePatch = {
        monthlyIncome: openBankingIncome.value ?? undefined,
        incomeSource: 'OPEN_BANKING',
        netAssets: summary.value?.totalAccountBalance ?? 0,
        assetSource: 'OPEN_BANKING',
      };
    }

    await save('FINANCIAL', {
      ...financePatch,
      availableCash: parsedCash.value.value!,
      /*
       * 기존 전세자금대출은 화면에서 묻지 않고 **없음으로 두고 판정한다.**
       *
       * 시안 1루 3 에 그 문항이 없고, 이 서비스가 돕는 첫 독립 청년에게는 이미
       * 받아 둔 전세자금대출이 사실상 없다. 비워서 보내면 중복대출 조건이 확인되지
       * 않은 채 남아 카드가 전부 "확인 필요" 로 떨어지는데, 그건 화면이 말하려는
       * 바(조건을 통과했다)와 어긋난다.
       *
       * 세대원·배우자까지 확인한 것은 아니므로 `prohibitedLoanConfirmed` 는 보내지
       * 않는다. 그 부분은 2루 은행 상담에서 실제로 확인된다.
       */
      existingJeonseLoan: false,
      financialDataConfirmed: true,
    });
    await save('HOPE_DEPOSIT', { hopeDeposit: parsedDeposit.value.value! });
    await save('REGION', { regionId: Number(regionId.value) });
    await submitFirstBase();
  } catch (cause) {
    error.value = messageFrom(cause, '저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
}

/**
 * 1루를 최종 제출한다.
 *
 * 결과 화면은 정책 평가 API 를 다시 부르므로, 여기서 평가만 해서는 계획 stage 가
 * 1루에 남는다. REVIEW 를 저장해 필수 입력이 다 찼음을 확정한 뒤, first-base 완료를
 * 호출해 서버가 진단을 저장하고 계획을 2루로 넘기게 한다. 서버가 완료를 승인한
 * 뒤에만 결과 화면으로 넘어간다.
 */
async function submitFirstBase() {
  await saveStep('REVIEW', {});

  const plan = await usePlanApi().get(planId);
  if (!plan.ruleVersion) throw new Error('계획 규칙 버전을 확인할 수 없어요.');

  /*
   * 비용은 하나도 보내지 않는다. 화면에서 받지 않는 값이라 0 을 보내면 "확인해서 0원" 이
   * 되어 초기 필요자금과 부족자금이 실제보다 작게 나온다. 중개보수·인지세·보증료는 대출금이
   * 정해져야 나오는 값이라 애초에 화면이 알 수 없고, 서버가 기준 수치로 계산해 채운다.
   */
  const result = await useFirstBaseApi().complete(planId, revision.value, plan.ruleVersion, {});
  if (result.status !== 'COMPLETED') {
    // 아직 확인하지 못한 입력이 남았다(예: 자기자금). 화면을 넘기지 않는다.
    error.value = '입력을 한 번 더 확인해야 해요. 값을 확인하고 다시 시도해주세요.';
    return;
  }
  await navigateTo(`/result/${planId}/match`);
}

/**
 * 코치 TIME(시안 1루 3 모달 · 실제로 필요한 돈).
 *
 * 이 화면에서 보증금을 적는데, 보증금만 준비하면 되는 줄 알고 넘어가는 게
 * 여기서 제일 자주 나는 사고다. 시안은 부대비용을 모달로 따로 편다.
 *
 * 내용은 시안 문구 그대로다. 예시 계정의 금액이 박힌 항목은 빼고 규칙만 남긴다.
 */
const COACH = {
  title: '실제로 필요한 돈',
  intro:
    '보증금만 준비하면 되는 게 아니야. 중개보수, 이사비, 보증료 같은 게 따로 들어. 이걸 빼먹으면 잔금일에 돈이 모자라',
  qa: [
    {
      q: '부대비용 네 가지',
      a: '중개보수(보증금 × 0.3% + 부가세), 인지세(3만 5천~7만 5천원), 보증료(대출금 × 0.04~0.27%), 이사비(30만~100만원)',
    },
    {
      q: '계약금은 먼저 나가',
      a: '보증금의 5~10%를 계약할 때 내 돈으로 먼저 내. 대출 신청 조건이 보증금의 5% 이상 지급이야',
    },
    {
      q: '보증금이 3억원을 넘으면',
      a: '정부 지원 전세자금대출은 한정적일 수 있어. 대신 은행 전세자금대출은 보증금 한도가 없어서 계속 진행할 수 있어',
    },
  ],
  /** 시안 `더 알아보기` 칩. 실제로 있는 모듈만 건다. */
  related: [{ id: 'safe-contract-333', label: '안심계약 3·3·3 법칙' }],
};

const coachOpen = ref(false);

function back() {
  // 앞 답을 고치러 가는 길이라고 알린다. 안 그러면 그 화면이 이어하기로 보고 되돌려 보낸다.
  navigateTo(`/diagnosis/${planId}?edit=1`);
}
</script>

<template>
  <StageShell v-model:coach-open="coachOpen" :coach-sheets="[COACH]" brand base="1루">
    <div class="bg-canvas-soft flex min-h-full flex-col gap-2.5 px-4 pt-4 pb-6">
      <SubStep :steps="SUB_STEPS" :current="2" />

      <h1 class="text-question text-ink-card">자산과 희망 조건을 알려주세요</h1>

      <QuestionBlock v-if="hasSummary" question="오픈뱅킹으로 조회한 정보예요. 맞나요?">
        <div class="border-line rounded-field flex w-full gap-8 border px-4 py-3">
          <div class="flex flex-col gap-1">
            <span class="text-micro text-ink-label">금융자산</span>
            <span class="text-numeric text-ink-card">
              약 {{ formatKoreanMoney(summary?.totalAccountBalance) }}
            </span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-micro text-ink-label">월 평균 소득</span>
            <span class="text-numeric text-ink-card">
              {{ formatKoreanMoney(summary?.averageMonthlyNetIncome) }}
            </span>
          </div>
        </div>

        <PillGroup
          v-model="useOpenBanking"
          variant="small"
          :options="[
            { value: 'OPEN_BANKING', label: '맞아요' },
            { value: 'MANUAL', label: '아니에요, 직접 입력할게요' },
          ]"
        />
      </QuestionBlock>

      <QuestionBlock
        v-if="manual"
        question="아래 정보를 직접 입력해주세요"
        :follow="hasSummary"
        :hint="hasSummary ? `추가 입력 · '아니에요'를 고르면 나타나요` : undefined"
      >
        <!-- 왜 직접 입력으로 왔는지 말해 준다. 적어 둔 값이 그대로면 실패로 읽힌다. -->
        <p v-if="preservedIncomeNotice" class="text-caption2 text-ink-card-body">
          {{ preservedIncomeNotice }}
        </p>
        <AppInput
          v-model="income"
          :error="parsedIncome.error ?? ''"
          label="월소득 (만 원)"
          type="tel"
          placeholder="예) 245만 원"
        />
        <AppInput
          v-model="assets"
          :error="parsedAssets.error ?? ''"
          label="순자산 (만 원)"
          type="tel"
          placeholder="예) 3,600만 원"
        />
      </QuestionBlock>

      <QuestionBlock question="지금 쓸 수 있는 현금이 얼마인가요?">
        <AppInput
          v-model="availableCash"
          :error="parsedCash.error ?? ''"
          label="자기자금 (만 원)"
          type="tel"
          placeholder="계약금·잔금에 보탤 돈"
        />
      </QuestionBlock>

      <QuestionBlock question="희망하는 전세 보증금을 입력해주세요">
        <AppInput
          v-model="deposit"
          :error="parsedDeposit.error ?? ''"
          label="보증금 (만 원)"
          type="tel"
          placeholder="예) 1억 8,000만 원"
        />
        <p v-if="depositNotice" class="text-caption2 text-ink-card-body">{{ depositNotice }}</p>
      </QuestionBlock>

      <QuestionBlock question="어디에서 거주하고 싶으신가요?">
        <PillGroup v-model="regionId" variant="small" :options="REGION_OPTIONS" />
        <p v-if="!regions.length" class="text-caption2 text-ink-label">
          지역 목록을 불러오지 못했어요.
        </p>
      </QuestionBlock>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <!-- 시안(1루 3)은 이전·다음을 하단 CTA 줄에 나란히 둔다. -->
    <template #footer>
      <footer class="px-gutter-tight border-line pt-2.5 pb-cta-pad flex shrink-0 gap-2.5 border-t">
        <div class="w-29 shrink-0">
          <AppButton variant="white" :disabled="pending" @click="back">이전</AppButton>
        </div>

        <AppButton variant="strong" :disabled="!canProceed || pending" @click="next">
          {{ pending ? '저장 중…' : '매칭 확인' }}
        </AppButton>
      </footer>
    </template>
  </StageShell>
</template>
