<script setup lang="ts">
import { useOpenBankingApi } from '~/api/openbanking';
import { currentPlan } from '~/utils/currentPlan';
import { messageFrom } from '~/utils/error';

/**
 * OB-4 연동 진행 (데모).
 *
 * 실연동은 금융결제원 인가 페이지를 거치지만(팝업 → 코드 → 토큰), 사업자 등록 전
 * 데모에서는 그 페이지를 쓸 수 없다. 그래서 연결은 백엔드 `mockConnect` 가 인가 없이
 * 즉시 세우고(계좌·요약은 샘플 데이터로 답한다), 이 화면은 **은행별로 연동되는 과정**을
 * 진행률로 동적으로 보여준다. 실제 백엔드 조회를 은행마다 부르는 게 아니라, 연결 한 번을
 * 세운 뒤 진행 느낌을 화면에서 만든다.
 *
 * 진행은 하나의 시계(`elapsed`)로 움직인다 — 진행률 바·완료 은행 수·현재 은행의 세부
 * 단계가 모두 이 값에서 계산돼 서로 어긋나지 않는다. 목 계좌 자체는 한 곳이지만, 여러
 * 은행을 순서대로 훑는 연출이 "오픈뱅킹으로 여기저기서 긁어온다"는 실제 경험에 더 가깝다 —
 * 은행 이름은 연출용이고 판정에 쓰이지 않는다.
 */
definePageMeta({ middleware: 'auth' });

const { mockConnect } = useOpenBankingApi();

/** 연출용 은행 목록. 실제 목 계좌와 무관하다 — 진행 느낌만 만든다. */
const BANKS = ['KB국민은행', '신한은행', '우리은행', '하나은행', 'NH농협은행'] as const;
/** 은행 한 곳을 처리하는 데 보여줄 시간. 은행당 3.5초, 다섯 곳이면 약 17초다. */
const PER_BANK_MS = 3500;
/** 한 은행 안에서 도는 세부 단계. 현재 은행의 진행 비율에 따라 바뀐다. */
const SUBSTEPS = ['계좌 목록 확인', '잔액 조회', '최근 3개월 입금 내역'] as const;
/** 진행 바를 부드럽게 움직이는 갱신 주기. */
const TICK_MS = 80;
const TOTAL_MS = BANKS.length * PER_BANK_MS;

/** 연동을 시작한 뒤 흐른 시간(ms). 모든 진행 표시가 이 값에서 나온다. */
const elapsed = ref(0);
const error = ref('');

const done = computed(() => elapsed.value >= TOTAL_MS);
/** 완료된 은행 수. 현재 처리 중인 은행은 이 값이 가리킨다. */
const cleared = computed(() => Math.min(BANKS.length, Math.floor(elapsed.value / PER_BANK_MS)));
/** 0~100. 바 너비와 퍼센트 표시에 함께 쓴다. */
const percent = computed(() => Math.min(100, Math.round((elapsed.value / TOTAL_MS) * 100)));

type Phase = 'waiting' | 'failed' | 'done';

const phase = computed<Phase>(() => {
  if (done.value) return 'done';
  if (error.value) return 'failed';
  return 'waiting';
});

const HEADING: Record<Phase, string> = {
  waiting: '은행 정보를\n가져오는 중이에요',
  failed: '은행 정보를\n가져오지 못했어요',
  done: '은행 정보를 다 가져왔어요',
};

const CAPTION: Record<Phase, string> = {
  waiting: '연결된 은행에서 잔액과 최근 입금 내역을 순서대로 확인하고 있어요',
  failed: '직접 입력해도 판정 정확도는 같아요',
  done: '이제 다음으로 넘어갈 수 있어요',
};

type BankState = 'done' | 'connecting' | 'waiting';

/** 실패 상태에서는 도는 점을 계속 돌리지 않는다. */
function stateOf(index: number): BankState {
  if (done.value || index < cleared.value) return 'done';
  if (index === cleared.value && phase.value === 'waiting') return 'connecting';
  return 'waiting';
}

const STATE_LABEL: Record<BankState, string> = {
  done: '완료',
  connecting: '연동 중',
  waiting: '대기',
};

/** 지금 연동 중인 은행이 밟고 있는 세부 단계. 은행 안 진행 비율로 고른다. */
const currentSubstep = computed(() => {
  const withinBank = (elapsed.value % PER_BANK_MS) / PER_BANK_MS;
  return SUBSTEPS[Math.min(SUBSTEPS.length - 1, Math.floor(withinBank * SUBSTEPS.length))];
});

let timer: ReturnType<typeof setInterval> | undefined;

function stopClock() {
  clearInterval(timer);
  timer = undefined;
}

/**
 * 연동이 막히면 안내 화면으로 보낸다.
 *
 * 연결 실패는 막힘이 아니라 값의 출처가 바뀌는 일이다 — 직접 입력해도 판정 정확도는
 * 같다. 계획이 없으면(가입 첫 바퀴는 아직 계획 전이다) 그 화면으로 갈 수 없어, 이
 * 화면이 오류와 다음 걸음을 함께 보여준다.
 */
async function giveUp(message: string) {
  stopClock();
  const planId = await currentPlan.resolve();
  if (!planId) {
    error.value = message;
    return;
  }
  await navigateTo(`/status/${planId}/openbanking-failed`, { replace: true });
}

async function start() {
  stopClock();
  error.value = '';
  elapsed.value = 0;
  // 연결은 인가 없이 즉시 세운다. 여기서 실패하면 진행을 시작하지 않는다.
  try {
    await mockConnect();
  } catch (cause) {
    await giveUp(messageFrom(cause, '연동을 시작하지 못했어요.'));
    return;
  }
  const startedAt = Date.now();
  timer = setInterval(() => {
    elapsed.value = Date.now() - startedAt;
    if (elapsed.value >= TOTAL_MS) {
      elapsed.value = TOTAL_MS;
      stopClock();
    }
  }, TICK_MS);
}

onMounted(start);
onUnmounted(stopClock);
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />
    <PageBar title="오픈뱅킹 연동" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 py-5">
      <h2 class="text-heading text-ink-hero whitespace-pre-line">{{ HEADING[phase] }}</h2>
      <p class="text-label2 text-ink-hero-body">{{ CAPTION[phase] }}</p>

      <!-- 전체 진행률. 하나의 시계에서 나와 아래 은행 목록과 어긋나지 않는다. -->
      <div v-if="phase !== 'failed'" class="flex flex-col gap-1.5">
        <div class="flex items-baseline justify-between">
          <span class="text-caption1 text-ink-hero font-bold">
            {{ cleared }}/{{ BANKS.length }}개 은행 연동
          </span>
          <span class="text-caption1 text-primary-strong font-bold">{{ percent }}%</span>
        </div>
        <div class="bg-canvas h-2 overflow-hidden rounded-full">
          <div
            class="bg-primary-strong h-full rounded-full transition-[width] duration-100 ease-linear"
            :style="{ width: `${percent}%` }"
          />
        </div>
      </div>

      <AppCard class="flex flex-col gap-3">
        <div v-for="(bank, index) in BANKS" :key="bank" class="flex items-center gap-2.5">
          <span
            class="grid size-5 shrink-0 place-items-center rounded-full"
            :class="
              {
                done: 'bg-primary-strong text-white',
                connecting: 'bg-surface-info text-primary-deep',
                waiting: 'bg-canvas text-ink-muted',
              }[stateOf(index)]
            "
            aria-hidden="true"
          >
            <AppIcon v-if="stateOf(index) === 'done'" name="check" class="size-3" />
            <span
              v-else-if="stateOf(index) === 'connecting'"
              class="border-primary-deep size-3 animate-spin rounded-full border-2 border-t-transparent"
            />
            <span v-else class="text-micro">{{ index + 1 }}</span>
          </span>

          <div class="flex flex-1 flex-col">
            <span class="text-caption1 text-ink-hero">{{ bank }}</span>
            <!-- 연동 중인 은행만 세부 단계를 흘려 보여준다 — 진행이 살아 있는 느낌. -->
            <span v-if="stateOf(index) === 'connecting'" class="text-micro text-ink-hero-body">
              {{ currentSubstep }}
            </span>
          </div>

          <span
            class="text-micro shrink-0"
            :class="stateOf(index) === 'done' ? 'text-primary-strong' : 'text-ink-muted'"
          >
            {{ STATE_LABEL[stateOf(index)] }}
          </span>
        </div>
      </AppCard>

      <div class="bg-canvas rounded-chip p-3">
        <p class="text-micro text-ink-hero-body">
          상세 거래 내역은 저장하지 않아요. 잔액과 최근 3개월 입금만 조회해 순자산·월 소득을
          계산해요
        </p>
      </div>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <footer class="px-gutter-tight flex shrink-0 flex-col gap-2 py-2.5">
      <AppButton v-if="phase === 'failed'" variant="strong" @click="start">다시 시도</AppButton>
      <AppButton
        v-else
        variant="strong"
        :disabled="!done"
        @click="navigateTo('/openbanking/complete')"
      >
        {{ done ? '다음' : '연동이 끝날 때까지 기다려주세요' }}
      </AppButton>

      <AppButton v-if="phase === 'failed'" variant="white" @click="navigateTo('/home')">
        직접 입력할게요
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
