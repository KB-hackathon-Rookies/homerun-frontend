<script setup lang="ts">
import { useDashboardApi, type Dashboard } from '~/api/dashboard';
import { useNotificationApi } from '~/api/notification';
import { usePlanApi } from '~/api/plan';
import { FEATURED_MODULES } from '~/components/coach/modules';
import { usePush } from '~/composables/usePush';
import { useAuthStore } from '~/stores/auth';
import { currentPlan } from '~/utils/currentPlan';
import { messageFrom, statusFrom } from '~/utils/error';
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

const name = computed(() => auth.user?.name ?? '루키');
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

const push = usePush();

/** 읽지 않은 알림 개수. 화면을 보는 중에 새 알림이 오면 다시 센다. */
async function countUnread() {
  try {
    unread.value = (await useNotificationApi().list(true)).length;
  } catch {
    // 개수를 못 세도 화면은 그대로다. 배지를 안 그리면 된다.
  }
}

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
  countUnread();

  /*
   * 토큰은 브라우저가 갱신하거나 폐기한다. 등록해 둔 것이 죽어 있으면 알림이
   * 조용히 안 온다 — 앱을 열 때마다 다시 보낸다.
   */
  push.resync();

  // 앱을 보고 있을 때는 OS 알림이 뜨지 않는다. 종 개수라도 바로 늘려 준다.
  push.onForeground(countUnread);

  await recoverPlan();
});

/** 계정에 걸린 planId 조회가 남의 것이라 막힌 상태인가. */
function isMissing(cause: unknown) {
  const status = statusFrom(cause);
  return status === 403 || status === 404;
}

/**
 * 볼 계획을 정한다.
 *
 * 1) 브라우저에 적어 둔 번호(캐시)로 먼저 대시보드를 읽는다.
 * 2) 캐시가 없거나(재로그인·새 기기) 남의 것이라 막히면(403·404) 낡은 값을
 *    버리고 `GET /plans/active` 로 서버에서 계획을 되살린다.
 * 3) 서버가 진행 중인 계획이 없다고 답할 때(404)만 '계획 없음' 으로 둔다.
 */
async function recoverPlan() {
  const cached = currentPlan.get();
  try {
    if (cached) {
      try {
        dashboard.value = await useDashboardApi().get(cached);
        planId.value = cached;
        return;
      } catch (cause) {
        if (!isMissing(cause)) {
          error.value = messageFrom(
            cause,
            '진행 상황을 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
          );
          return;
        }
        currentPlan.clear();
      }
    }

    try {
      const active = await usePlanApi().getActive();
      currentPlan.set(active.id);
      dashboard.value = await useDashboardApi().get(active.id);
      planId.value = active.id;
    } catch (cause) {
      // 진행 중인 계획이 정말 없으면 404(PLAN_022) 다 — 그때만 새로 시작 안내를 띄운다.
      if (statusFrom(cause) === 404) {
        planId.value = null;
      } else {
        error.value = messageFrom(
          cause,
          '진행 상황을 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
        );
      }
    }
  } finally {
    pending.value = false;
  }
}
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
      <div class="flex items-start justify-between gap-4">
        <div class="flex flex-col gap-1.5">
          <h1 class="text-hero text-ink-hero">{{ greeting }}</h1>
          <p class="text-caption-tight text-ink-hero-body">{{ subtitle }}</p>
        </div>

        <!-- 인사를 건네는 쪽이 코치라 인사말 옆에 세운다. 장식이라 대체텍스트를 비운다. -->
        <img src="/mascot.png" alt="" class="h-28 w-auto shrink-0" />
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

      <!--
        코치 교육. 루마다 코치가 알려주는 내용을 미리 본다. 카드를 누르면 그
        모듈로, 전체 보기는 허브로 간다. 시안에서 독립 도구 세 버튼(전부 비활성)이
        빠지고 이 자리로 바뀌었다.
      -->
      <section class="flex flex-col gap-2.5">
        <div class="flex items-center justify-between px-1 pt-2 pb-1">
          <h2 class="text-section text-ink-hero">코치 교육</h2>
          <button type="button" class="text-step text-ink-muted" @click="navigateTo('/coach')">
            전체 보기 ›
          </button>
        </div>

        <div class="flex gap-2.5 overflow-x-auto">
          <button
            v-for="module in FEATURED_MODULES"
            :key="module.id"
            type="button"
            class="bg-surface border-line rounded-field flex w-40 shrink-0 flex-col gap-2 border p-3.5 text-left"
            @click="navigateTo(`/coach/${module.id}`)"
          >
            <span class="text-micro text-primary-strong font-medium">
              코치 TIME · {{ module.minutes }}분
            </span>
            <span class="text-row text-ink-hero">{{ module.title }}</span>
            <span class="text-step text-ink-muted font-normal">{{ module.featured }}</span>
          </button>
        </div>
      </section>

      <!--
        설치 안내. 계획이 생겨 돌아올 이유가 있는 사람에게만 보인다 —
        첫 화면에서 바로 물으면 대부분 거절한다.
      -->
      <InstallCard v-if="planId" />

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
        <!-- 버튼에 aria-label 이 있으므로 이미지는 장식으로 둔다. 둘 다 읽히면 두 번 말한다. -->
        <img src="/mascot-mark.png" alt="" class="size-9" />
      </button>
    </div>

    <TabBar active="home" :plan-id="planId" />
  </PhoneFrame>
</template>
