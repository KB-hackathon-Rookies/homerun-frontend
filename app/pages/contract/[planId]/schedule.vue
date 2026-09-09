<script setup lang="ts">
import { useContractApi, type ContractEntry, type ContractSchedule } from '~/api/contract';
import { dday, formatLongDate, formatShortDate } from '~/utils/date';
import { usePush } from '~/composables/usePush';
import { messageFrom } from '~/utils/error';
import { THIRD_BASE_STEPS } from '~/components/contract/steps';
import { COACH_TIME } from '~/components/contract/coachSheets';

/**
 * 3루 4 · 일정 만들기.
 *
 * 잔금일 하나만 받으면 나머지 날짜가 다 나온다. **계산은 백엔드가 한다** —
 * 상품·담보·신청방법·주택유형에 따라 갈리고 절대 마감까지 걸려서, 규칙이
 * 두 군데 있으면 반드시 어긋난다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const push = usePush();

const entry = ref<ContractEntry | null>(null);
const schedule = ref<ContractSchedule | null>(null);
const balanceDate = ref('');
const pending = ref(true);
const saving = ref(false);
const error = ref('');
const pushNotice = ref('');

/** 저장된 일정이 지금 화면의 날짜로 계산된 것인가. 날짜를 고치면 어긋난다. */
const fresh = computed(
  () => !!schedule.value?.milestones.length && schedule.value.balanceDate === balanceDate.value,
);

const load = async () => {
  const { schedule: fetchSchedule } = useContractApi();
  try {
    schedule.value = await fetchSchedule(planId);
    if (schedule.value.balanceDate) balanceDate.value = schedule.value.balanceDate;
  } catch {
    // 잔금일을 아직 안 넣었으면 일정이 없다. 그건 오류가 아니다.
    schedule.value = null;
  }
};

onMounted(async () => {
  try {
    entry.value = await useContractApi().prefill(planId);
    await load();
  } catch (cause) {
    error.value = messageFrom(cause, '계약 정보를 불러오지 못했어요.');
  } finally {
    pending.value = false;
  }
});

async function save() {
  if (!balanceDate.value || !entry.value || saving.value) return;

  saving.value = true;
  error.value = '';
  pushNotice.value = '';
  try {
    await useContractApi().saveBalanceDate(planId, balanceDate.value);
    await load();
  } catch (cause) {
    error.value = messageFrom(cause, '일정을 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}

/** D-30을 실제로 시작할 때 알림 권한을 받고, 결과를 숨기지 않는다. */
async function start() {
  // 한 번 실패한 뒤에도 일정 진행은 막지 않는다. 안내를 읽은 사용자는 다음 클릭으로 이어 간다.
  if (pushNotice.value) {
    await navigateTo(`/contract/${planId}/company-docs`);
    return;
  }

  const enabled = await push.enable();
  if (enabled) {
    await navigateTo(`/contract/${planId}/company-docs`);
    return;
  }

  if (push.permission.value === 'denied') {
    pushNotice.value = '알림이 차단되어 있어요. 브라우저 사이트 설정에서 알림을 허용해주세요.';
  } else if (push.permission.value === 'granted') {
    pushNotice.value = '알림은 허용됐지만 기기 등록에 실패했어요. 잠시 후 다시 시도해주세요.';
  } else if (push.permission.value === 'unsupported') {
    pushNotice.value = '이 브라우저에서는 푸시 알림을 받을 수 없어요.';
  } else {
    pushNotice.value = '알림 권한을 허용하지 않았어요. 설정에서 언제든 다시 켤 수 있어요.';
  }
}

/** ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="[COACH_TIME.schedulePlanning]"
    brand
    base="3루"
  >
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="THIRD_BASE_STEPS" :current="1" />

      <p class="text-caption1 text-ink-label font-medium">3루 · 일정</p>
      <h1 class="text-question text-ink-card">일정 만들기</h1>

      <AppCard class="flex flex-col gap-2">
        <p class="text-label2 text-ink-hero font-semibold">잔금 예정일</p>
        <input
          v-model="balanceDate"
          type="date"
          class="bg-surface-brand rounded-chip text-body3 text-ink-hero h-11 px-3 font-semibold outline-none"
        />
        <p v-if="balanceDate" class="text-caption2 text-ink-hero-body">
          {{ formatLongDate(balanceDate) }}
        </p>
      </AppCard>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
      <p
        v-else-if="pushNotice"
        class="bg-badge-warning rounded-chip text-caption2 text-ink-hero p-3"
      >
        {{ pushNotice }}
      </p>
      <p v-else-if="pending" class="text-label2 text-ink-muted">계약 정보를 불러오는 중이에요…</p>

      <template v-if="schedule?.milestones.length">
        <h2 class="text-body3 text-ink-hero font-bold">자동 계산된 일정</h2>

        <AppCard class="flex flex-col gap-1.5">
          <div
            v-for="milestone in schedule.milestones"
            :key="milestone.code"
            class="flex items-center gap-2.5 p-1.5"
          >
            <span
              class="rounded-pill text-micro w-11 shrink-0 py-1 text-center font-bold"
              :class="
                milestone.blocking
                  ? 'bg-primary-strong text-white'
                  : 'bg-surface-brand text-ink-hero-body'
              "
            >
              {{ schedule.balanceDate ? dday(milestone.dueDate, schedule.balanceDate) : '—' }}
            </span>
            <span class="text-caption2 text-ink-hero-body w-16 shrink-0">
              {{ formatShortDate(milestone.dueDate) }}
            </span>
            <span
              class="text-caption2 text-ink-hero flex-1"
              :class="milestone.blocking ? 'font-semibold' : ''"
            >
              {{ milestone.label }}
            </span>
          </div>
        </AppCard>

        <p
          v-for="warning in schedule.warnings"
          :key="warning"
          class="bg-badge-warning rounded-chip text-caption2 text-ink-hero p-3"
        >
          {{ warning }}
        </p>

        <DetailLink @open="navigateTo(`/contract/${planId}/schedule-detail`)">
          입력값·D-day 표·사전자산심사 상세보기
        </DetailLink>
      </template>
    </div>

    <template #footer>
      <footer class="px-gutter-tight flex shrink-0 gap-2 pt-2.5 pb-cta-pad">
        <div class="w-28 shrink-0">
          <AppButton variant="white" @click="navigateTo(`/contract/${planId}/fixed-date`)">
            이전
          </AppButton>
        </div>
        <AppButton
          variant="strong"
          :disabled="!balanceDate || pending || saving"
          @click="fresh ? start() : save()"
        >
          {{
            saving
              ? '저장 중…'
              : fresh
                ? pushNotice
                  ? '알림 없이 D-30 시작'
                  : '알림 켜고 D-30 시작'
                : schedule?.milestones.length
                  ? '고친 날짜로 다시 계산하기'
                  : '일정 계산하기'
          }}
        </AppButton>
      </footer>
    </template>
  </StageShell>
</template>
