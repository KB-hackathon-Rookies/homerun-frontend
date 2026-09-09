<script setup lang="ts">
import { useDashboardApi, type Dashboard } from '~/api/dashboard';
import { usePropertyApi, type PropertyDecision } from '~/api/property';
import { useSettlementApi, type LoanAccount, type SettlementDashboard } from '~/api/settlement';
import { PRODUCT_LABEL } from '~/components/contract/labels';
import { COACH_TIME } from '~/components/home/coachSheets';
import type { BadgeTone } from '~/components/settle/StatusBadge.vue';
import { messageFrom, statusFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';
import { SETTLE_TOPICS, TASK_TOPIC, ddayLabel, settlePath, urgencyOf } from '~/utils/settle';

/**
 * 4루 · 정착과 사후관리.
 *
 * 앞의 세 루는 끝이 있는데 여기는 없다. 대출을 다 갚거나 이 집을 떠날 때까지
 * 매달 돌아오는 자리라서, 화면도 "지금 해야 할 일" 을 앞에 두고 나머지는
 * 아래에 펼쳐 둔다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const dashboard = ref<Dashboard | null>(null);
const decision = ref<PropertyDecision | null>(null);
/**
 * 확정 조건 조회가 **실패**했는가.
 *
 * 못 읽은 것과 없는 것은 다르다. 전에는 둘을 구분하지 않아서, 조회가 실패하면
 * 확정 조건을 멀쩡히 넣어 둔 사람에게도 "확정한 대출 조건이 없어요" 가 떴다.
 */
const decisionFailed = ref(false);
const settlement = ref<SettlementDashboard | null>(null);
/**
 * 등록된 실행 대출. 4루 계산의 뿌리다 — 없으면 체크인·금리인하요구권·
 * 사후자산심사가 통째로 빈다. 그래서 정착 첫 화면이 이걸 먼저 챙긴다.
 */
const loan = ref<LoanAccount | null>(null);
const loanChecked = ref(false);
const pending = ref(true);
const error = ref('');
const coachOpen = ref(false);

/** 아직 등록 전인가. 확인이 끝나기 전엔 없다고 단정하지 않는다. */
const needsLoan = computed(() => loanChecked.value && !loan.value);

/** 실제 전입 완료일을 기준으로 백엔드가 계산한 정착 기간이다. */
const settledDays = computed(() => settlement.value?.daysSinceIndependence ?? null);

const productLabel = computed(() => {
  const product = decision.value?.consultation?.loanProduct;
  if (product === 'YOUTH_BEOTIMMOK') return PRODUCT_LABEL.FUND_YOUTH;
  if (product === 'GENERAL_BEOTIMMOK') return PRODUCT_LABEL.FUND_GENERAL;
  if (product === 'BANK_LOAN') return PRODUCT_LABEL.BANK;
  return null;
});

/** 홈 관문의 할 일만 추린다. 앞 루에서 안 끝낸 것이 섞이면 여기 화면이 아니다. */
const todos = computed(() =>
  (dashboard.value?.prioritizedTasks ?? [])
    .filter((task) => task.stepCode === 'HOME_SETTLEMENT' && task.status !== 'DONE')
    .map((task) => ({
      key: task.taskCode,
      title: task.taskName,
      pill: ddayLabel(task.daysUntilDue) ?? task.deadlineLabel ?? '수시',
      tone: urgencyOf(task.daysUntilDue) as BadgeTone,
      to: settlePath(TASK_TOPIC[task.taskCode] ?? '', planId),
    })),
);

/**
 * 이번 달 이자.
 *
 * 등록된 실행 대출이 있으면 서버가 센 값을 그대로 쓴다. 없을 때만 확정 상담
 * 조건으로 추정하고, 그것도 없으면 계산하지 않는다.
 */
const monthlyInterest = computed(() => {
  if (loan.value) return loan.value.monthlyInterest;
  const found = decision.value?.consultation;
  if (!found?.approvedLimit || !found.quotedRate) return null;
  return Math.round((found.approvedLimit * found.quotedRate) / 100 / 12);
});

const TOOLS = ['계약 체크', '용어사전', '금융 가이드'];

onMounted(async () => {
  try {
    [dashboard.value, settlement.value] = await Promise.all([
      useDashboardApi().get(planId),
      useSettlementApi().dashboard(planId),
    ]);
  } catch (cause) {
    error.value = messageFrom(cause, '정착 현황을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }

  // 확정 조건은 곁가지다. 못 읽어도 할 일 목록은 남아야 한다.
  usePropertyApi()
    .decision(planId)
    .then((found) => (decision.value = found))
    .catch(() => (decisionFailed.value = true));

  // 등록 전이면 404 다. 다른 실패는 "없다" 가 아니라 "모른다" 라, 이때는
  // 등록 안내를 띄우지 않는다 -- 이미 넣은 사람에게 또 넣으라고 하면 안 된다.
  useSettlementApi()
    .loanAccount(planId)
    .then((found) => {
      loan.value = found;
      loanChecked.value = true;
    })
    .catch((cause) => {
      if (statusFrom(cause) === 404) loanChecked.value = true;
    });
});
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="[COACH_TIME.settlementHome]"
    :coach-above-footer="false"
    brand
    base="홈"
  >
    <div class="px-gutter-tight flex flex-1 flex-col gap-3.5 py-4">
      <p v-if="pending" class="text-label2 text-ink-muted">정착 현황을 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <template v-else>
        <div class="bg-primary-strong rounded-button flex flex-col gap-1.5 p-4">
          <p class="text-caption-tight text-on-brand font-semibold">
            정착 관리 중{{ settledDays !== null ? ` · D+${settledDays}일` : '' }}
          </p>
          <p class="text-metric text-on-brand">
            {{ productLabel ? `${productLabel} 대출 실행 완료` : '입주를 마쳤어요' }}
          </p>
          <p class="text-caption-tight text-on-brand font-normal">
            {{
              todos.length
                ? `${todos[0]!.title}이 남아있어요`
                : `정착 진행률 ${settlement?.progressPercent ?? 0}%`
            }}
          </p>
        </div>

        <!--
          지표 두 장. 이자는 확정한 한도·금리로 계산하지만 잔여자금은 생활비를
          모른다. 0 원으로 채우면 계산이 끝난 것처럼 보여서 "—" 로 둔다.
        -->
        <div class="flex gap-2">
          <MetricCard label="월 잔여자금" value="—" note="고정지출을 등록하면 계산해드려요" />
          <MetricCard
            label="이번 달 이자"
            :value="monthlyInterest === null ? '—' : formatKoreanMoney(monthlyInterest)"
            :note="
              loan
                ? '등록한 실행 대출 기준'
                : monthlyInterest !== null
                  ? '확정 조건 기준 추정'
                  : decisionFailed
                    ? '확정 조건을 불러오지 못했어요'
                    : '확정한 대출 조건이 없어요'
            "
          />
        </div>

        <!--
          4루 계산이 전부 실행 대출 한 건에 달려 있다. 등록 전에는 할 일보다
          이걸 먼저 보여야 다음 화면들이 비어 있는 이유를 알 수 있다.
        -->
        <AppCard v-if="needsLoan" radius="button" class="flex flex-col gap-2">
          <p class="text-card-title text-ink-hero font-bold">실행된 대출을 등록해주세요</p>
          <p class="text-caption-tight text-ink-hero-body font-normal">
            월 이자·주거비, 금리인하요구권, 사후자산심사가 모두 이 정보로 계산돼요. 상담 때 값은
            미리 채워둘게요
          </p>
          <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/loan-account`)">
            실행 대출 등록하기
          </AppButton>
        </AppCard>

        <!-- 등록한 뒤에도 조건은 바뀐다(연장·금리인하). 고치러 갈 길을 남긴다. -->
        <button
          v-else-if="loan"
          type="button"
          class="text-caption-tight text-primary-strong self-start font-semibold"
          @click="navigateTo(`/settle/${planId}/loan-account`)"
        >
          실행 대출 정보 수정하기 →
        </button>

        <h2 class="text-card-title text-ink-hero font-bold">지금 해야 할 일</h2>

        <TodoRow
          v-for="todo in todos"
          :key="todo.key"
          :pill="todo.pill"
          :tone="todo.tone"
          :title="todo.title"
          :to="todo.to"
        />
        <AppCard v-if="!todos.length" radius="button">
          <p class="text-label2 text-ink-muted">
            지금 급한 일은 없어요. 아래에서 필요한 걸 골라보세요.
          </p>
        </AppCard>

        <h2 class="text-card-title text-ink-hero font-bold">챙길 것들</h2>

        <div class="flex flex-col gap-2">
          <TodoRow
            v-for="topic in SETTLE_TOPICS"
            :key="topic.code"
            pill="안내"
            tone="info"
            :title="topic.title"
            :to="settlePath(topic.code, planId)"
          />
        </div>

        <h2 class="text-card-title text-ink-hero font-bold">독립 도구</h2>

        <div class="flex gap-2">
          <span
            v-for="tool in TOOLS"
            :key="tool"
            class="bg-surface-brand rounded-field text-caption-tight text-ink-hero flex flex-1 items-center justify-center py-3.5 font-semibold"
          >
            {{ tool }}
          </span>
        </div>
      </template>
    </div>

    <!--
      아래 탭바가 하단 안전영역 여백(`pb-tabbar-pad`)을 맡으므로 푸터는 `pb-cta-pad` 를
      쓰지 않는다. 둘 다 주면 여백이 겹쳐 버튼이 붕 뜬다.
    -->
    <template #footer>
      <footer class="px-gutter-tight bg-surface flex shrink-0 pt-2.5 pb-2.5">
        <AppButton
          variant="strong"
          :disabled="!settlePath('checkin', planId)"
          @click="navigateTo(settlePath('checkin', planId)!)"
        >
          이번 달 관리 시작하기
        </AppButton>
      </footer>
    </template>
  </StageShell>
</template>
