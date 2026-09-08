<script setup lang="ts">
import { HELP_DESKS, UNRETURNED_STEPS } from '~/components/settle/lifecycle';

/**
 * 대응 · 보증금 미반환.
 *
 * 맨 위 경고가 이 화면의 전부다. **새 집으로 전입신고를 하면 이 집의
 * 대항력과 우선변제권이 사라진다.** 순서를 모르고 먼저 옮기면 돌려받을
 * 근거를 스스로 없애는 셈이다.
 *
 * 반환보증에 들어 뒀다면 2단계에서 끝난다 — 보증기관이 대신 준다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
</script>

<template>
  <StageShell title="보증금 미반환 대응" base="홈" @back="navigateTo(`/settle/${planId}`)">

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <div class="bg-surface border-danger-deep rounded-field flex flex-col gap-1 border p-4">
        <p class="text-stage text-danger-deep font-bold">절대 전입신고를 빼지 마세요</p>
        <p class="text-caption-tight text-ink-hero font-semibold">
          새 집으로 옮기면 대항력·우선변제권이 사라져요. 임차권등기명령이 먼저예요
        </p>
      </div>

      <h2 class="text-card-title text-ink-hero font-bold">단계별 대응</h2>

      <div
        v-for="step in UNRETURNED_STEPS"
        :key="step.order"
        class="bg-surface border-line rounded-cta flex flex-col gap-0.5 border p-3"
      >
        <p class="text-caption-tight text-danger-deep font-bold">
          {{ step.order }}. {{ step.title }}
        </p>
        <p class="text-step text-ink-hero-body font-normal">{{ step.note }}</p>
      </div>

      <div class="bg-surface-info rounded-field flex flex-col gap-1 p-3.5">
        <p class="text-caption-tight text-primary-strong font-bold">
          반환보증에 가입했으면 2단계에서 끝나요
        </p>
        <p class="text-micro text-ink-hero-body">
          보증기관이 대신 지급해줘요. 이래서 반환보증이 중요한 거예요
        </p>
      </div>

      <div class="bg-surface-brand rounded-chip flex flex-col gap-1 p-3">
        <p class="text-caption-tight text-ink-hero font-bold">도움받을 곳</p>
        <p v-for="desk in HELP_DESKS" :key="desk.name" class="text-micro text-ink-hero-body">
          · {{ desk.name }} {{ desk.tel }}
        </p>
      </div>

      <DetailLink @open="navigateTo(`/settle/${planId}/deposit-unreturned-detail`)">
        미반환 대응 상세보기
      </DetailLink>
    </div>

    <template #footer>
<footer class="px-gutter-tight bg-surface flex shrink-0 gap-2.5 pt-2.5 pb-cta-pad">
      <div class="w-29 shrink-0">
        <AppButton variant="white" @click="navigateTo(`/settle/${planId}`)">이전</AppButton>
      </div>
      <div class="flex-1">
        <AppButton
          variant="strong"
          @click="navigateTo(`/settle/${planId}/deposit-unreturned-detail`)"
        >
          임차권등기 안내
        </AppButton>
      </div>
    </footer>
</template>
  </StageShell>
</template>
