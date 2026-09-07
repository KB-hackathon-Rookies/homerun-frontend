<script setup lang="ts">
import { usePropertyApi } from '~/api/property';
import { MOVE_OUT_RETURNS, MOVE_OUT_STEPS } from '~/components/settle/lifecycle';
import { formatKoreanMoney } from '~/utils/money';

/**
 * 홈 4-10 상세 · 퇴거 흐름.
 *
 * 핵심은 돈의 흐름이다. 보증금은 임대인 → 은행으로 먼저 가고, 남는 것만
 * 나에게 온다. 내 몫이 얼마인지는 확정한 보증금과 대출금으로 센다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const deposit = ref<number | null>(null);
const loan = ref<number | null>(null);

const checked = ref<Record<string, boolean>>({});

/** 임대인이 은행에 갚고 남는 돈이 내 몫이다. 둘 다 알아야 셀 수 있다. */
const mine = computed(() =>
  deposit.value === null || loan.value === null ? null : deposit.value - loan.value,
);

const STEP_TONE = { info: 'info', caution: 'caution', danger: 'danger', safe: 'safe' } as const;

onMounted(() => {
  usePropertyApi()
    .decision(planId)
    .then((found) => {
      deposit.value = found.property?.deposit ?? null;
      loan.value = found.consultation?.approvedLimit ?? null;
    })
    .catch(() => {});
});
</script>

<template>
  <GuideFrame title="퇴거 흐름 상세" @back="navigateTo(`/settle/${planId}/move-out`)">
    <h2 class="text-section text-ink-hero px-1 pt-2">시점별 할 일</h2>

    <AppCard class="flex flex-col gap-0 p-2.5">
      <div
        v-for="(step, index) in MOVE_OUT_STEPS"
        :key="step.when"
        class="flex items-center gap-2.5 px-2.5 py-3"
        :class="index ? 'border-line-soft border-t' : ''"
      >
        <StatusBadge
          :tone="STEP_TONE[step.tone]"
          :fill="step.tone === 'caution' || step.tone === 'danger' ? 'solid' : 'soft'"
        >
          {{ step.when }}
        </StatusBadge>
        <span class="text-caption-tight text-ink-hero flex-1 font-semibold">{{ step.task }}</span>
      </div>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">돈의 흐름 · 이게 핵심</h2>

    <div class="bg-surface border-danger-deep rounded-field flex flex-col gap-2.5 border p-3.5">
      <p class="text-row text-danger-deep">보증금은 내가 못 받아요</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        질권이 설정돼 있어서 임대인이 은행에 직접 보내야 해요.
      </p>

      <div v-if="mine !== null" class="bg-surface-info rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-primary-strong font-semibold">
          내 조건 · 보증금 {{ formatKoreanMoney(deposit) }}, 대출 {{ formatKoreanMoney(loan) }}
        </p>
        <p class="text-caption-tight text-ink-hero font-normal">
          임대인 → 은행 · {{ formatKoreanMoney(loan) }} (대출 상환)
        </p>
        <p class="text-caption-tight text-ink-hero font-normal">
          임대인 → 나 · {{ formatKoreanMoney(mine) }} (내 몫)
        </p>
      </div>

      <div class="bg-surface-caution rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-caution-deep font-semibold">착오로 전액 받았다면</p>
        <p class="text-caption-tight text-ink-hero font-normal">
          지체 없이 은행에 반환하세요. 그대로 두면 연체로 처리돼요.
        </p>
      </div>
    </div>

    <h2 class="text-section text-ink-hero px-1 pt-2">대출을 이어서 쓰고 싶다면</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-caption-tight text-ink-hero font-normal">
        새 집으로 옮기면서 유지할 수 있어요.
      </p>
      <p class="text-caption-tight text-ink-hero font-normal">• 기존 대출을 상환하고 새로 신청</p>
      <p class="text-caption-tight text-ink-hero font-normal">• 또는 임차목적물 변경으로 처리</p>
      <p class="text-step text-ink-meta font-normal">
        은행마다 처리 방식이 달라요. 이사 계획이 서면 바로 문의하세요.
      </p>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">놓치지 말 것 · 돌아오는 돈들</h2>

    <AppCard class="flex flex-col gap-2">
      <CheckItem
        v-for="item in MOVE_OUT_RETURNS"
        :key="item.title"
        v-model="checked[item.title]"
        tone="filled"
      >
        {{ item.title }}
        <template #note>{{ item.note }}</template>
      </CheckItem>

      <div class="bg-surface-info rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-primary-strong font-semibold">장기수선충당금이 뭔가요?</p>
        <p class="text-caption-tight text-ink-hero font-normal">
          원래 집주인이 낼 돈인데 관리비에 섞여 나와요. 이사 나갈 때 그동안 낸 금액을 돌려받을 수
          있어요.
        </p>
      </div>
    </AppCard>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/move-out`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
