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
import { HOME_STEPS } from '~/components/home/steps';

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
/** 대출이 아직 등록되지 않았는가(404). 에러가 아니라 다음에 할 일이다. */
const needsLoan = ref(false);
/** 확정 조건 조회가 실패했는가. 못 읽은 것을 "안 넣었다" 로 말하지 않기 위해 따로 센다. */
const decisionFailed = ref(false);

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
    .catch(() => (decisionFailed.value = true));

  useSettlementApi()
    .cashFlow(planId)
    .then((found) => {
      summary.value = found;
    })
    .catch((cause) => {
      // 대출 미등록이면 404 -- 에러가 아니라 "아직 값이 없음" 이다. 빈 화면으로
      // 두면 뭘 해야 할지 알 수 없어서, 등록 화면으로 가는 길을 보여준다.
      if (statusFrom(cause) === 404) {
        needsLoan.value = true;
      } else {
        error.value = messageFrom(
          cause,
          '정착 지표를 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
        );
      }
    })
    .finally(() => {
      pending.value = false;
    });
});
</script>

<template>
  <StageShell brand base="홈">
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="HOME_STEPS" :current="4" />

      <p class="text-caption1 text-ink-label font-medium">홈 · 사후 관리</p>

      <h1 class="text-question text-ink-card">이번 달 상태</h1>

      <!--
        대출을 아직 안 넣었으면 셀 수 있는 게 없다. 빈 화면 대신 무엇이 없고
        어디로 가면 되는지를 말한다.
      -->
      <div v-if="needsLoan" class="bg-surface-info rounded-field flex flex-col gap-2 p-4">
        <p class="text-card-title text-primary-strong font-bold">대출 정보를 먼저 등록해주세요</p>
        <p class="text-step text-ink-hero-body font-normal">
          실행된 대출을 넣어야 월 이자·주거비·RIR 을 계산할 수 있어요
        </p>
        <button
          type="button"
          class="bg-surface rounded-chip text-label2 text-primary-strong self-start px-3.5 py-2.5 font-semibold"
          @click="navigateTo(`/settle/${planId}/loan-account`)"
        >
          실행 대출 등록하러 가기 →
        </button>
      </div>

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
          <template v-else-if="needsLoan">
            등록된 실행 대출이 없어요. 위에서 대출을 먼저 등록해주세요.
          </template>
          <template v-else-if="decisionFailed">
            확정한 대출 조건을 불러오지 못했어요. 값이 없는 게 아니라 지금 읽지 못한 거예요.
          </template>
          <template v-else>
            확정한 대출 조건과 월 소득·관리비가 모두 있어야 셀 수 있어요. 아직 하나가 비어 있어요.
          </template>
        </p>
      </div>

      <h2 class="text-card-title text-ink-hero font-bold">첫 달에 할 일</h2>

      <!--
        부제까지 같이 보여준다. "고정지출 등록" 만으로는 무엇을 넣는 자리인지
        모르고, 안 넣으면 연체 알림이 안 돌아간다는 말이 본 화면에 없었다.
      -->
      <CheckItem
        v-for="task in FIRST_MONTH_TASKS.slice(0, 4)"
        :key="task.title"
        v-model="checked[task.title]"
      >
        {{ task.title }}
        <template v-if="task.note" #note>{{ task.note }}</template>
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

    <template #footer>
      <footer class="px-gutter-tight bg-surface flex shrink-0 flex-col gap-2 pt-2.5 pb-cta-pad">
        <!--
        관리비가 주거비의 절반을 가른다. 등록 화면(`expenses`)이 이미 있는데
        여기서 잠겨 있어 아무도 닿지 못했다.
      -->
        <div class="flex gap-2.5">
          <div class="w-29 shrink-0">
            <AppButton variant="white" @click="navigateTo(`/settle/${planId}`)">이전</AppButton>
          </div>
          <div class="flex-1">
            <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/expenses`)">
              고정지출 등록
            </AppButton>
          </div>
        </div>
        <p class="text-micro text-ink-muted text-center">
          관리비를 넣으면 주거비와 RIR 이 더 정확해져요
        </p>
      </footer>
    </template>
  </StageShell>
</template>
