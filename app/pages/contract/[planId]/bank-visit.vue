<script setup lang="ts">
import { useContractApi, type ContractEntry } from '~/api/contract';
import { messageFrom } from '~/utils/error';

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

onMounted(async () => {
  try {
    entry.value = await useContractApi().prefill(planId);
  } catch (cause) {
    error.value = messageFrom(cause, '계약 정보를 불러오지 못했어요.');
  }
});
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="D-21 은행 예약"
      base="3루"
      @back="navigateTo(`/contract/${planId}/company-docs`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>2루 사전상담에서 확정된 은행으로 가면 돼. 사전상담 받았던 그 지점이 좋아</CoachTip>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>

      <div v-else class="bg-surface-info rounded-field flex flex-col gap-1 p-3.5">
        <p class="text-caption2 text-ink-hero-body">확정된 은행</p>
        <p class="text-option text-primary-strong">{{ bank ?? '아직 확정된 은행이 없어요' }}</p>
        <p class="text-micro text-ink-hero-body">2루 상담 결과에서 가져왔어요</p>
      </div>

      <h2 class="text-body3 text-ink-hero font-bold">은행 예약</h2>

      <CheckItem v-for="item in CHECKS" :key="item" v-model="checked[item]">{{ item }}</CheckItem>

      <p class="bg-warning-strong rounded-chip text-micro p-3 font-bold text-white">
        ⚠️ 신청 후에는 은행을 바꿀 수 없으니 지금 확정하세요
      </p>

      <h2 class="text-body3 text-ink-hero font-bold">기금e든든 비대면 신청이라면</h2>

      <div class="bg-surface-info rounded-field flex flex-col gap-1.5 p-3.5">
        <p class="text-label2 text-primary-strong font-semibold">사전자산심사 함께 신청</p>
        <p class="text-caption2 text-ink-hero">• 적격 판정까지 1~5일 소요</p>
        <p class="text-caption2 text-ink-hero">• 유효기간 30일</p>
        <p class="text-caption2 text-ink-hero">
          • 잔금일 30일 전 신청 권장 (D-21 시점에 신청하면 딱 맞음)
        </p>
      </div>

      <DetailLink @open="navigateTo(`/contract/${planId}/docs`)">
        다음 단계 · D-14 서류 일괄 발급
      </DetailLink>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/docs`)">
        방문 예약 완료
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
