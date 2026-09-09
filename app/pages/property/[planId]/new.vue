<script setup lang="ts">
import { useAddressApi, type AddressResult } from '~/api/address';
import { usePlanApi } from '~/api/plan';
import { usePropertyApi } from '~/api/property';
import { KB_LAND_URL } from '~/components/property/links';
import { parseManwon } from '~/utils/amount';
import { messageFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';
import type { CoachSheet } from '~/components/coach/sheet';
import { COACH_TIME } from '~/components/property/coachSheets';

/**
 * 2루 매물 등록 — 도로명 주소 검색.
 *
 * 주소를 글자로만 받지 않는다. 검색 결과에 법정동 코드와 지번이 들어 있고,
 * 건축물대장·실거래는 그 코드로 조회한다. 그래서 고른 결과를 통째로 들고
 * 있다가 등록할 때 그대로 넘긴다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const keyword = ref('');
const results = ref<AddressResult[]>([]);
const chosen = ref<AddressResult | null>(null);
const searching = ref(false);
const saving = ref(false);
const error = ref('');
const notice = ref('');

/**
 * 1루에서 정한 희망예산. 실제 매물 보증금과 다른 값이라 이걸 그대로 보증금으로 쓰지 않는다 —
 * 예산 초과 매물을 걸러내려면 두 값을 분리해서 보내야 한다. 여기서는 안내·비교용으로만 읽는다.
 */
const hopeDeposit = ref<number | null>(null);

/** 사용자가 이 매물에 실제로 걸린 보증금을 만 원 단위로 적는다. */
const realDeposit = ref('');

/**
 * 검사한 뒤에 단위를 바꾼다. 숫자가 아닌 글자를 지워서 값을 만들면 `abc` 가 0원이 되고
 * `-100` 이 100만 원으로 뒤집힌다.
 */
const parsedRealDeposit = computed(() => parseManwon(realDeposit.value));

/** 입력한 실보증금(원). 아직 안 적었으면 null. */
const realDepositWon = computed(() => parsedRealDeposit.value.value);

/**
 * 어떤 매물을 찾아야 하는가. 시안이 KB부동산 링크 바로 위에 두는 줄이다.
 *
 * "마음에 드는 매물" 만 적어 두면 조건에 안 맞는 집을 골라 와서 등록한 뒤에야
 * 걸린다. 전용면적·용도는 상품 조건이라 고정이고, 보증금만 1루에서 정한
 * 희망예산을 끌어다 쓴다 — 못 읽었으면 그 칸만 뺀다.
 */
const searchConditions = computed(() =>
  [
    hopeDeposit.value === null ? '' : `보증금 ${formatKoreanMoney(hopeDeposit.value)} 이하`,
    '전용 85㎡ 이하',
    '다세대·연립·아파트·오피스텔(주거용)',
  ]
    .filter(Boolean)
    .join(' · '),
);

/**
 * 임대인이 전세대출에 협조하기로 했는가.
 *
 * 시안 `Card/임대인 협조` 다. 법적 의무는 아닌데 실무에서는 협조가 없으면
 * 대출이 안 나간다 — 계약하고 나서 알면 계약금이 걸린 채로 막힌다. 그래서
 * 등록 전에 한 번 짚는다.
 *
 * **서버로 보내지 않는다.** 등록 API 에 받을 칸이 없다. 저장 못 하는 값을 붙잡고
 * 등록을 막으면 답을 지어내게 되므로, 여기서는 묻고 알려주기만 한다.
 */
type LandlordConsent = 'AGREED' | 'NOT_ASKED' | 'REFUSED';

const CONSENT_OPTIONS: { value: LandlordConsent; label: string }[] = [
  { value: 'AGREED', label: '확인했고 협조 가능하대요' },
  { value: 'NOT_ASKED', label: '아직 안 물어봤어요' },
  { value: 'REFUSED', label: '거부 의사를 밝히셨어요' },
];

const consent = ref<LandlordConsent | null>(null);

/** 고른 답에 붙는 말. 아직 안 골랐으면 아무 말도 안 한다. */
const consentNotice = computed(() => {
  if (consent.value === 'NOT_ASKED') {
    return '중개사를 통해 먼저 물어보세요. 계약 뒤에 알면 계약금이 걸린 채로 막혀요';
  }
  if (consent.value === 'REFUSED') {
    return '거부해도 매물이 바로 불가가 되진 않아요. 다만 이대로면 대출 실행이 어려우니 다른 매물도 같이 보세요';
  }
  return '';
});

/** 실보증금이 희망예산을 넘는가. 서버 판정과 별개로 등록 전에 먼저 알려준다. */
const overBudget = computed(
  () =>
    hopeDeposit.value !== null &&
    realDepositWon.value !== null &&
    realDepositWon.value > hopeDeposit.value,
);

/** 실거래 조회 기준 달. 화면에서 묻지 않으므로 이번 달로 본다. */
const dealYearMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
};

onMounted(async () => {
  try {
    hopeDeposit.value = (await usePlanApi().input(planId)).hopeDeposit;
  } catch {
    // 못 읽어도 검색은 할 수 있다. 등록할 때 다시 알린다.
  }
});

async function search() {
  const text = keyword.value.trim();
  if (text.length < 2 || searching.value) return;

  searching.value = true;
  error.value = '';
  chosen.value = null;
  try {
    results.value = (await useAddressApi().search(text)).addresses;
    notice.value = results.value.length ? '' : '찾는 주소가 없어요. 도로명으로 다시 검색해보세요.';
  } catch (cause) {
    error.value = messageFrom(cause, '주소를 검색하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    searching.value = false;
  }
}

async function start() {
  if (!chosen.value || saving.value) return;
  const deposit = realDepositWon.value;
  if (deposit === null || deposit <= 0) {
    error.value = '이 매물의 실제 보증금을 입력해주세요.';
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    const analysis = await usePropertyApi().analyze(planId, chosen.value, deposit, dealYearMonth());
    await navigateTo(`/property/${planId}/${analysis.propertyId}`);
  } catch (cause) {
    error.value = messageFrom(cause, '매물을 등록하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}
/**
 * 코치 TIME 을 문항별로 연다.
 *
 * 시안은 이 화면에 모달을 둘 둔다 — `매물 고를 때 미리 거르기` 와 `임대인 협조`.
 * 각 줄의 ⓘ 가 제 것만 열고, 오른쪽 아래 FAB 은 둘 다 편다. 하나로 합쳐 열면
 * 방금 누른 줄의 답이 어디 있는지 찾아야 한다.
 */
const ALL_SHEETS = [COACH_TIME.propertyFilter, COACH_TIME.landlordConsent];

const sheets = ref<CoachSheet[]>(ALL_SHEETS);
const coachOpen = ref(false);

function openCoach(sheet: CoachSheet) {
  sheets.value = [sheet];
  coachOpen.value = true;
}

// 닫히면 다시 둘 다로 되돌린다. FAB 은 화면 전체를 묻는 자리다.
watch(coachOpen, (open) => {
  if (!open) sheets.value = ALL_SHEETS;
});
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="sheets"
    title="매물 등록"
    base="2루"
    @back="navigateTo(`/property/${planId}`)"
  >
    <div class="px-gutter-tight flex flex-1 flex-col gap-4 py-4">
      <h2 class="text-headline1 text-ink-hero">
        KB 부동산에서 찾은 매물의 도로명 주소를 검색해주세요
      </h2>

      <AppCard class="flex flex-col gap-3">
        <div class="flex items-center gap-1.5">
          <p class="text-body2 text-primary-strong flex-1 font-bold">
            1루 조건에 맞는 매물을 먼저 찾아보세요
          </p>
        </div>
        <p class="text-label2 text-ink-hero-body">{{ searchConditions }}</p>
        <button
          type="button"
          class="text-label2 text-primary-strong self-start font-bold"
          @click="navigateTo(KB_LAND_URL, { external: true })"
        >
          KB부동산에서 매물 찾기 ↗
        </button>
      </AppCard>

      <form
        class="bg-surface border-line rounded-field flex items-center gap-2 border px-3.5 py-3"
        @submit.prevent="search"
      >
        <input
          v-model="keyword"
          type="search"
          placeholder="도로명 주소를 입력하세요"
          class="text-input text-ink-strong placeholder:text-ink-muted w-full bg-transparent outline-none"
        />
        <button
          type="submit"
          class="text-label2 text-primary-strong shrink-0 font-bold disabled:opacity-50"
          :disabled="keyword.trim().length < 2 || searching"
        >
          {{ searching ? '검색 중' : '검색' }}
        </button>
      </form>

      <p v-if="notice" class="text-label2 text-ink-muted">{{ notice }}</p>
      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>

      <button
        v-for="result in results"
        :key="result.roadAddress + result.mainLotNumber + result.subLotNumber"
        type="button"
        class="rounded-field border p-4 text-left transition-colors"
        :class="
          chosen === result ? 'border-primary-strong bg-surface-info' : 'border-line bg-surface'
        "
        @click="chosen = result"
      >
        <p class="text-body2 text-ink-hero font-bold">{{ result.roadAddress }}</p>
        <p class="text-label2 text-ink-hero-body mt-3">
          {{ result.buildingName || result.jibunAddress }}
        </p>
      </button>

      <AppCard v-if="chosen" class="flex flex-col gap-3">
        <p class="text-body3 text-ink-hero font-bold">이 매물의 실제 보증금 (만 원)</p>
        <p class="text-caption2 text-ink-muted">
          1루에서 정한 희망예산이 아니라, 이 집에 실제로 걸린 보증금을 적어주세요
        </p>
        <input
          v-model="realDeposit"
          :error="parsedRealDeposit.error ?? ''"
          inputmode="numeric"
          placeholder="보증금 입력"
          class="bg-canvas rounded-chip text-body3 text-ink-hero placeholder:text-ink-muted w-full px-3.5 py-3 outline-none"
        />
        <p v-if="hopeDeposit !== null" class="text-caption2 text-ink-muted">
          희망예산: {{ hopeDeposit.toLocaleString() }}원
        </p>
        <p v-if="overBudget" class="text-label2 text-danger font-bold">
          ⚠️ 실제 보증금이 희망예산을 넘어요. 등록은 되지만 예산 초과로 표시돼요.
        </p>
      </AppCard>

      <!--
        협조 여부는 서버에 보낼 칸이 없어 저장하지 않는다. 그래도 묻는 이유는,
        계약하고 나서 알면 계약금이 걸린 채로 막히기 때문이다.
      -->
      <AppCard class="flex flex-col gap-3">
        <div class="flex items-center gap-1.5">
          <p class="text-body3 text-ink-card flex-1 font-bold">
            임대인에게 전세대출 협조를 확인하셨나요?
          </p>
        </div>
        <PillGroup v-model="consent" :options="CONSENT_OPTIONS" />
        <p v-if="consentNotice" class="text-caption2 text-ink-hero-body">{{ consentNotice }}</p>
      </AppCard>
    </div>

    <template #footer>
      <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
        <AppButton
          variant="strong"
          :disabled="!chosen || realDepositWon === null || saving"
          @click="start"
        >
          {{ saving ? '등록 중…' : '이 매물로 진단 시작하기' }}
        </AppButton>
      </footer>
    </template>
  </StageShell>
</template>
