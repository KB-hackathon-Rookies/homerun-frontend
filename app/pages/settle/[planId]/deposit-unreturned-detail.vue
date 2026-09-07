<script setup lang="ts">
import { HELP_DESKS, UNRETURNED_STEPS } from '~/components/settle/lifecycle';

/**
 * 대응 · 보증금 미반환 상세.
 *
 * 순서가 곧 권리다. 임차권등기명령은 **신청만으로는 부족하고 완료를 확인한
 * 뒤에** 이사해야 한다.
 *
 * 임대인이 "다음 세입자가 안 구해져서 못 준다" 고 하면 전세퇴거자금대출을
 * 알려줄 수 있다 — 몰라서 안 하는 경우가 있다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
</script>

<template>
  <GuideFrame
    title="보증금 미반환 대응 상세"
    @back="navigateTo(`/settle/${planId}/deposit-unreturned`)"
  >
    <h2 class="text-section text-ink-hero px-1 pt-2">절대 하지 말 것</h2>

    <div class="bg-surface border-danger-deep rounded-field flex flex-col gap-1.5 border p-3.5">
      <p class="text-row text-danger-deep">전입신고를 빼지 마세요</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        새 집으로 전입신고를 하면 이 집의 대항력·우선변제권이 사라져요.
      </p>

      <div class="bg-surface-info rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-primary-strong font-semibold">꼭 이사해야 한다면</p>
        <p class="text-caption-tight text-ink-hero font-normal">
          반드시 임차권등기명령을 먼저 신청하고, 완료된 것을 확인한 뒤에 이사하세요. 신청만으로는
          부족해요.
        </p>
      </div>
    </div>

    <h2 class="text-section text-ink-hero px-1 pt-2">단계별 대응 순서</h2>

    <NumberedCard
      v-for="step in UNRETURNED_STEPS"
      :key="step.order"
      :index="step.order"
      :title="step.title"
    >
      <p class="text-caption-tight text-ink-hero font-normal">{{ step.note }}</p>
    </NumberedCard>

    <div class="bg-surface-info rounded-field flex flex-col gap-1.5 p-3.5">
      <p class="text-row text-primary-strong">반환보증에 가입했다면 2단계에서 끝</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        보증기관이 대신 지급해줘요. 이래서 반환보증이 중요한 거예요.
      </p>
    </div>

    <h2 class="text-section text-ink-hero px-1 pt-2">임대인에게 알려줄 수 있는 것</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-row text-ink-hero">전세퇴거자금대출</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        집주인이 세입자에게 보증금을 돌려주려고 받는 대출이에요. 자기 집을 담보로 빌려서 내 보증금을
        돌려주는 구조예요.
      </p>
      <p class="text-step text-ink-meta font-normal">
        "다음 세입자가 안 구해져 못 준다" 고 하면 알려주세요. 몰라서 안 하는 경우도 있어요.
      </p>

      <div class="bg-surface-caution rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-caution-deep font-semibold">주의</p>
        <p class="text-caption-tight text-ink-hero font-normal">
          집주인의 신용·담보 여력에 따라 안 될 수도 있어요.
        </p>
      </div>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">도움받을 곳</h2>

    <AppCard class="flex flex-col gap-0 p-2.5">
      <div
        v-for="(desk, index) in HELP_DESKS"
        :key="desk.name"
        class="flex flex-col gap-0.5 px-3 py-2.5"
        :class="index ? 'border-line-soft border-t' : ''"
      >
        <span class="text-row text-ink-hero">{{ desk.name }}</span>
        <span class="text-caption-tight text-primary-strong font-medium">{{ desk.tel }}</span>
      </div>
    </AppCard>

    <div class="bg-surface-info rounded-field flex flex-col gap-1.5 p-3.5">
      <p class="text-row text-primary-strong">전세피해확인서</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        전세피해확인서를 받으면 저리 기금대출·긴급 주거지원을 이용할 수 있어요.
      </p>
    </div>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/deposit-unreturned`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
