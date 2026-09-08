<script setup lang="ts">
import { useContractApi, type RegistryComparison } from '~/api/contract';
import { usePlanApi } from '~/api/plan';
import {
  OWNER_OPTIONS,
  PRESENCE_NEW_OPTIONS,
  useRegistrySnapshot,
} from '~/composables/useRegistrySnapshot';
import { messageFrom } from '~/utils/error';

/**
 * 3루 10 · 잔금일.
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

const { owner, seizure, leasehold, auction, trust, seniorDebt, mortgageCount, answered, facts } =
  useRegistrySnapshot();

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
watch([owner, seizure, leasehold, auction, trust, seniorDebt, mortgageCount], () => {
  result.value = null;
});

const isSafe = computed(() => result.value?.status === 'SAFE');
const isBlock = computed(() => result.value?.status === 'BLOCK');
const isNeedInfo = computed(() => result.value?.status === 'NEED_INFO');

/** 결과 카드 색·문구. NEED_INFO 는 초록(안전)이 아니라 주의로 그린다. */
const resultTone = computed(() => {
  if (isSafe.value) return { box: 'bg-badge-success', text: 'text-success', title: '계약 때와 같아요' };
  if (isBlock.value) return { box: 'bg-badge-danger', text: 'text-danger', title: '잔금을 보내지 마세요' };
  return { box: 'bg-badge-warning', text: 'text-warning', title: '아직 확인이 필요해요' };
});

async function compare() {
  if (!answered.value || saving.value) return;

  saving.value = true;
  error.value = '';
  try {
    result.value = await useContractApi().recordRegistry(planId, 'SETTLEMENT_DAY', today(), facts.value);
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

    await navigateTo(`/contract/${planId}/after-settlement`);
  } catch (cause) {
    error.value = messageFrom(cause, '3루를 완료하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    completing.value = false;
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
          <PillGroup v-model="owner" :options="OWNER_OPTIONS" />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">압류·가압류가 새로 생겼나요</p>
          <PillGroup v-model="seizure" :options="PRESENCE_NEW_OPTIONS" />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">전세권이 새로 설정됐나요</p>
          <PillGroup v-model="leasehold" :options="PRESENCE_NEW_OPTIONS" />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">경매·공매가 시작됐나요</p>
          <PillGroup v-model="auction" :options="PRESENCE_NEW_OPTIONS" />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">신탁 등기가 새로 생겼나요</p>
          <PillGroup v-model="trust" :options="PRESENCE_NEW_OPTIONS" />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">오늘 채권최고액 (만 원)</p>
          <input
            v-model="seniorDebt"
            inputmode="numeric"
            placeholder="없으면 0을 입력하세요"
            class="bg-canvas rounded-chip text-body3 text-ink-hero placeholder:text-ink-muted h-11 px-3.5 outline-none"
          />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">오늘 근저당 건수</p>
          <input
            v-model="mortgageCount"
            inputmode="numeric"
            placeholder="없으면 0을 입력하세요"
            class="bg-canvas rounded-chip text-body3 text-ink-hero placeholder:text-ink-muted h-11 px-3.5 outline-none"
          />
        </div>
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

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton
        v-if="isSafe"
        variant="strong"
        :disabled="completing || !datesReady"
        @click="finish"
      >
        {{ completing ? '완료 처리 중…' : '잔금 송금 완료 · 3루 마치기' }}
      </AppButton>
      <AppButton
        v-else-if="isNeedInfo || isBlock"
        variant="strong"
        disabled
      >
        {{ isBlock ? '잔금을 보낼 수 없어요' : '확인이 더 필요해요' }}
      </AppButton>
      <AppButton v-else variant="strong" :disabled="!answered || saving" @click="compare">
        {{ saving ? '대조 중…' : '대조 완료 · 잔금 송금하기' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
