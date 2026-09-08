<script setup lang="ts">
import {
  useConsultationApi,
  type CollateralMethod,
  type ConsultationResult,
  type ConsultedProduct,
} from '~/api/consultation';
import {
  COLLATERAL_OPTIONS,
  PRODUCT_OPTIONS,
  RESULT_OPTIONS,
} from '~/components/property/consultation';
import { parseManwon } from '~/utils/amount';
import { messageFrom } from '~/utils/error';
import { COACH_TIME } from '~/components/property/coachSheets';

/**
 * 2루-6b 상담 결과 입력.
 *
 * 고른 은행을 하나씩 받는다. 어디까지 적었는지는 주소에 있다 — 세 곳을 돌고
 * 왔는데 두 번째에서 날아가면 다시 못 적는다.
 *
 * 네 문항이 모두 **"못 들었어요 / 모름"** 을 받는다. 은행에서 안 들은 것을
 * 채워 넣으면 나중에 조건이 다르다고 할 때 어디가 어긋났는지 못 짚는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

const banks = computed(() =>
  String(route.query.banks ?? '')
    .split(',')
    .filter(Boolean),
);
const at = computed(() => Number(route.query.at ?? 0));
const bank = computed(() => banks.value[at.value] ?? '');
const isLast = computed(() => at.value >= banks.value.length - 1);

const result = ref<ConsultationResult | null>(null);
const product = ref<ConsultedProduct | null>(null);
const collateral = ref<CollateralMethod | null>(null);
const limit = ref('');
/** 한도를 못 들었으면 입력칸을 비우는 대신 못 들었다고 표시한다. */
const limitNotHeard = ref(false);
const rate = ref('');

const saving = ref(false);
const error = ref('');

/**
 * 검사한 뒤에 단위를 바꾼다. 숫자가 아닌 글자를 지워서 값을 만들면 `abc` 가 0원이 되고
 * `-100` 이 100만 원으로 뒤집힌다.
 */
const parsedLimit = computed(() => parseManwon(limit.value));

/**
 * 적어 넣은 금리. 비워 두면 `null` — 못 들었다는 뜻이다.
 *
 * 숫자가 아니면 `null` 이 아니라 "잘못 적었다" 로 본다. `Number('이 삼')` 은
 * `NaN` 이고 직렬화되면 `null` 로 넘어가서, 사용자는 금리를 적었다고 생각하는데
 * 서버에는 안 들어간다. 그 값이 나중에 2루 완료를 막는다.
 */
const rateText = computed(() => rate.value.trim());
const rateInvalid = computed(
  () => rateText.value !== '' && !Number.isFinite(Number(rateText.value)),
);
const quotedRate = computed(() =>
  rateText.value === '' || rateInvalid.value ? null : Number(rateText.value),
);

const canSave = computed(
  () =>
    result.value &&
    product.value &&
    collateral.value &&
    !rateInvalid.value &&
    // 못 들었다고 체크했으면 한도 칸은 보지 않는다. 적었다면 형식이 맞아야 한다.
    !(!limitNotHeard.value && parsedLimit.value.error),
);

/**
 * 지금 적은 값 중 2루를 닫기에 모자란 것.
 *
 * 저장을 막지는 않는다 — 못 들은 것은 못 들은 대로 남겨야 나중에 조건이 다르다고
 * 할 때 어디가 어긋났는지 짚을 수 있다. 다만 이대로면 확정 화면에서 못 고른다는
 * 것을 지금 알려준다.
 */
const incompleteTerms = computed(() => {
  const missing: string[] = [];
  if (product.value === 'UNKNOWN') missing.push('상품');
  if (collateral.value === 'UNKNOWN') missing.push('담보');
  if (limitNotHeard.value || !limit.value.trim()) missing.push('승인한도');
  if (quotedRate.value === null) missing.push('금리');
  return missing;
});

/** 상담한 날. 화면에서 묻지 않아 오늘로 본다. */
const today = () => new Date().toISOString().slice(0, 10);

async function save() {
  if (!canSave.value || saving.value) return;

  saving.value = true;
  error.value = '';
  try {
    await useConsultationApi().add(planId, propertyId, {
      bankName: bank.value,
      resultStatus: result.value!,
      loanProduct: product.value!,
      collateralMethod: collateral.value!,
      approvedLimit: limitNotHeard.value ? null : parsedLimit.value.value,
      quotedRate: quotedRate.value,
      consultedAt: today(),
    });

    if (isLast.value) {
      await navigateTo(`/property/${planId}/${propertyId}/consultations`);
      return;
    }
    // 다음 은행. 적은 값은 지우고 새로 받는다 — 은행마다 답이 다르다.
    await navigateTo({ path: route.path, query: { banks: route.query.banks, at: at.value + 1 } });
    result.value = null;
    product.value = null;
    collateral.value = null;
    limit.value = '';
    limitNotHeard.value = false;
    rate.value = '';
  } catch (cause) {
    error.value = messageFrom(cause, '저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <StageShell :coach-sheets="[COACH_TIME.rejected]" title="상담 결과 입력"
   base="2루"
   @back="navigateTo(`/property/${planId}/${propertyId}/consult-banks`)">

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 py-4">
      <CoachTip>상담 결과를 남겨줘. 거절돼도 다른 은행·상품으로 다시 도전할 수 있어</CoachTip>

      <div class="flex items-center gap-2">
        <h2 class="text-option text-ink-hero">{{ bank }}</h2>
        <span v-if="banks.length > 1" class="text-caption2 text-ink-hero-body">
          {{ at + 1 }} / {{ banks.length }}
        </span>
      </div>

      <AppCard class="flex flex-col gap-2.5">
        <p class="text-label2 text-ink-hero font-semibold">대출이 가능하다고 하셨나요?</p>
        <PillGroup v-model="result" :options="RESULT_OPTIONS" />
      </AppCard>

      <AppCard class="flex flex-col gap-2.5">
        <p class="text-label2 text-ink-hero font-semibold">가능한 대출은 무엇이었나요?</p>
        <PillGroup v-model="product" :options="PRODUCT_OPTIONS" />
      </AppCard>

      <AppCard class="flex flex-col gap-2.5">
        <p class="text-label2 text-ink-hero font-semibold">보증서는 뭐라고 하셨나요?</p>
        <PillGroup v-model="collateral" :options="COLLATERAL_OPTIONS" />
      </AppCard>

      <p class="bg-surface-info rounded-chip text-micro text-ink-hero-body px-2.5 py-1.5">
        안심전세면 보증금 반환보증이 함께 들어가요
      </p>

      <AppCard class="flex flex-col gap-2.5">
        <p class="text-label2 text-ink-hero font-semibold">안내받은 한도 (만 원)</p>
        <div class="flex items-center gap-2">
          <input
            v-model="limit"
            :error="limitNotHeard ? '' : (parsedLimit.error ?? '')"
            inputmode="numeric"
            placeholder="14,400"
            class="border-line rounded-chip text-body3 text-ink-hero placeholder:text-ink-muted h-12 flex-1 px-3.5 outline-none disabled:opacity-50"
            :disabled="limitNotHeard"
          />
          <button
            type="button"
            class="rounded-chip text-caption2 h-12 w-28 shrink-0 border font-medium transition-colors"
            :class="
              limitNotHeard
                ? 'bg-primary-strong border-primary-strong text-white'
                : 'border-line text-ink-hero-body'
            "
            :aria-pressed="limitNotHeard"
            @click="limitNotHeard = !limitNotHeard"
          >
            못 들었어요
          </button>
        </div>
      </AppCard>

      <!-- 시안에 없지만 최종 확정 화면이 금리를 보여준다. 상담에서 들은 값이라야 맞다. -->
      <AppCard class="flex flex-col gap-2.5">
        <p class="text-label2 text-ink-hero font-semibold">안내받은 금리 (연 %)</p>
        <input
          v-model="rate"
          inputmode="decimal"
          placeholder="2.2 — 못 들었으면 비워두세요"
          class="border-line rounded-chip text-body3 text-ink-hero placeholder:text-ink-muted h-12 px-3.5 outline-none"
        />
        <p v-if="rateInvalid" class="text-caption2 text-danger">
          숫자로 적어주세요. 못 들었으면 비워두면 돼요
        </p>
      </AppCard>

      <!--
        네 값을 다 채우지 않아도 저장은 된다 — 안 들은 걸 지어내면 안 되니까.
        다만 2루를 닫으려면 한 은행에서 넷을 다 들어야 해서, 지금 무엇이 비는지
        여기서 미리 알려준다. 확정 화면에서 처음 알면 은행을 다시 가야 한다.
      -->
      <p
        v-if="result === 'POSSIBLE' && incompleteTerms.length"
        class="bg-surface-brand rounded-chip text-caption2 text-ink-hero-body p-3"
      >
        {{ incompleteTerms.join(' · ') }} 을(를) 못 들으면 이 상담으로는 2루를 닫을 수 없어요.
        저장은 되니 나중에 확인해서 다시 남겨도 괜찮아요
      </p>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <template #footer>
<footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton variant="strong" :disabled="!canSave || saving" @click="save">
        {{ saving ? '저장 중…' : isLast ? '저장하고 끝내기' : '저장하고 다음 은행' }}
      </AppButton>
    </footer>
</template>
  </StageShell>
</template>
