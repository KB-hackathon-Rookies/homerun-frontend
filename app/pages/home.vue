<script setup lang="ts">
import { useDashboardApi, type Dashboard, type PlanStage } from '~/api/dashboard';
import { usePlanApi } from '~/api/plan';
import { FEATURED_MODULES } from '~/components/coach/modules';
import { usePush } from '~/composables/usePush';
import { useAuthStore } from '~/stores/auth';
import { currentPlan } from '~/utils/currentPlan';
import { messageFrom, statusFrom } from '~/utils/error';
import { displayStage, laterStage, resumePath } from '~/utils/stage';

/**
 * 홈 대시보드. 시안 0-3 · 메인 1~5.
 *
 * 1루·2루·3루가 서로를 부르기만 하고 돌아올 곳이 없었다. 여기가 그 자리다.
 *
 * 화면은 하나고 상태에 따라 말이 바뀐다. 계획이 아직 없으면(미시작) 진행 카드
 * 대신 시작하기 버튼 하나만 서고, 나머지는 지금 무슨 단계인지 말한다.
 */
definePageMeta({ middleware: 'auth' });

const auth = useAuthStore();
const planId = ref<number | null>(null);
const dashboard = ref<Dashboard | null>(null);
const pending = ref(true);
const error = ref('');

const name = computed(() => auth.user?.name ?? '루키');
const stage = computed(() => displayStage(dashboard.value?.currentStage ?? 'FIRST'));

/** 계획이 아직 없는 상태. 시안의 "메인 1 · 미시작" 이다. */
const notStarted = computed(() => !pending.value && !planId.value);

/** 3루는 잔금일이 걸려 있어 남은 날부터 말한다. */
const onDeadline = computed(() => stage.value === 'THIRD');

/**
 * 인사말. 상태마다 다른 말을 한다(시안 메인 1~5).
 *
 * `[제목 뒷부분, 부제]` 다. 제목 앞은 언제나 "{이름}님, " 이라 따로 두지 않는다.
 *
 * **줄바꿈을 글에 박지 않는다.** 시안도 상자 폭(190px)에 맡겨 접는다 — 다섯
 * 화면의 인사말 상자가 전부 190×54 로 같다. 자리를 고정해 두면 이름이 길어질 때
 * 그 줄이 폭을 넘겨 세 줄로 흐르고, 아래 카드까지 밀린다.
 *
 * 한 덩어리가 중간에서 잘려 어색하면 그 구절만 줄바꿈 없는 공백(U+00A0)으로
 * 붙인다. 자리를 고정하지 않으면서 단어만 안 쪼개진다.
 */
const GREETING: Record<PlanStage | 'NONE', [string, string]> = {
  NONE: ['첫 독립을 시작해볼까요?', '독립 상황을 알려주면 코치가 순서를 잡아줄게요.'],
  BENCH: ['첫 독립을 시작해볼까요?', '독립 상황을 알려주면 코치가 순서를 잡아줄게요.'],
  FIRST: ['오늘도 첫 독립을 응원해요!', '1루 진단을 이어가 볼까요?'],
  SECOND: ['지금은 매물 검증 중이에요!', '현재 진행 상황을 확인해보세요.'],
  THIRD: ['잔금일까지 같이 챙겨봐요!', '3루 D-day 일정을 확인해보세요.'],
  HOME: ['정착 완료! 사후 관리 함께해요', '지금 챙길 사후 관리 항목을 확인해보세요.'],
};

const greetingKey = computed<PlanStage | 'NONE'>(() => (notStarted.value ? 'NONE' : stage.value));
const greeting = computed(() => `${name.value}님, ${GREETING[greetingKey.value][0]}`);
const subtitle = computed(() => GREETING[greetingKey.value][1]);

const CARD_TITLE: Record<string, string> = {
  FIRST: '1루 · 대출 진단 중',
  SECOND: '2루 · 매물 검증 중',
  THIRD: '3루 · 계약과 대출 실행 중',
  HOME: '홈 · 입주 준비 완료',
};

const CARD_DESCRIPTION: Record<string, string> = {
  FIRST: '받을 수 있는 대출과 한도를 계산하고 있어요',
  SECOND: '받을 수 있는 정책을 찾고 있어요',
  THIRD: '남은 일정을 순서대로 안내해드려요',
  HOME: '이사 뒤에 챙길 것만 남았어요',
};

/** 교육 카드 세 장의 색. 모듈이 들고 있는 `tone` 으로 고른다. */
const EDU_TONE = {
  contract: { card: 'bg-edu-contract', badge: 'bg-edu-contract-badge' },
  fraud: { card: 'bg-edu-fraud', badge: 'bg-edu-fraud-badge' },
  change: { card: 'bg-edu-change', badge: 'bg-edu-change-badge' },
} as const;

const eduTone = (tone?: keyof typeof EDU_TONE) => EDU_TONE[tone ?? 'contract'];

/**
 * 교육 카드 가로 스크롤에서 지금 보고 있는 장.
 *
 * **카드 위치가 아니라 스크롤 진행률로 정한다.** 카드가 화면보다 좁아서
 * 마지막 장은 왼쪽 끝에 설 만큼 밀 수가 없다 — 위치로 맞추면 끝까지 밀어도
 * 마지막 구슬에 불이 안 들어온다. 진행률로 나누면 장 수가 몇이든 처음과 끝이
 * 첫 구슬·끝 구슬에 정확히 대응한다.
 */
const eduTrack = ref<HTMLElement | null>(null);
const activeCard = ref(0);

function syncActiveCard() {
  const track = eduTrack.value;
  if (!track) return;

  const last = FEATURED_MODULES.length - 1;
  const scrollable = track.scrollWidth - track.clientWidth;
  if (scrollable <= 0 || last <= 0) {
    activeCard.value = 0;
    return;
  }

  activeCard.value = Math.round((track.scrollLeft / scrollable) * last);
}

/**
 * 최근 이슈.
 *
 * **소식 피드 API 가 없다.** 시안(메인 1)에 적힌 세 장을 그대로 고정해 둔 것이라
 * 살아 있는 소식이 아니다. 피드가 생기면 이 상수를 통째로 걷어낸다.
 */
const ISSUES = [
  {
    tag: '전세',
    title: '서울 아파트 전세 매물 1년 새 12.8% 감소',
    meta: '9월호 · 시장 · 매물 찾는 기간을 여유 있게',
  },
  {
    tag: '월세',
    title: '청년월세 지원 상시화 · 24개월 480만원',
    meta: '9월호 · 정책 · 복지로에서 언제든 신청',
  },
  {
    tag: '정책',
    title: '8.13 대책 · 청년 주거지원 3종 세트',
    meta: '2026.08.13 · 국토교통부 · KB Think',
  },
];

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

function resume() {
  const found = dashboard.value;
  if (!found || !planId.value) return;
  // 계획이 다음 단계로 넘어갔는데 마지막 방문 단계가 그 이전이면(예: 1루 완료 → 2루),
  // 완료된 단계로 되돌리지 않고 현재 단계로 이어간다.
  const target = laterStage(found.resume?.stage ?? found.currentStage, found.currentStage);
  navigateTo(resumePath(target, planId.value));
}

onMounted(async () => {
  if (!auth.user) {
    // 닉네임 하나 때문에 화면을 막지 않는다. 못 읽으면 "루키님" 으로 부른다.
    auth.fetchMe().catch(() => {});
  }

  /*
   * 토큰은 브라우저가 갱신하거나 폐기한다. 등록해 둔 것이 죽어 있으면 알림이
   * 조용히 안 온다 — 앱을 열 때마다 다시 보낸다.
   */
  push.resync();

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
  <PhoneFrame :coach-stage="dashboard?.currentStage">
    <!-- 대시보드는 경로로 루를 알 수 없다. 계획이 오면 그 단계를 코치 FAB 에 넘긴다. -->
    <div class="h-statusbar bg-surface shrink-0" />

    <BrandBar bordered />

    <!--
      `isolate` 로 이 안에서만 쌓임 순서를 따진다. 마스코트를 `-z-10` 으로 깔면
      바깥 배경은 그대로 두고 이 안의 내용 뒤로만 들어간다.
    -->
    <div class="px-gutter relative isolate flex flex-1 flex-col gap-4 pt-5 pb-20">
      <!--
        마스코트. 인사말 옆에 서서 아래로 흘러내린다(시안 메인 1~5).

        진행 카드·시작하기 버튼과 겹치는 자리라 **맨 뒤에 깐다**. 앞에 두면
        절대 배치라 뒤따르는 카드를 덮는다.
      -->
      <img
        src="/tiger/main.png"
        alt=""
        width="184"
        height="189"
        class="pointer-events-none absolute top-10.5 right-3.5 -z-10 w-46 select-none"
      />

      <!-- 글이 마스코트에 닿지 않게 오른쪽을 비운다. -->
      <div class="flex flex-col gap-1.5 pr-40 pb-19">
        <h1 class="text-hero text-ink-hero">{{ greeting }}</h1>
        <p class="text-caption-tight text-ink-hero-body">{{ subtitle }}</p>
      </div>

      <p v-if="pending && !notStarted" class="text-label2 text-ink-muted">
        진행 상황을 불러오는 중이에요…
      </p>
      <p v-else-if="error && !notStarted" class="text-label2 text-danger">{{ error }}</p>

      <!-- 미시작. 진행 카드 대신 시작하기 하나만 선다(시안 메인 1). -->
      <AppButton v-else-if="notStarted" variant="strong" @click="navigateTo('/prep')">
        시작하기
      </AppButton>

      <ProgressCard
        v-else-if="dashboard"
        :current="stage"
        :title="CARD_TITLE[stage] ?? ''"
        :description="cardDescription"
        @resume="resume"
      />

      <!-- 코치 교육. 루마다 코치가 알려주는 내용을 미리 본다. -->
      <section class="flex flex-col gap-3">
        <div class="flex items-center justify-between px-1 pt-2 pb-1">
          <h2 class="text-card-title text-ink-hero">코치 교육</h2>
          <button
            type="button"
            class="text-caption-tight text-ink-meta font-medium"
            @click="navigateTo('/coach')"
          >
            전체 보기 ›
          </button>
        </div>

        <div
          ref="eduTrack"
          class="scrollbar-hide flex snap-x snap-mandatory gap-2.5 overflow-x-auto"
          @scroll.passive="syncActiveCard"
        >
          <button
            v-for="module in FEATURED_MODULES"
            :key="module.id"
            type="button"
            class="rounded-button w-edu-card flex shrink-0 snap-start flex-col gap-1.5 px-3.5 py-3.5 text-left"
            :class="eduTone(module.tone).card"
            @click="navigateTo(`/coach/${module.id}`)"
          >
            <span class="flex items-center gap-1">
              <span
                class="rounded-pill text-chip text-on-brand px-2 py-0.5 font-bold"
                :class="eduTone(module.tone).badge"
              >
                코치 TIME
              </span>
              <span
                class="bg-edu-time rounded-pill text-chip text-edu-time-ink px-1.5 py-0.5 font-bold"
              >
                {{ module.minutes }}분
              </span>
            </span>

            <span class="text-row text-ink-card font-bold">{{ module.title }}</span>
            <span class="text-caption-tight text-ink-card-body font-medium">
              {{ module.featured }}
            </span>
          </button>
        </div>

        <!-- 카드가 몇 장인지 알려주는 표시. 넘김은 가로 스크롤이 한다. -->
        <div class="flex items-center justify-center gap-1.5">
          <span
            v-for="(module, index) in FEATURED_MODULES"
            :key="module.id"
            class="rounded-pill h-1.5"
            :class="index === activeCard ? 'bg-primary-strong w-4' : 'bg-track w-1.5'"
          />
        </div>
      </section>

      <!--
        설치 안내. 계획이 생겨 돌아올 이유가 있는 사람에게만 보인다 —
        첫 화면에서 바로 물으면 대부분 거절한다.
      -->
      <InstallCard v-if="planId && !notStarted" />

      <section class="flex flex-col gap-2">
        <div class="flex items-center justify-between px-1 pt-2 pb-1">
          <h2 class="text-section text-ink-hero">최근 이슈 · 9월호</h2>
          <span class="text-caption-tight text-ink-meta font-medium">더보기 ›</span>
        </div>

        <AppCard v-for="issue in ISSUES" :key="issue.title" class="flex flex-col gap-1.5">
          <span
            class="bg-surface-info rounded-chip-sm text-chip text-primary-strong self-start px-2 py-1"
          >
            {{ issue.tag }}
          </span>
          <p class="text-card-title text-ink-hero">{{ issue.title }}</p>
          <p class="text-micro text-ink-meta font-medium">{{ issue.meta }}</p>
        </AppCard>
      </section>
    </div>

    <!--
      AI 코치. 스크롤과 무관하게 보는 화면 바닥에 붙어 있어야 한다.

      `PhoneFrame` 이 `overflow-hidden` 이라 그 안에서는 `sticky` 가 듣지 않는다
      — 스크롤 컨테이너로 잡히는데 정작 스크롤은 문서가 한다. 그래서 뷰포트에
      고정하고, 화면 껍데기와 같은 폭·가운데 정렬을 다시 걸어 자리를 맞춘다.

      띠 자체는 클릭을 통과시키고 버튼만 받는다. 비활성이지만 흐리게 두지
      않는다 — 마스코트까지 옅어져 버튼이 투명해 보인다.
    -->
    <div
      class="max-w-screen pointer-events-none fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full justify-end px-4 pb-3"
    >
      <button
        type="button"
        class="bg-surface border-primary-strong rounded-pill shadow-fab pointer-events-auto flex size-13 items-center justify-center border-2"
        aria-label="AI 코치"
        disabled
      >
        <img
          src="/tiger/face-default.png"
          alt=""
          width="44"
          height="44"
          class="rounded-pill pointer-events-none size-11 select-none"
        />
      </button>
    </div>
  </PhoneFrame>
</template>
