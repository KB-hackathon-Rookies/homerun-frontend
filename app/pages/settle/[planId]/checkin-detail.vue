<script setup lang="ts">
import {
  FIRST_MONTH_TASKS,
  OVERDUE_SURCHARGE,
  RIR_BANDS,
  RIR_FORMULAS,
} from '~/components/settle/rir';

/**
 * 홈 4-5 상세 · 월간 정착 체크인.
 *
 * 지표를 어떻게 세는지 식을 그대로 보여준다. 숫자만 던지면 다음 달에 값이
 * 달라졌을 때 무엇 때문인지 못 짚는다.
 *
 * 연체 부분에 카드 한 장을 다 쓴다. 가산금리는 연체된 회차가 아니라
 * **원금 전체**에 붙어서, 한 번 밀리면 월 이자가 세 배가 된다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const checked = ref<Record<string, boolean>>({});

const BAND_TONE = { safe: 'safe', caution: 'caution', danger: 'danger' } as const;
const BAND_BG = {
  safe: 'bg-safe-soft',
  caution: 'bg-caution-deep-soft',
  danger: 'bg-danger-soft',
};
</script>

<template>
  <GuideFrame title="월간 정착 체크인 상세" @back="navigateTo(`/settle/${planId}/checkin`)">
    <h2 class="text-section text-ink-hero px-1 pt-2">첫 달에 할 일</h2>

    <AppCard class="flex flex-col gap-2">
      <CheckItem
        v-for="task in FIRST_MONTH_TASKS"
        :key="task.title"
        v-model="checked[task.title]"
        tone="filled"
      >
        {{ task.title }}
        <template v-if="task.note" #note>{{ task.note }}</template>
      </CheckItem>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">지표 보는 법</h2>

    <AppCard class="flex flex-col gap-2.5">
      <p class="text-row text-ink-hero">수식 3개</p>

      <div class="bg-surface-info rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p
          v-for="line in RIR_FORMULAS"
          :key="line"
          class="text-caption-tight text-ink-hero font-normal"
        >
          {{ line }}
        </p>
      </div>

      <p class="text-row text-ink-hero">RIR (주거비 부담률)</p>
      <p class="text-caption-tight text-ink-hero font-normal">RIR = 월 주거비 / 월 소득 × 100</p>

      <div
        v-for="band in RIR_BANDS"
        :key="band.grade"
        class="rounded-chip flex items-center gap-2.5 px-3 py-2.5"
        :class="BAND_BG[band.grade]"
      >
        <StatusBadge :tone="BAND_TONE[band.grade]">{{ band.range }}</StatusBadge>
        <span class="text-caption-tight text-ink-hero flex-1 font-semibold">{{ band.label }}</span>
      </div>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">연체하면 이자가 크게 붙어요</h2>

    <div class="bg-surface border-danger-deep rounded-field flex flex-col gap-2.5 border p-3.5">
      <p class="text-row text-danger-deep">가산금리 · 원금 전체에 부과</p>

      <div class="bg-surface-caution rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-caution-deep font-semibold">연체 기간별 가산</p>
        <p class="text-caption-tight text-ink-hero font-normal">
          • 3개월 이내 · 대출금리 + {{ OVERDUE_SURCHARGE.withinThreeMonths }}%p
        </p>
        <p class="text-caption-tight text-ink-hero font-normal">
          • 3개월 초과 · 대출금리 + {{ OVERDUE_SURCHARGE.overThreeMonths }}%p
        </p>
      </div>

      <div class="bg-surface border-line rounded-cta flex flex-col gap-1 border px-3 py-2.5">
        <p class="text-caption-tight text-ink-hero font-semibold">예방</p>
        <p class="text-caption-tight text-ink-hero font-normal">
          자동이체를 꼭 걸어두세요. 밀린 회차만이 아니라 원금 전체에 가산금리가 붙어요.
        </p>
      </div>
    </div>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/checkin`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
