<script setup lang="ts">
import type { CollateralMethod, ConsultedProduct } from '~/api/consultation';
import { useContractApi } from '~/api/contract';
import { usePropertyApi } from '~/api/property';
import {
  useSettlementApi,
  type LoanAccount,
  type LoanAccountPayload,
  type RepaymentType,
} from '~/api/settlement';
import type { PillOption } from '~/components/prep/PillGroup.vue';
import { manwonFromWon, parseCount, parseManwon } from '~/utils/amount';
import { messageFrom, statusFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';

/**
 * 홈 4-0 · 실행 대출 등록.
 *
 * 4루의 거의 모든 계산이 이 한 건에서 나온다 — 월 이자·주거비(BR-28),
 * 금리인하요구권 대상 여부, 사후자산심사 대상 여부가 전부 등록된 대출을
 * 읽는다. 그래서 이걸 안 넣으면 정착 화면 셋이 통째로 빈다.
 *
 * 상담에서 들은 조건과 **실제 실행 조건은 다를 수 있다**. 한도가 깎이거나
 * 금리가 바뀐 채로 나오는 일이 흔해서, 2루 상담·3루 잔금일 값을 미리 채워
 * 두되 전부 고칠 수 있게 둔다. 사용자가 못 본 값은 보내지 않는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const api = useSettlementApi();

/** 보증 방식은 안 고를 수도 있다. 알약에 빈 값을 둘 수 없어 표시용 코드를 쓴다. */
const NO_GUARANTEE = 'NONE';

const PRODUCT_OPTIONS: PillOption[] = [
  { value: 'YOUTH_BEOTIMMOK', label: '청년 버팀목' },
  { value: 'GENERAL_BEOTIMMOK', label: '일반 버팀목' },
  { value: 'BANK_LOAN', label: '은행 전세대출' },
  { value: 'UNKNOWN', label: '모르겠어요' },
];

const GUARANTEE_OPTIONS: PillOption[] = [
  { value: 'HUG_SAFE_JEONSE', label: '안심전세 (HUG)' },
  { value: 'HF', label: '주신보 (HF)' },
  { value: 'SGI', label: '서신보 (SGI)' },
  { value: 'CLAIM_TRANSFER', label: '채권양도' },
  { value: 'OTHER', label: '기타' },
  { value: 'UNKNOWN', label: '모르겠어요' },
  { value: NO_GUARANTEE, label: '해당 없음' },
];

const REPAYMENT_OPTIONS: PillOption[] = [
  { value: 'MATURITY_LUMP_SUM', label: '만기일시상환' },
  { value: 'EQUAL_INSTALLMENT', label: '원리금균등' },
  { value: 'UNKNOWN', label: '모르겠어요' },
];

const product = ref<string | null>(null);
const guarantee = ref<string | null>(null);
/** 만 원 단위로 받는다. 원 단위로 치게 하면 자릿수를 세게 된다. */
const principalMan = ref('');
/** 퍼센트다. 금액이 아니라서 ×10,000 하지 않는다. */
const ratePercent = ref('');
const repaymentType = ref<string | null>(null);
const executedAt = ref('');
const maturityAt = ref('');
const preferentialUntil = ref('');
const extensionCount = ref('');

const pending = ref(true);
const saving = ref(false);
const error = ref('');
/** 이미 등록된 대출. 있으면 이 화면은 수정이 된다. */
const saved = ref<LoanAccount | null>(null);
/** 어디서 값을 끌어왔는지. 지어낸 값이 아니라는 걸 화면에서 말해준다. */
const prefilledFrom = ref<string[]>([]);

const toDateInput = (value: string | null | undefined) => (value ? value.slice(0, 10) : '');

/**
 * 검사한 뒤에 단위를 바꾼다.
 *
 * 전에는 숫자가 아닌 글자를 지워서 값을 만들었다. `1.5`(만 원)가 점을 잃고 15만 원이 된다 —
 * 오류 한 줄 없이 10배 틀린 원금이 저장된다. 4루의 월 이자·주거비(BR-28)와 금리인하요구권이
 * 전부 이 한 값을 읽어서, 여기서 틀리면 정착 화면이 통째로 틀린 숫자를 말한다.
 *
 * 서버는 바뀐 뒤의 멀쩡한 숫자만 받으므로 원래 입력이 틀렸다는 것을 알 방법이 없다.
 */
const parsedPrincipal = computed(() => parseManwon(principalMan.value));

/** 서버가 받는 단위는 원이다(`LoanAccountPayload.principal`). 만 원 → 원 환산은 파서가 한다. */
const principalWon = computed(() => parsedPrincipal.value.value);

/** 금리는 소수점이 있다. 숫자로 못 읽으면 `null` 로 두고 저장을 막는다. */
const rate = computed(() => {
  const raw = ratePercent.value.trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
});

/** 연장 횟수도 같다. `1.5` 에서 점을 지워 15회로 만들면 하지도 않은 연장이 생긴다. */
const parsedExtensions = computed(() => parseCount(extensionCount.value));

/** 선택 항목이다. 비어 있으면 `null` 을 보낸다 — "0회 확인함" 과 "안 적음" 은 다르다. */
const extensions = computed(() => parsedExtensions.value.value);

const ready = computed(
  () =>
    !!product.value &&
    !!repaymentType.value &&
    !!executedAt.value &&
    principalWon.value !== null &&
    rate.value !== null &&
    // 연장 횟수는 선택이라 비어 있어도 되지만, 못 읽는 값을 적어 둔 채로 저장하면
    // 사용자가 적은 것이 조용히 사라진다. 오류가 남아 있는 동안은 막는다.
    !parsedExtensions.value.error,
);

/** 저장 전에도 이자가 얼마쯤인지는 보여준다. 서버 공식(BR-28)과 같다. */
const previewInterest = computed(() => {
  if (principalWon.value === null || rate.value === null) return null;
  return Math.round((principalWon.value * rate.value) / 100 / 12);
});

function fillFrom(loan: LoanAccount) {
  product.value = loan.product;
  guarantee.value = loan.guarantee ?? NO_GUARANTEE;
  // 만 원 미만을 버리지 않는다. 3,456,789원을 `345` 로 잘라 보여주면 사용자가 금리만
  // 고치고 저장하는 순간 6,789원이 사라진다.
  principalMan.value = manwonFromWon(loan.principal);
  ratePercent.value = String(loan.rate);
  repaymentType.value = loan.repaymentType;
  executedAt.value = toDateInput(loan.executedAt);
  maturityAt.value = toDateInput(loan.maturityAt);
  preferentialUntil.value = toDateInput(loan.preferentialUntil);
  extensionCount.value = loan.extensionCount ? String(loan.extensionCount) : '';
}

/**
 * 아직 등록 전이면 2루 확정 상담과 3루 잔금일에서 끌어온다.
 *
 * 같은 걸 두 번 묻지 않으려는 것이지 확정된 사실이라는 뜻은 아니다 — 그래서
 * 무엇을 어디서 가져왔는지 화면에 적어 두고 전부 고칠 수 있게 둔다.
 */
async function prefill() {
  const decision = await usePropertyApi()
    .decision(planId)
    .catch(() => null);

  const consultation = decision?.consultation ?? null;
  if (consultation) {
    const from: string[] = [];
    if (consultation.loanProduct) {
      product.value = consultation.loanProduct;
      from.push('상품');
    }
    if (consultation.collateralMethod) {
      guarantee.value = consultation.collateralMethod;
      from.push('보증 방식');
    }
    if (consultation.approvedLimit !== null) {
      principalMan.value = manwonFromWon(consultation.approvedLimit);
      from.push('원금(승인한도)');
    }
    if (consultation.quotedRate !== null) {
      ratePercent.value = String(consultation.quotedRate);
      from.push('금리');
    }
    if (from.length) {
      prefilledFrom.value.push(`2루 상담(${consultation.bankName}) · ${from.join('·')}`);
    }
  }

  // 전세대출 대부분이 만기일시상환이지만 기본으로 못 박지는 않는다. 소득공제가
  // 이 값으로 갈려서, 상품을 아는 기금대출일 때만 미리 골라 둔다.
  if (product.value === 'YOUTH_BEOTIMMOK' || product.value === 'GENERAL_BEOTIMMOK') {
    repaymentType.value = 'MATURITY_LUMP_SUM';
  }

  const schedule = await useContractApi()
    .schedule(planId)
    .catch(() => null);

  if (schedule?.balanceDate) {
    executedAt.value = toDateInput(schedule.balanceDate);
    prefilledFrom.value.push('3루 계약 · 실행일(잔금일)');
  }
}

onMounted(async () => {
  try {
    saved.value = await api.loanAccount(planId);
    fillFrom(saved.value);
  } catch (cause) {
    // 등록 전이면 404 다. 에러가 아니라 "아직 없음" 이라, 이때만 미리 채운다.
    if (statusFrom(cause) === 404) {
      await prefill();
    } else {
      error.value = messageFrom(cause, '대출 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  } finally {
    pending.value = false;
  }
});

async function save() {
  if (!ready.value || saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    const payload: LoanAccountPayload = {
      product: product.value as ConsultedProduct,
      guarantee:
        guarantee.value && guarantee.value !== NO_GUARANTEE
          ? (guarantee.value as CollateralMethod)
          : null,
      principal: principalWon.value!,
      rate: rate.value!,
      repaymentType: repaymentType.value as RepaymentType,
      executedAt: executedAt.value,
      maturityAt: maturityAt.value || null,
      preferentialUntil: preferentialUntil.value || null,
      extensionCount: extensions.value,
    };
    saved.value = await api.saveLoanAccount(planId, payload);
  } catch (cause) {
    error.value = messageFrom(cause, '대출 정보를 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <StageShell title="실행 대출 등록" base="홈" @back="navigateTo(`/settle/${planId}`)">
    <div class="px-gutter-tight flex flex-1 flex-col gap-3.5 py-4">
      <CoachTip>
        실제로 실행된 대출을 넣어줘. 이걸 알아야 월 이자랑 주거비를 정확히 계산해줄 수 있어
      </CoachTip>

      <p v-if="pending" class="text-label2 text-ink-muted">대출 정보를 불러오는 중이에요…</p>

      <template v-else>
        <!-- 저장된 값이 있으면 서버가 센 월 이자를 먼저 보여준다. -->
        <div v-if="saved" class="bg-primary-strong rounded-button flex flex-col gap-1 p-4">
          <p class="text-caption-tight text-on-brand font-semibold">등록 완료</p>
          <p class="text-metric text-on-brand">
            월 이자 {{ formatKoreanMoney(saved.monthlyInterest) }}
          </p>
          <p class="text-caption-tight text-on-brand font-normal">
            원금 {{ formatKoreanMoney(saved.principal) }} · 연 {{ saved.rate }}%
          </p>
        </div>

        <div
          v-if="prefilledFrom.length"
          class="bg-surface-info rounded-field flex flex-col gap-1 p-3.5"
        >
          <p class="text-caption-tight text-primary-strong font-bold">
            앞에서 입력한 값을 미리 채워뒀어요
          </p>
          <p v-for="line in prefilledFrom" :key="line" class="text-micro text-ink-hero-body">
            {{ line }}
          </p>
          <p class="text-micro text-ink-muted">
            상담 때와 실제 실행 조건이 다를 수 있어요. 통장·약정서를 보고 고쳐주세요
          </p>
        </div>

        <AppCard class="flex flex-col gap-3">
          <div class="flex flex-col gap-1.5">
            <p class="text-label2 text-ink">대출 상품</p>
            <PillGroup v-model="product" :options="PRODUCT_OPTIONS" />
          </div>

          <div class="flex flex-col gap-1.5">
            <p class="text-label2 text-ink">보증 방식</p>
            <PillGroup v-model="guarantee" :options="GUARANTEE_OPTIONS" />
          </div>

          <AppInput
            v-model="principalMan"
            label="대출 원금 (만 원)"
            type="tel"
            placeholder="예: 12000"
            :error="parsedPrincipal.error ?? ''"
          >
            <template v-if="principalWon !== null" #hint>
              {{ formatKoreanMoney(principalWon) }}
            </template>
          </AppInput>

          <AppInput v-model="ratePercent" label="연 금리 (%)" type="text" placeholder="예: 2.2">
            <template v-if="ratePercent.trim() && rate === null" #hint>
              숫자로 적어주세요 (예: 2.2)
            </template>
          </AppInput>

          <div class="flex flex-col gap-1.5">
            <p class="text-label2 text-ink">상환 방식</p>
            <PillGroup v-model="repaymentType" :options="REPAYMENT_OPTIONS" />
          </div>

          <div class="flex flex-col gap-1.5">
            <p class="text-label2 text-ink">대출 실행일</p>
            <input
              v-model="executedAt"
              type="date"
              class="bg-canvas rounded-chip text-body3 text-ink-hero h-11 px-3.5 outline-none"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <p class="text-label2 text-ink">만기일 (선택)</p>
            <input
              v-model="maturityAt"
              type="date"
              class="bg-canvas rounded-chip text-body3 text-ink-hero h-11 px-3.5 outline-none"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <p class="text-label2 text-ink">우대금리 만료일 (선택)</p>
            <input
              v-model="preferentialUntil"
              type="date"
              class="bg-canvas rounded-chip text-body3 text-ink-hero h-11 px-3.5 outline-none"
            />
          </div>

          <AppInput
            v-model="extensionCount"
            label="연장 횟수 (선택)"
            type="tel"
            placeholder="아직 연장한 적 없으면 비워두세요"
            :error="parsedExtensions.error ?? ''"
          />
        </AppCard>

        <p
          v-if="previewInterest !== null"
          class="bg-surface-brand rounded-chip text-micro text-ink-hero-body p-3"
        >
          이 조건이면 월 이자는 약 {{ formatKoreanMoney(previewInterest) }} 이에요. 저장하면 서버가
          센 값으로 정착 화면이 다시 계산돼요
        </p>

        <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
      </template>
    </div>

    <template #footer>
      <footer class="px-gutter-tight bg-surface flex shrink-0 flex-col gap-2 pt-2.5 pb-cta-pad">
        <AppButton variant="strong" :disabled="pending || saving || !ready" @click="save">
          {{ saving ? '저장 중…' : saved ? '대출 정보 수정하기' : '대출 정보 저장하기' }}
        </AppButton>
        <AppButton v-if="saved" variant="white" @click="navigateTo(`/settle/${planId}/checkin`)">
          이번 달 상태 보러가기
        </AppButton>
      </footer>
    </template>
  </StageShell>
</template>
