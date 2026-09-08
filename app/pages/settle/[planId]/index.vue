<script setup lang="ts">
import { useDashboardApi, type Dashboard } from '~/api/dashboard';
import { usePropertyApi, type PropertyDecision } from '~/api/property';
import { useSettlementApi, type SettlementDashboard } from '~/api/settlement';
import { PRODUCT_LABEL } from '~/components/contract/labels';
import type { BadgeTone } from '~/components/settle/StatusBadge.vue';
import { messageFrom } from '~/utils/error';
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
const settlement = ref<SettlementDashboard | null>(null);
const pending = ref(true);
const error = ref('');

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

/** 이자는 확정한 대출 조건에서만 나온다. 한도나 금리를 못 들었으면 계산하지 않는다. */
const monthlyInterest = computed(() => {
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
    .catch(() => {});
});
</script>

<template>
  <PhoneFrame>
    <StageBar title="홈" base="홈" @back="navigateTo('/home')" />

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
            :note="monthlyInterest === null ? '확정한 대출 조건이 없어요' : '확정 조건 기준 추정'"
          />
        </div>

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

    <footer class="px-gutter-tight bg-surface flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton
        variant="strong"
        :disabled="!settlePath('checkin', planId)"
        @click="navigateTo(settlePath('checkin', planId)!)"
      >
        이번 달 관리 시작하기
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
