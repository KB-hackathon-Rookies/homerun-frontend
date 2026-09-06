<script setup lang="ts">
import { useContractApi, type ContractEntry, type ContractSchedule } from '~/api/contract';
import {
  APPLICATION_LABEL,
  COLLATERAL_LABEL,
  HOUSE_LABEL,
  PRODUCT_LABEL,
} from '~/components/contract/labels';
import { dday, formatDotDate, formatShortDate } from '~/utils/date';
import { messageFrom } from '~/utils/error';

/**
 * 3루 4 · 일정 상세.
 *
 * 무엇을 근거로 이 날짜가 나왔는지 보여준다. 일정이 틀렸다고 느낄 때
 * 입력값부터 확인할 수 있어야 한다.
 *
 * 절대 마감에 화면 절반을 쓴다. **이 날짜를 넘기면 이 계약으로는 저리
 * 정책자금을 다시는 못 받는다.**
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const entry = ref<ContractEntry | null>(null);
const schedule = ref<ContractSchedule | null>(null);
const error = ref('');

const inputs = computed(() => {
  const found = schedule.value;
  if (!found) return [];

  return [
    { label: '잔금 예정일', value: found.balanceDate ? formatDotDate(found.balanceDate) : '—' },
    {
      label: '확정된 상품',
      value: found.loanProductKind ? PRODUCT_LABEL[found.loanProductKind] : '—',
    },
    {
      label: '확정된 은행',
      value: entry.value?.bankName
        ? `${entry.value.bankName}${entry.value.branchName ? ` · ${entry.value.branchName}` : ''}`
        : '—',
    },
    {
      label: '담보',
      value: found.collateralMethod ? COLLATERAL_LABEL[found.collateralMethod] : '—',
    },
    {
      label: '주택 유형',
      value: found.houseType ? (HOUSE_LABEL[found.houseType] ?? found.houseType) : '—',
    },
    {
      label: '신청 방식',
      value: found.applicationMethod ? APPLICATION_LABEL[found.applicationMethod] : '—',
    },
  ];
});

onMounted(async () => {
  const { prefill, schedule: fetchSchedule } = useContractApi();
  try {
    [entry.value, schedule.value] = await Promise.all([prefill(planId), fetchSchedule(planId)]);
  } catch (cause) {
    error.value = messageFrom(cause, '일정을 불러오지 못했어요.');
  }
});
</script>

<template>
  <GuideFrame title="일정 만들기 상세" @back="navigateTo(`/contract/${planId}/schedule`)">
    <p v-if="error" class="text-label2 text-danger">{{ error }}</p>

    <template v-else-if="schedule">
      <h2 class="text-option text-ink-hero px-1 pt-2">일정 계산에 필요한 값</h2>

      <AppCard v-for="row in inputs" :key="row.label" class="flex flex-col gap-1.5 px-3.5 py-3">
        <p class="text-micro text-ink-muted font-medium">{{ row.label }}</p>
        <p class="text-body3 text-ink-hero font-semibold">{{ row.value }}</p>
      </AppCard>

      <h2 class="text-option text-ink-hero px-1 pt-2">자동 계산된 일정</h2>

      <AppCard class="flex flex-col gap-1 p-2.5">
        <div
          v-for="milestone in schedule.milestones"
          :key="milestone.code"
          class="border-line-soft flex items-center gap-2 border-b p-2.5 last:border-b-0"
        >
          <span
            class="rounded-chip text-micro w-11 shrink-0 py-0.5 text-center font-semibold"
            :class="
              milestone.blocking
                ? 'bg-primary-strong text-white'
                : 'bg-surface-info text-primary-strong'
            "
          >
            {{ schedule.balanceDate ? dday(milestone.dueDate, schedule.balanceDate) : '—' }}
          </span>
          <span class="text-label2 text-ink-hero flex-1 font-semibold">{{ milestone.label }}</span>
          <span class="text-caption2 text-ink-muted shrink-0 font-medium">
            {{ formatShortDate(milestone.dueDate) }}
          </span>
        </div>
      </AppCard>

      <div
        v-if="schedule.applicationDeadline"
        class="bg-badge-warning rounded-field flex flex-col gap-3 p-4"
      >
        <span
          class="bg-surface rounded-chip text-micro text-warning-strong self-start px-2 py-0.5 font-semibold"
        >
          청년 버팀목 · 일반 버팀목 대출만 해당
        </span>
        <p class="text-body2 text-warning-strong font-semibold">
          절대 마감 · {{ formatDotDate(schedule.applicationDeadline) }}
        </p>
        <p class="text-caption2 text-ink-hero">
          이 계약으로 정책자금 대출을 받을 수 있는 마지막 날짜예요. 이 날짜 넘기면 이 계약으로는
          저리 정책자금을 다시는 못 받아요.
        </p>

        <div class="bg-surface rounded-chip flex flex-col gap-1 px-3.5 py-3">
          <p class="text-caption2 text-ink-hero font-semibold">계산 방식</p>
          <p class="text-caption2 text-ink-hero">잔금일과 전입일 중 빠른 쪽 + 3개월</p>
        </div>

        <div class="bg-surface rounded-chip flex flex-col gap-1 px-3.5 py-3">
          <p class="text-caption2 text-ink-hero font-semibold">왜 이 규정이 있냐면</p>
          <p class="text-caption2 text-ink-hero">
            정책자금은 "새로 계약해서 이사 들어가는 사람"을 지원하는 취지라, 이미 오래 살고 있는
            집에 소급 지원하지 않아요.
          </p>
        </div>

        <div class="bg-surface rounded-chip flex flex-col gap-1 px-3.5 py-3">
          <p class="text-caption2 text-ink-hero font-semibold">놓치면 이렇게 돼요</p>
          <p class="text-caption2 text-ink-hero">• 이 계약으로는 청년·일반 버팀목 신청 불가</p>
          <p class="text-caption2 text-ink-hero">
            • 은행 자체 전세대출로 갈아탈 수는 있지만 금리 훨씬 높음
          </p>
          <p class="text-caption2 text-ink-hero">• 청년 이자 지원 같은 부가 혜택도 함께 놓침</p>
        </div>

        <div class="bg-surface-info rounded-chip flex flex-col gap-1 px-3.5 py-3">
          <p class="text-caption2 text-primary-strong font-semibold">실무 팁</p>
          <p class="text-caption2 text-ink-hero">
            D-30(회사 서류 요청)에 안 움직이면 절대 마감을 넘길 위험이 커져요. 한 은행에서 거절되면
            다른 은행 심사에 또 2~3주가 필요하기 때문에, 잔금일 30일 전에는 대출 신청까지 가 있어야
            안전해요.
          </p>
        </div>
      </div>

      <h2 class="text-option text-ink-hero px-1 pt-2">일정 여유 · 왜 30일이 필요한가</h2>

      <AppCard class="flex flex-col gap-1.5">
        <p class="text-label2 text-ink-hero font-semibold">심사 여유</p>
        <p class="text-caption2 text-ink-hero">• 대출 심사에 2~3주 소요</p>
        <p class="text-caption2 text-ink-hero">• 거절되면 다른 은행 재신청, 또 2~3주</p>
        <p class="text-caption2 text-ink-hero">
          • 잔금일까지 30일 미만이면 압축 일정을 별도로 안내해요.
        </p>
      </AppCard>

      <div class="bg-surface-info rounded-field flex flex-col gap-1.5 p-3.5">
        <p class="text-label2 text-primary-strong font-semibold">기금e든든 사전자산 심사</p>
        <p class="text-caption2 text-ink-hero">
          유효기간 30일. 너무 일찍 하면 다시 받아야 하고, 늦으면 잔금일을 못 맞춰요. 잔금일 30일 전
          신청 권장.
        </p>
      </div>
    </template>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/schedule`)">
        일정 화면으로
      </AppButton>
    </template>
  </GuideFrame>
</template>
