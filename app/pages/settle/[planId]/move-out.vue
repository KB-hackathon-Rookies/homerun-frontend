<script setup lang="ts">
import { MOVE_OUT_RETURNS, MOVE_OUT_STEPS } from '~/components/settle/lifecycle';

/**
 * 홈 4-10 · 퇴거 준비.
 *
 * 보증금을 받아 대출을 갚는 흐름인데, **그 돈이 내 손을 거치지 않는다.**
 * 질권이 걸려 있어 임대인이 은행에 직접 보낸다. 이걸 모르고 전액을 받으면
 * 그대로 연체가 된다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const checked = ref<Record<string, boolean>>({});
</script>

<template>
  <PhoneFrame>
    <StageBar title="퇴거 준비" base="홈" @back="navigateTo(`/settle/${planId}`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>보증금 받고 대출 갚는 흐름이야. 중간에 꼬이면 곤란해져</CoachTip>

      <h2 class="text-card-title text-ink-hero font-bold">퇴거 순서</h2>

      <div
        v-for="step in MOVE_OUT_STEPS"
        :key="step.when"
        class="bg-surface border-line rounded-cta flex flex-col gap-0.5 border p-3"
      >
        <p class="text-step text-primary-strong font-bold">{{ step.when }}</p>
        <p class="text-caption-tight text-ink-hero font-normal">{{ step.task }}</p>
      </div>

      <div class="bg-surface border-danger-deep rounded-field flex flex-col gap-1 border p-3.5">
        <p class="text-row text-danger-deep">보증금은 내가 못 받아요</p>
        <p class="text-micro text-ink-hero-body">
          질권이 설정돼 있어 임대인이 은행에 직접 송금해요. 착오로 전액을 받았다면 지체 없이
          반환하세요
        </p>
      </div>

      <h2 class="text-card-title text-ink-hero font-bold">놓치지 말 것</h2>

      <CheckItem
        v-for="item in MOVE_OUT_RETURNS.slice(0, 4)"
        :key="item.title"
        v-model="checked[item.title]"
      >
        {{ item.title }}
      </CheckItem>

      <DetailLink @open="navigateTo(`/settle/${planId}/move-out-detail`)">
        퇴거 흐름 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight bg-surface flex shrink-0 pt-2.5 pb-6">
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/move-out-detail`)">
        퇴거 준비 시작
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
