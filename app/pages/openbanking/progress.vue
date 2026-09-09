<script setup lang="ts">
import { useOpenBankingApi } from '~/api/openbanking';
import { currentPlan } from '~/utils/currentPlan';
import { messageFrom } from '~/utils/error';

/**
 * OB-4 조회 진행.
 *
 * 연동은 금융결제원 인가 페이지에서 이뤄진다. 그 페이지는 우리 화면이 아니라
 * 언제 끝났는지 알 수 없으므로, 새 창으로 띄워 두고 이 화면에서 `connection` 을
 * 되풀이해 물어본다. 연결이 확인되면 자산·소득 요약까지 받아 두고 버튼을 연다.
 *
 * 인가 URL 은 `connect` 로 받아 와야 하니 창을 여는 시점은 이미 await 을 지난
 * 뒤다 — 호출 스택에 사용자 제스처가 없어 브라우저가 팝업을 막는다(사파리는
 * 언제나, 크롬은 직전 클릭의 transient activation 이 끝나면). 그래서 열렸는지를
 * 반드시 확인하고, 막혔으면 사용자가 누를 버튼을 내준다.
 *
 * 다 끝나기 전에 넘어가면 다음 화면에 보여줄 값이 없다. 그래서 대기 중에는
 * 버튼을 잠근다. 다만 잠긴 버튼 하나만 남는 상태는 없어야 한다 — 실패했을
 * 때는 앞으로 나가는 길을 언제나 함께 내준다.
 */
definePageMeta({ middleware: 'auth' });

/** 인가 페이지에서 계좌를 고르는 데 걸리는 시간을 생각하면 2초면 충분하다. */
const POLL_INTERVAL_MS = 2000;
/** 3분이 넘으면 사용자가 창을 닫았거나 중간에 그만둔 것으로 본다. */
const POLL_TIMEOUT_MS = 180_000;

const { connect, connection, financialSummary } = useOpenBankingApi();

const done = ref(false);
/** 인가가 끝나 계좌가 연결됐다. 요약을 받기 전 단계라 `done` 과 따로 둔다. */
const connected = ref(false);
const error = ref('');
/** 팝업이 막혔을 때 사용자가 직접 열 수 있도록 인가 URL 을 들고 있는다. */
const authUrl = ref('');
const blocked = ref(false);

type Phase = 'waiting' | 'blocked' | 'failed' | 'done';

const phase = computed<Phase>(() => {
  if (done.value) return 'done';
  if (error.value) return 'failed';
  if (blocked.value) return 'blocked';
  return 'waiting';
});

const HEADING: Record<Phase, string> = {
  waiting: '은행 정보를\n가져오는 중이에요',
  blocked: '은행 인증 창이\n열리지 않았어요',
  failed: '은행 정보를\n가져오지 못했어요',
  done: '은행 정보를 다 가져왔어요',
};

const CAPTION: Record<Phase, string> = {
  waiting: '보통 30초~1분 정도 걸려요. 화면을 닫지 말고 잠시만 기다려주세요',
  blocked: '브라우저가 새 창을 막았어요. 아래 버튼으로 열어주세요',
  failed: '직접 입력해도 판정 정확도는 같아요',
  done: '이제 다음으로 넘어갈 수 있어요',
};

/**
 * 진행 목록.
 *
 * 피그마는 은행 이름을 줄마다 적어 두었지만(`KB국민은행 · 완료`), 어느 은행을 몇 개
 * 고를지는 금융결제원 인가 페이지에서 사용자가 정한다 — 우리는 알지 못한다. 그래서
 * 은행 이름 대신 실제로 아는 세 걸음을 보여준다. 지어낸 이름을 띄우느니 진행이 어디
 * 와 있는지를 정확히 말하는 편이 낫다.
 */
const STEPS = [
  { title: '은행 인증', detail: '인가 창에서 연결할 계좌를 골라주세요' },
  { title: '계좌·거래 조회', detail: '잔액 · 최근 3개월 입금 내역' },
  { title: '순자산 · 월 소득 계산', detail: '조회가 끝나면 자동으로 계산돼요' },
] as const;

/**
 * 몇 번째 걸음까지 끝났는가.
 *
 * 인가가 끝났는지(`connected`)와 요약까지 받았는지(`done`) 둘만 실제로 알 수 있다.
 * 조회와 계산은 요약 한 번에 함께 일어나므로 같이 움직인다.
 */
const cleared = computed(() => {
  if (done.value) return STEPS.length;
  return connected.value ? 1 : 0;
});

type StepState = 'done' | 'current' | 'waiting';

/** 실패·차단 상태에서는 진행 중인 걸음이 없다. 도는 점을 계속 돌리지 않는다. */
function stateOf(index: number): StepState {
  if (index < cleared.value) return 'done';
  if (index === cleared.value && phase.value === 'waiting') return 'current';
  return 'waiting';
}

const STEP_LABEL: Record<StepState, string> = {
  done: '완료',
  current: '진행 중',
  waiting: '대기',
};

let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * 인가 창을 열고, 열렸는지 돌려준다.
 *
 * `noopener` 를 세 번째 인자로 넘기면 명세상 반환값이 **항상** `null` 이라
 * 차단을 구분할 수 없다. 그래서 핸들을 받아 두고 `opener` 를 직접 끊는다 —
 * 새 창이 우리 창을 건드리지 못하는 것은 그대로다.
 */
function openAuthorization() {
  if (!authUrl.value) return false;
  const opened = window.open(authUrl.value, '_blank');
  if (!opened) return false;
  opened.opener = null;
  return true;
}

/** 버튼에서 부른다. 클릭 스택 안이라 브라우저가 막지 않는다. */
function reopen() {
  blocked.value = !openAuthorization();
}

/**
 * 연동이 막히면 안내 화면으로 보낸다.
 *
 * 연결 실패는 막힘이 아니라 값의 출처가 바뀌는 일이다 — 직접 입력해도 판정
 * 정확도는 같다. 그 말을 해 주는 화면이 따로 있다.
 *
 * 계획이 없으면(가입 첫 바퀴는 아직 계획을 만들기 전이다) 그 화면으로 갈 수
 * 없다. 그때는 이 화면이 오류와 다음 걸음을 함께 보여준다.
 */
async function giveUp(message: string) {
  clearTimeout(timer);
  const planId = await currentPlan.resolve();
  if (!planId) {
    error.value = message;
    return;
  }
  await navigateTo(`/status/${planId}/openbanking-failed`, { replace: true });
}

async function start() {
  clearTimeout(timer);
  error.value = '';
  blocked.value = false;
  connected.value = false;
  try {
    authUrl.value = await connect();
  } catch (cause) {
    await giveUp(messageFrom(cause, '연동을 시작하지 못했어요.'));
    return;
  }
  // 막혔더라도 기다리기는 시작한다. 사용자가 버튼으로 창을 열면 그대로 이어진다.
  blocked.value = !openAuthorization();
  poll(Date.now());
}

onMounted(start);

onUnmounted(() => clearTimeout(timer));

async function poll(startedAt: number) {
  try {
    if ((await connection()).connected) {
      // 요약을 받기 전에 먼저 표시한다. 인가는 끝났는데 진행 목록이 첫 줄에
      // 멈춰 있으면 아직 아무것도 안 된 것처럼 보인다.
      connected.value = true;
      await financialSummary();
      done.value = true;
      return;
    }
  } catch (cause) {
    await giveUp(messageFrom(cause, '연동 상태를 확인하지 못했어요.'));
    return;
  }

  if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
    await giveUp('연동이 끝나지 않았어요. 다시 시도해주세요.');
    return;
  }
  timer = setTimeout(() => poll(startedAt), POLL_INTERVAL_MS);
}
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />
    <PageBar title="오픈뱅킹 연동" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 py-5">
      <h2 class="text-heading text-ink-hero whitespace-pre-line">{{ HEADING[phase] }}</h2>
      <p class="text-label2 text-ink-hero-body">{{ CAPTION[phase] }}</p>

      <AppCard class="flex flex-col gap-3">
        <div v-for="(step, index) in STEPS" :key="step.title" class="flex items-start gap-2.5">
          <span
            class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full"
            :class="
              {
                done: 'bg-primary-strong text-white',
                current: 'bg-surface-info text-primary-deep',
                waiting: 'bg-canvas text-ink-muted',
              }[stateOf(index)]
            "
            aria-hidden="true"
          >
            <AppIcon v-if="stateOf(index) === 'done'" name="check" class="size-3" />
            <span v-else class="text-micro">{{ index + 1 }}</span>
          </span>

          <div class="flex flex-1 flex-col">
            <span class="text-caption1 text-ink-hero">{{ step.title }}</span>
            <span class="text-micro text-ink-hero-body">{{ step.detail }}</span>
          </div>

          <span class="text-micro text-ink-muted shrink-0">{{ STEP_LABEL[stateOf(index)] }}</span>
        </div>
      </AppCard>

      <div class="bg-canvas rounded-chip p-3">
        <p class="text-micro text-ink-hero-body">
          {{
            phase === 'blocked'
              ? '팝업 차단을 풀지 않아도 괜찮아요. 아래 버튼으로 열면 그대로 이어집니다'
              : '실패한 은행은 나중에 다시 시도할 수 있어요. 마이페이지에서 재연동 가능합니다'
          }}
        </p>
      </div>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <footer class="px-gutter-tight flex shrink-0 flex-col gap-2 py-2.5">
      <AppButton v-if="phase === 'blocked'" variant="strong" @click="reopen">
        은행 인증 창 열기
      </AppButton>
      <AppButton v-else-if="phase === 'failed'" variant="strong" @click="start">
        다시 시도
      </AppButton>
      <AppButton
        v-else
        variant="strong"
        :disabled="!done"
        @click="navigateTo('/openbanking/complete')"
      >
        {{ done ? '다음' : '모든 조회 완료까지 기다려주세요' }}
      </AppButton>

      <AppButton
        v-if="phase === 'blocked' || phase === 'failed'"
        variant="white"
        @click="navigateTo('/home')"
      >
        직접 입력할게요
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
