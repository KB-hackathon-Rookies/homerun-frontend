<script setup lang="ts">
import { useContractApi, type RegistryComparison } from '~/api/contract';
import { messageFrom } from '~/utils/error';

/**
 * 3루 10 · 잔금일.
 *
 * **돈을 보내기 전에 등기부를 한 번 더 뗀다.** 700원이면 되는 일이고,
 * 이걸 안 하면 특약 2번이 무용지물이 된다.
 *
 * 대조는 눈으로 하지 않는다. 오늘 읽은 값을 넣으면 **서버가 계약 때와
 * 비교해 멈출지를 정한다** — 체크박스로 "같다" 를 스스로 확인하는 것과
 * 다르다.
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

const seniorDebt = ref('');
const mortgageCount = ref('');

const result = ref<RegistryComparison | null>(null);
const saving = ref(false);
const error = ref('');

/** 답이 셋인 이유는 앞 화면들과 같다 — 모르는 건 모른다고 보내야 한다. */
const OWNER_OPTIONS = [
  { value: 'SAME', label: '같아요' },
  { value: 'DIFFERENT', label: '달라요' },
  { value: 'UNKNOWN', label: '모르겠어요' },
];

const SEIZURE_OPTIONS = [
  { value: 'NONE', label: '없어요' },
  { value: 'FOUND', label: '생겼어요' },
  { value: 'UNKNOWN', label: '모르겠어요' },
];

const ownerAnswer = ref<string | null>(null);
const seizureAnswer = ref<string | null>(null);

const onlyDigits = (value: string) => Number(value.replace(/\D/g, '') || 0);
const canCheck = computed(() => ownerAnswer.value && seizureAnswer.value);

/**
 * 답을 하나라도 고치면 대조 결과를 버린다.
 *
 * 안 그러면 "같아요" 로 통과한 뒤 "달라요" 로 고쳐도 통과가 남아 잔금을
 * 보낼 수 있다. 이 화면에서 그건 그냥 두면 안 되는 상태다.
 */
watch([ownerAnswer, seizureAnswer, seniorDebt, mortgageCount], () => {
  result.value = null;
});

const today = () => new Date().toISOString().slice(0, 10);

async function compare() {
  if (!canCheck.value || saving.value) return;

  saving.value = true;
  error.value = '';
  try {
    result.value = await useContractApi().recordRegistry(planId, 'SETTLEMENT_DAY', today(), {
      ownerMatchesContractParty:
        ownerAnswer.value === 'UNKNOWN' ? null : ownerAnswer.value === 'SAME',
      seizureOrDispositionRestricted:
        seizureAnswer.value === 'UNKNOWN' ? null : seizureAnswer.value === 'FOUND',
      seniorDebt: seniorDebt.value.trim() ? onlyDigits(seniorDebt.value) * 10_000 : null,
      mortgageCount: mortgageCount.value.trim() ? onlyDigits(mortgageCount.value) : null,
      // 시안 대조표가 넷이라 나머지는 안 묻는다. 안 본 것을 채우지 않는다.
      leaseholdRegistered: null,
      auctionInProgress: null,
      trustRegistered: null,
    });
  } catch (cause) {
    error.value = messageFrom(cause, '대조하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <PhoneFrame>
    <StageBar title="D-day 잔금일" base="3루" @back="navigateTo(`/contract/${planId}/review`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
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

      <AppCard class="flex flex-col gap-3">
        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">소유자가 계약 때와 같나요</p>
          <PillGroup v-model="ownerAnswer" :options="OWNER_OPTIONS" />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">압류·가압류가 새로 생겼나요</p>
          <PillGroup v-model="seizureAnswer" :options="SEIZURE_OPTIONS" />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">오늘 채권최고액 (만 원)</p>
          <input
            v-model="seniorDebt"
            inputmode="numeric"
            placeholder="모르면 비워두세요"
            class="bg-canvas rounded-chip text-body3 text-ink-hero placeholder:text-ink-muted h-11 px-3.5 outline-none"
          />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">오늘 근저당 건수</p>
          <input
            v-model="mortgageCount"
            inputmode="numeric"
            placeholder="모르면 비워두세요"
            class="bg-canvas rounded-chip text-body3 text-ink-hero placeholder:text-ink-muted h-11 px-3.5 outline-none"
          />
        </div>
      </AppCard>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>

      <!-- 판정은 서버가 한다. 화면은 멈추라는 말을 그대로 옮긴다. -->
      <div
        v-if="result"
        class="rounded-field flex flex-col gap-1.5 p-3.5"
        :class="result.stopPayment ? 'bg-badge-danger' : 'bg-badge-success'"
      >
        <p
          class="text-label2 font-bold"
          :class="result.stopPayment ? 'text-danger' : 'text-success'"
        >
          {{ result.stopPayment ? '잔금을 보내지 마세요' : '계약 때와 같아요' }}
        </p>
        <p v-for="risk in result.changedRisks" :key="risk" class="text-caption2 text-ink-hero">
          · {{ risk }}
        </p>
        <p v-if="result.action" class="text-caption2 text-ink-hero-body">{{ result.action }}</p>
        <button
          v-if="result.stopPayment"
          type="button"
          class="bg-surface rounded-chip text-label2 text-primary-strong mt-1 self-start px-3.5 py-2.5 font-semibold"
          @click="navigateTo(`/contract/${planId}/registry-changed`)"
        >
          등기부 변동 대응 보기 →
        </button>
      </div>

      <DetailLink @open="navigateTo(`/contract/${planId}/settlement-detail`)">
        타임라인·돈 흐름·대조표 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-6">
      <AppButton
        variant="strong"
        :disabled="!canCheck || saving || result?.stopPayment"
        @click="result ? navigateTo(`/contract/${planId}/after-settlement`) : compare()"
      >
        {{ saving ? '대조 중…' : result ? '잔금 송금 완료' : '대조 완료 · 잔금 송금하기' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
