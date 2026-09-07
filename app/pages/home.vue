<script setup lang="ts">
import { useDashboardApi, type Dashboard } from '~/api/dashboard';
import { useNotificationApi } from '~/api/notification';
import { currentPlan } from '~/utils/currentPlan';
import { messageFrom } from '~/utils/error';
import { displayStage, resumePath } from '~/utils/stage';

/**
 * 홈 대시보드.
 *
 * 1루·2루·3루가 서로를 부르기만 하고 돌아올 곳이 없었다. 여기가 그 자리다.
 *
 * 화면은 하나고 단계에 따라 말이 바뀐다. 3루처럼 마감이 걸린 단계는 인사말부터
 * D-day 이야기를 하고, 나머지는 지금 무슨 단계인지만 말한다.
 */
definePageMeta({ middleware: 'auth' });

const auth = useAuthStore();
const planId = ref<number | null>(null);
const dashboard = ref<Dashboard | null>(null);
const unread = ref(0);
const pending = ref(true);
const error = ref('');

const name = computed(() => auth.user?.nickname ?? '루키');
const stage = computed(() => displayStage(dashboard.value?.currentStage ?? 'FIRST'));

/** 3루는 잔금일이 걸려 있어 남은 날부터 말한다. */
const onDeadline = computed(() => stage.value === 'THIRD');

const greeting = computed(() =>
  onDeadline.value
    ? `${name.value}님, 잔금일까지 하루하루 챙기고 있어요!`
    : `${name.value}님, 오늘도 첫 독립을 응원해요!`,
);

const subtitle = computed(() =>
  onDeadline.value ? '3루 D-day 일정을 확인해보세요.' : '현재 진행 상황을 확인해보세요.',
);

const CARD_TITLE: Record<string, string> = {
  FIRST: '1루 · 내 조건 진단 중',
  SECOND: '2루 · 정책 탐색 중',
  THIRD: '3루 · 계약과 대출 실행 중',
  HOME: '홈 · 입주 준비 완료',
};

const CARD_DESCRIPTION: Record<string, string> = {
  FIRST: '받을 수 있는 조건부터 정리하고 있어요',
  SECOND: '받을 수 있는 정책을 찾고 있어요',
  THIRD: '남은 일정을 순서대로 안내해드려요',
  HOME: '이사 뒤에 챙길 것만 남았어요',
};

/** 가장 가까운 마감. 백엔드가 남은 날을 세어 주므로 여기서 다시 계산하지 않는다. */
const nearest = computed(() =>
  dashboard.value?.prioritizedTasks.find((task) => task.daysUntilDue !== null),
);

const cardDescription = computed(() => {
  const base = CARD_DESCRIPTION[stage.value] ?? '';
  const task = nearest.value;
  if (!onDeadline.value || !task || task.daysUntilDue === null) return base;

  const days = task.daysUntilDue;
  const dday = days === 0 ? 'D-day' : days > 0 ? `D-${days}` : `D+${-days}`;
  return `${task.deadlineLabel ?? task.taskName} ${dday} · ${base}`;
});

const TOOLS: { label: string; to: string | null }[] = [
  { label: '계약 체크', to: null },
  { label: '용어사전', to: null },
  { label: '금융 가이드', to: null },
];

/** 계획이 있어야 갈 수 있는 도구가 있다. 계획을 모르면 자리만 둔다. */
const tools = computed(() =>
  TOOLS.map((tool) => {
    if (!planId.value) return tool;
    if (tool.label === '계약 체크') return { ...tool, to: `/contract/${planId.value}/review` };
    if (tool.label === '금융 가이드') return { ...tool, to: `/contract/${planId.value}/documents` };
    return tool;
  }),
);

function resume() {
  const found = dashboard.value;
  if (!found || !planId.value) return;
  navigateTo(resumePath(found.resume?.stage ?? found.currentStage, planId.value));
}

onMounted(async () => {
  if (!auth.user) {
    // 닉네임 하나 때문에 화면을 막지 않는다. 못 읽으면 "루키님" 으로 부른다.
    auth.fetchMe().catch(() => {});
  }

  // 알림 개수도 마찬가지다. 없으면 배지를 안 그리면 된다.
  useNotificationApi()
    .list(true)
    .then((list) => (unread.value = list.length))
    .catch(() => {});

  planId.value = currentPlan.get();
  if (!planId.value) {
    pending.value = false;
    return;
  }

  try {
    dashboard.value = await useDashboardApi().get(planId.value);
  } catch (cause) {
    error.value = messageFrom(cause, '진행 상황을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar bg-surface shrink-0" />

    <header class="h-topbar-tall px-gutter bg-surface flex shrink-0 items-center justify-between">
      <span class="text-hero text-primary-strong">HomeRun</span>

      <button type="button" class="relative p-1" aria-label="알림">
        <AppIcon name="bell" class="text-ink-hero size-5" />
        <span
          v-if="unread"
          class="size-badge bg-danger-deep rounded-pill text-badge text-on-brand absolute top-0 right-0 flex items-center justify-center"
        >
          {{ unread }}
        </span>
      </button>
    </header>

    <div class="px-gutter flex flex-1 flex-col gap-4 pt-5 pb-25">
      <div class="flex flex-col gap-1.5">
        <h1 class="text-hero text-ink-hero">{{ greeting }}</h1>
        <p class="text-caption-tight text-ink-hero-body">{{ subtitle }}</p>
      </div>

      <p v-if="pending" class="text-label2 text-ink-muted">진행 상황을 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <AppCard v-else-if="!planId" radius="button">
        <p class="text-label2 text-ink-hero-body">
          아직 시작한 계획이 없어요. 독립 준비를 마치면 여기에서 진행 상황을 볼 수 있어요.
        </p>
        <button
          type="button"
          class="text-card-title text-primary-strong mt-3"
          @click="navigateTo('/prep')"
        >
          독립 준비 시작하기 →
        </button>
      </AppCard>

      <ProgressCard
        v-else-if="dashboard"
        :current="stage"
        :title="CARD_TITLE[stage] ?? ''"
        :description="cardDescription"
        @resume="resume"
      />

      <div class="flex flex-col gap-2.5">
        <h2 class="text-section text-ink-hero px-1 pt-2 pb-1">독립 도구</h2>
        <div class="flex gap-2.5">
          <ToolCard v-for="tool in tools" :key="tool.label" :label="tool.label" :to="tool.to" />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between px-1 pt-2 pb-1">
          <h2 class="text-section text-ink-hero">최근 이슈</h2>
        </div>

        <!--
          소식 피드 API 가 아직 없다. 시안의 카드 세 장은 예시 문구라서
          그대로 박아 두면 없는 소식을 지어낸 화면이 된다. 자리만 비워 둔다.
        -->
        <AppCard>
          <p class="text-label2 text-ink-muted">전해드릴 소식이 준비되면 여기에 쌓여요.</p>
        </AppCard>
      </div>

      <!--
        AI 코치. 갈 화면이 아직 없어 눌리지 않게 둔다.
        스크롤을 내려도 탭바 위에 붙어 있어야 해서 sticky 로 띄우고,
        음수 여백으로 자리를 차지하지 않게 한다.
      -->
      <button
        type="button"
        class="size-fab bottom-tabbar bg-primary-strong rounded-pill -mb-fab sticky z-10 flex items-center justify-center self-end disabled:opacity-40"
        aria-label="AI 코치"
        disabled
      >
        <AppIcon name="bolt" class="text-on-brand size-6" />
      </button>
    </div>

    <TabBar active="home" :plan-id="planId" />
  </PhoneFrame>
</template>
