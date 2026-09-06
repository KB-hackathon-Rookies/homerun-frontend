<script setup lang="ts">
import { useContractApi, type ContractEntry, type ContractSchedule } from '~/api/contract';
import { dday, formatLongDate, formatShortDate } from '~/utils/date';
import { messageFrom } from '~/utils/error';

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

const entry = ref<ContractEntry | null>(null);
const schedule = ref<ContractSchedule | null>(null);
const balanceDate = ref('');
const pending = ref(true);
const saving = ref(false);
const error = ref('');

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
  try {
    await useContractApi().saveBalanceDate(planId, entry.value, balanceDate.value);
    await load();
  } catch (cause) {
    error.value = messageFrom(cause, '일정을 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <PhoneFrame>
    <StageBar title="일정 만들기" base="3루" @back="navigateTo(`/contract/${planId}/fixed-date`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3.5 py-4">
      <CoachTip>잔금일만 알려주면 내가 날짜를 다 계산해서 알려줄게</CoachTip>

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

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-6">
      <AppButton
        variant="strong"
        :disabled="!balanceDate || pending || saving"
        @click="fresh ? navigateTo(`/contract/${planId}/company-docs`) : save()"
      >
        {{
          saving
            ? '저장 중…'
            : fresh
              ? '일정 저장하고 D-30 시작'
              : schedule?.milestones.length
                ? '고친 날짜로 다시 계산하기'
                : '일정 계산하기'
        }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
