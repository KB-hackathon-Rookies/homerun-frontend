<script setup lang="ts">
import { useContractApi, type ContractEntry } from '~/api/contract';
import { messageFrom } from '~/utils/error';
import { THIRD_BASE_STEPS } from '~/components/contract/steps';
import { COACH_TIME } from '~/components/contract/coachSheets';

/**
 * 3루 6 · 은행 방문 예약 (D-21).
 *
 * 2루 상담에서 "가능" 을 들은 그 지점으로 간다. 은행을 여기서 다시
 * 고르게 하지 않는다 — **신청 후에는 못 바꾼다.**
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const CHECKS = [
  '사전상담 받았던 지점에 전화',
  '방문 날짜 잡기 (D-10 전후)',
  '"청년 버팀목으로 진행하려고 합니다" 라고 말하기',
  '필요 서류 최종 확인 (은행마다 조금씩 달라요)',
  '등기부등본, 내가 발급해서 가져가야 하는지 확인',
];

const entry = ref<ContractEntry | null>(null);
const error = ref('');
const checked = ref<Record<string, boolean>>({});

const bank = computed(() => {
  const found = entry.value;
  if (!found?.bankName) return null;
  return found.branchName ? `${found.bankName} ${found.branchName}` : found.bankName;
});

/** 체크리스트 다 확인해야 방문 예약 완료로 넘어갈 수 있게 한다. */
const allChecked = computed(() => CHECKS.every((item) => checked.value[item]));

onMounted(async () => {
  try {
    entry.value = await useContractApi().prefill(planId);
  } catch (cause) {
    error.value = messageFrom(cause, '계약 정보를 불러오지 못했어요.');
  }
});

/** ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="[COACH_TIME.bankReservation]"
    brand
    base="3루"
  >
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="THIRD_BASE_STEPS" :current="3" />

      <h1 class="text-question text-ink-card">D-21 은행 예약</h1>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>

      <div v-else class="bg-surface-info rounded-field flex flex-col gap-1 p-3.5">
        <p class="text-caption2 text-ink-hero-body">확정된 은행</p>
        <p class="text-option text-primary-strong">{{ bank ?? '아직 확정된 은행이 없어요' }}</p>
        <p class="text-micro text-ink-hero-body">2루 상담 결과에서 가져왔어요</p>
      </div>

      <h2 class="text-body3 text-ink-hero font-bold">은행 예약</h2>

      <CheckItem v-for="item in CHECKS" :key="item" v-model="checked[item]">{{ item }}</CheckItem>

      <h2 class="text-body3 text-ink-hero font-bold">기금e든든 비대면 신청이라면</h2>

      <div class="bg-surface-info rounded-field flex flex-col gap-1.5 p-3.5">
        <p class="text-label2 text-primary-strong font-semibold">사전자산심사 함께 신청</p>
        <p class="text-caption2 text-ink-hero">• 적격 판정까지 1~5일 소요</p>
        <p class="text-caption2 text-ink-hero">• 유효기간 30일</p>
        <p class="text-caption2 text-ink-hero">
          • 잔금일 30일 전 신청 권장 (D-21 시점에 신청하면 딱 맞음)
        </p>
      </div>
    </div>

    <template #footer>
      <footer class="px-gutter-tight flex shrink-0 gap-2 pt-2.5 pb-cta-pad">
        <div class="w-28 shrink-0">
          <AppButton variant="white" @click="navigateTo(`/contract/${planId}/company-docs`)">
            이전
          </AppButton>
        </div>
        <AppButton
          variant="strong"
          :disabled="!allChecked"
          @click="navigateTo(`/contract/${planId}/docs`)"
        >
          다음
        </AppButton>
      </footer>
    </template>
  </StageShell>
</template>
