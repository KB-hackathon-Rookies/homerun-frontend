<script setup lang="ts">
import { useAddressApi, type AddressResult } from '~/api/address';
import { usePlanApi } from '~/api/plan';
import { usePropertyApi } from '~/api/property';
import { messageFrom } from '~/utils/error';

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

const onlyDigits = (value: string) => Number(value.replace(/\D/g, '') || 0);
const toWon = (value: string) => (value.trim() ? onlyDigits(value) * 10_000 : null);

/** 입력한 실보증금(원). 아직 안 적었으면 null. */
const realDepositWon = computed(() => toWon(realDeposit.value));

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
</script>

<template>
  <PhoneFrame>
    <StageBar title="매물 등록" base="2루" @back="navigateTo(`/property/${planId}`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 py-4">
      <h2 class="text-headline1 text-ink-hero">
        KB 부동산에서 찾은 매물의 도로명 주소를 검색해주세요
      </h2>

      <AppCard>
        <p class="text-body2 text-primary-strong font-bold">KB 부동산에서 매물 찾기</p>
        <p class="text-label2 text-ink-muted mt-3">마음에 드는 매물을 먼저 찾아보세요</p>
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
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton
        variant="strong"
        :disabled="!chosen || realDepositWon === null || saving"
        @click="start"
      >
        {{ saving ? '등록 중…' : '이 매물로 진단 시작하기' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
