<script setup lang="ts">
import { usePlanApi } from '~/api/plan';
import { usePropertyApi } from '~/api/property';
import {
  FIRST_MONTH_TASKS,
  OVERDUE_SURCHARGE,
  RIR_GRADE_LABEL,
  monthlyInterestOf,
  rirGrade,
} from '~/components/settle/rir';
import { formatKoreanMoney } from '~/utils/money';

/**
 * 홈 4-5 · 월간 정착 체크인.
 *
 * 매달 얼마가 나가는지 알아야 연체를 막는다. 첫 달만 잡아 두면 그다음은 쉽다.
 *
 * RIR 은 백엔드에 계산해 주는 곳이 없다(1루 진단이 RIR 을 안 쓴다). 확정한
 * 대출 조건과 저장된 입력이 다 있을 때만 여기서 센다 — 하나라도 없으면
 * 숫자를 지어내지 않고 무엇이 없는지를 말한다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const principal = ref<number | null>(null);
const rate = ref<number | null>(null);
const monthlyIncome = ref<number | null>(null);
const maintenanceFee = ref<number | null>(null);

const checked = ref<Record<string, boolean>>({});

const interest = computed(() => monthlyInterestOf(principal.value, rate.value));

/** 월 주거비 = 관리비 + 월 이자. 관리비를 모르면 주거비도 모른다. */
const housingCost = computed(() =>
  interest.value === null || maintenanceFee.value === null
    ? null
    : interest.value + maintenanceFee.value,
);

const rir = computed(() => {
  if (housingCost.value === null || !monthlyIncome.value) return null;
  return Math.round((housingCost.value / monthlyIncome.value) * 1000) / 10;
});

const grade = computed(() => (rir.value === null ? null : rirGrade(rir.value)));

const GRADE_TEXT = { safe: 'text-safe', caution: 'text-caution-deep', danger: 'text-danger-deep' };
const GRADE_FILL = { safe: 'bg-safe', caution: 'bg-caution-deep', danger: 'bg-danger-deep' };

/** 막대는 30% 를 가득 찬 것으로 본다. 그 위는 어차피 위험 구간이다. */
const fillPercent = computed(() => Math.min(100, Math.round(((rir.value ?? 0) / 30) * 100)));

/** 연체하면 금리에 4~5%p 가 붙고, 원금 전체에 걸린다. */
const overdue = computed(() => {
  if (!principal.value || !rate.value) return null;
  return {
    min: monthlyInterestOf(principal.value, rate.value + OVERDUE_SURCHARGE.withinThreeMonths),
    max: monthlyInterestOf(principal.value, rate.value + OVERDUE_SURCHARGE.overThreeMonths),
  };
});

onMounted(() => {
  usePropertyApi()
    .decision(planId)
    .then((found) => {
      principal.value = found.consultation?.approvedLimit ?? null;
      rate.value = found.consultation?.quotedRate ?? null;
    })
    .catch(() => {});

  usePlanApi()
    .input(planId)
    .then((input) => {
      monthlyIncome.value = input.monthlyIncome;
      maintenanceFee.value = input.maintenanceFee;
    })
    .catch(() => {});
});
</script>

<template>
  <PhoneFrame>
    <StageBar title="이번 달 상태" base="홈" @back="navigateTo(`/settle/${planId}`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3.5 py-4">
      <CoachTip>
        매달 얼마가 나가는지 알아야 연체를 막을 수 있어. 첫 달만 잡아두면 그다음은 쉬워
      </CoachTip>

      <div class="bg-surface border-line rounded-button flex flex-col gap-2 border p-4.5">
        <div class="flex items-center justify-between">
          <span class="text-caption-tight text-ink-hero-body font-normal">RIR (주거비 비중)</span>
          <span
            v-if="rir !== null && grade"
            class="text-card-title font-bold"
            :class="GRADE_TEXT[grade]"
          >
            {{ rir }}% {{ RIR_GRADE_LABEL[grade] }}
          </span>
          <span v-else class="text-card-title text-ink-muted font-bold">—</span>
        </div>

        <div class="bg-surface-brand h-3 w-full overflow-hidden rounded-full">
          <div
            v-if="grade"
            class="h-full rounded-full"
            :class="GRADE_FILL[grade]"
            :style="{ width: `${fillPercent}%` }"
          />
        </div>

        <p class="text-chip text-ink-meta font-normal">20% 안정 · 30% 위험</p>

        <p class="text-caption-tight text-ink-hero-body font-normal">
          <template v-if="rir !== null">
            월 이자 {{ formatKoreanMoney(interest) }} + 관리비
            {{ formatKoreanMoney(maintenanceFee) }} = {{ formatKoreanMoney(housingCost) }} (÷ 월소득
            {{ formatKoreanMoney(monthlyIncome) }})
          </template>
          <template v-else>
            확정한 대출 조건과 월 소득·관리비가 모두 있어야 셀 수 있어요. 아직 하나가 비어 있어요.
          </template>
        </p>
      </div>

      <h2 class="text-card-title text-ink-hero font-bold">첫 달에 할 일</h2>

      <CheckItem
        v-for="task in FIRST_MONTH_TASKS.slice(0, 4)"
        :key="task.title"
        v-model="checked[task.title]"
      >
        {{ task.title }}
      </CheckItem>

      <p class="bg-surface-brand rounded-chip text-micro text-ink-hero-body p-3">
        연체하면 대출금리에 {{ OVERDUE_SURCHARGE.withinThreeMonths }}~{{
          OVERDUE_SURCHARGE.overThreeMonths
        }}%p 가 붙어요.
        <template v-if="overdue">
          지금 조건이면 월 이자가 {{ formatKoreanMoney(overdue.min) }} ~
          {{ formatKoreanMoney(overdue.max) }} 까지 올라요.
        </template>
      </p>

      <DetailLink @open="navigateTo(`/settle/${planId}/checkin-detail`)">
        월간 정착 체크인 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight bg-surface flex shrink-0 flex-col gap-2 pt-2.5 pb-cta-pad">
      <!-- 고정지출을 저장할 API 도 화면도 아직 없다. 자리만 두고 잠가 둔다. -->
      <AppButton variant="strong" disabled>고정지출 등록하러 가기</AppButton>
      <p class="text-micro text-ink-muted text-center">고정지출 등록은 아직 준비 중이에요</p>
    </footer>
  </PhoneFrame>
</template>
