<script setup lang="ts">
import { THIRD_BASE_STEPS } from '~/components/contract/steps';
import { COACH_TIME } from '~/components/contract/coachSheets';
/**
 * 3루 10 · 심사 확인 (D-3).
 *
 * 기다리기만 하면 되는 구간이라 아무것도 안 하고 잔금일을 맞는 일이 있다.
 * **잔금일 3일 전에 한 번 확인**하면 늦기 전에 재촉할 수 있다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const CHECKS = [
  '은행 담당자에게 전화',
  '"잔금일이 O월 O일인데 실행 가능할까요?" 확인',
  '추가 서류 요청이 있는지 확인',
  '대출금 송금 시간 확인 (오전/오후)',
  '임대인에게 질권설정 통지가 도달했는지 확인',
];

const checked = ref<Record<string, boolean>>({});

/** 전화 체크리스트를 다 확인해야 심사 정상으로 넘어갈 수 있다. */
const allChecked = computed(() => CHECKS.every((item) => checked.value[item]));

/** ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="[COACH_TIME.loanReview]"
    brand
    base="3루"
  >
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="THIRD_BASE_STEPS" :current="3" />

      <p class="text-caption1 text-ink-label font-medium">3루 · 대출 신청</p>

      <h1 class="text-question text-ink-card">D-3 심사 확인</h1>

      <h2 class="text-body3 text-ink-hero font-bold">전화 통화 체크리스트</h2>

      <CheckItem v-for="item in CHECKS" :key="item" v-model="checked[item]">{{ item }}</CheckItem>

      <div class="bg-surface border-danger rounded-field flex flex-col gap-1 border p-3.5">
        <span class="text-label2 text-danger font-bold">거절 통보를 받았어요</span>
        <span class="text-micro text-ink-hero-body">
          당황하지 말고 순서대로 대응. 하단 "대출 거절 대응" 화면 참고
        </span>
      </div>

      <DetailLink @open="navigateTo(`/contract/${planId}/loan-rejected`)">
        대출 거절 대응 상세보기
      </DetailLink>
    </div>

    <template #footer>
      <footer class="px-gutter-tight flex shrink-0 gap-2 pt-2.5 pb-cta-pad">
        <div class="w-28 shrink-0">
          <AppButton variant="white" @click="navigateTo(`/contract/${planId}/loan-apply`)">
            이전
          </AppButton>
        </div>
        <AppButton
          variant="strong"
          :disabled="!allChecked"
          @click="navigateTo(`/contract/${planId}/settlement`)"
        >
          다음
        </AppButton>
      </footer>
    </template>
  </StageShell>
</template>
