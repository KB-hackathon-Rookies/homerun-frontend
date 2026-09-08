<script setup lang="ts">
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
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="D-3 심사 확인"
      base="3루"
      @back="navigateTo(`/contract/${planId}/loan-apply`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>
        신청했으면 기다리면 되는데, 잔금일 3일 전에 한 번 확인해보자. 아직 소식이 없으면 재촉해야
        하거든
      </CoachTip>

      <h2 class="text-body3 text-ink-hero font-bold">전화 통화 체크리스트</h2>

      <CheckItem v-for="item in CHECKS" :key="item" v-model="checked[item]">{{ item }}</CheckItem>

      <button
        type="button"
        class="bg-surface border-danger rounded-field flex flex-col gap-1 border p-3.5 text-left"
        @click="navigateTo(`/contract/${planId}/loan-rejected`)"
      >
        <span class="text-label2 text-danger font-bold">거절 통보를 받았어요</span>
        <span class="text-micro text-ink-hero-body">
          당황하지 말고 순서대로 대응. 눌러서 대응 절차 보기
        </span>
      </button>

      <DetailLink @open="navigateTo(`/contract/${planId}/review-detail`)">
        확인 대본·상황별 대응 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight flex shrink-0 gap-2 pt-2.5 pb-cta-pad">
      <div class="w-28 shrink-0">
        <AppButton variant="white" @click="navigateTo(`/contract/${planId}/loan-apply`)">
          이전
        </AppButton>
      </div>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/settlement`)">
        심사 정상 · D-day 준비
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
