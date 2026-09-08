<script setup lang="ts">
import { usePropertyApi } from '~/api/property';
import { useSettlementApi, type CashFlowSummary } from '~/api/settlement';
import {
  FIRST_MONTH_TASKS,
  OVERDUE_SURCHARGE,
  RIR_GRADE_LABEL,
  monthlyInterestOf,
  rirGrade,
} from '~/components/settle/rir';
import { messageFrom, statusFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';

/**
 * 홈 4-5 · 월간 정착 체크인.
 *
 * 매달 얼마가 나가는지 알아야 연체를 막는다. 첫 달만 잡아 두면 그다음은 쉽다.
 *
 * 월 이자·주거비·월 소득·관리비 같은 정착 지표는 백엔드 현금흐름 종합
 * (`/settlement/cash-flow`, BR-28)이 계산한 값을 그대로 받는다. 대출이 등록돼
 * 있어야 계산되므로, 없으면(404) 숫자를 지어내지 않고 무엇이 없는지를 말한다.
 *
 * RIR 만은 백엔드에 계산해 주는 곳이 없어(1루 진단이 RIR 을 안 쓴다) 위 지표로
 * 화면에서 센다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const principal = ref<number | null>(null);
const rate = ref<number | null>(null);

/** 정착 지표. 대출이 등록돼 있어야 서버가 계산해 준다. */
const summary = ref<CashFlowSummary | null>(null);
const pending = ref(true);
const error = ref('');

const checked = ref<Record<string, boolean>>({});

/** 월 이자·주거비·월 소득·관리비는 서버가 센 값을 그대로 쓴다. */
const interest = computed(() => summary.value?.metrics.monthlyInterest ?? null);
const housingCost = computed(() => summary.value?.metrics.housingCost ?? null);
const monthlyIncome = computed(() => summary.value?.monthlyIncome ?? null);
const maintenanceFee = computed(() => summary.value?.managementFee ?? null);

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
  // 연체 시 이자 폭을 세려면 확정 대출 조건(원금·금리)이 필요하다. 서버 지표에는
  // 금리가 없어 이 조회는 그대로 둔다.
  usePropertyApi()
    .decision(planId)
    .then((found) => {
      principal.value = found.consultation?.approvedLimit ?? null;
      rate.value = found.consultation?.quotedRate ?? null;
    })
    .catch(() => {});

  useSettlementApi()
    .cashFlow(planId)
    .then((found) => {
      summary.value = found;
    })
    .catch((cause) => {
      // 대출 미등록이면 404 -- 에러가 아니라 "아직 값이 없음" 으로 두고 빈 상태를 보인다.
      if (statusFrom(cause) !== 404) {
        error.value = messageFrom(cause, '정착 지표를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      }
    })
    .finally(() => {
      pending.value = false;
    });
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
          <template v-if="pending">정착 지표를 불러오는 중이에요…</template>
          <span v-else-if="error" class="text-danger">{{ error }}</span>
          <template v-else-if="rir !== null">
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
