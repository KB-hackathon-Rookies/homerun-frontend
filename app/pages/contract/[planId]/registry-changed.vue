<script setup lang="ts">
/**
 * 대응 · 등기부 변동.
 *
 * 순서가 곧 대응이다. **송금 중단이 1번**인 이유는 돈이 나가면 되돌릴
 * 방법이 사실상 없어서다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const ACTIONS = [
  { title: '송금 중단', body: '중개사·임대인에게 즉시 연락' },
  { title: '은행 담당자에 연락', body: '대출 실행 보류 요청' },
  { title: '변경 내용 캡처와 저장', body: '계약 때 등기부와 오늘 등기부 둘 다 보관' },
  { title: '임대인에게 요구', body: '말소 후 진행 또는 계약 해제 중 선택' },
];
</script>

<template>
  <GuideFrame title="등기부 변동 대응" @back="navigateTo(`/contract/${planId}/settlement`)">
    <div class="bg-badge-warning rounded-field flex flex-col gap-1.5 p-3.5">
      <p class="text-label2 text-warning-strong font-semibold">
        뭔가 달라졌으면 절대 송금하지 마세요
      </p>
      <p class="text-caption2 text-ink-hero">특약 2번 위반이라 계약을 해제할 수 있어요.</p>
    </div>

    <h2 class="text-option text-ink-hero px-1 pt-2">바로 할 4가지</h2>

    <NumberedCard
      v-for="(action, index) in ACTIONS"
      :key="action.title"
      :index="index + 1"
      :title="action.title"
    >
      <p class="text-caption2 text-ink-hero">{{ action.body }}</p>
    </NumberedCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">요구 옵션</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-label2 text-ink-hero font-semibold">말소를 요구하는 경우</p>
      <p class="text-caption2 text-ink-hero">근저당을 말소하고, 등기부로 확인한 뒤에 송금하세요.</p>
    </AppCard>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-label2 text-ink-hero font-semibold">계약 해제를 요구하는 경우</p>
      <p class="text-caption2 text-ink-hero">
        특약 2번 위반이므로 계약금 전액 반환을 요구할 수 있어요.
      </p>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">상담 · 무료로 받을 수 있어요</h2>

    <div class="bg-surface-info rounded-field flex flex-col gap-1.5 p-3.5">
      <p class="text-label2 text-primary-strong font-semibold">변호사·공인중개사 상주</p>
      <p class="text-caption2 text-ink-hero">• 서울시 전월세종합지원센터 02-2133-1200~8</p>
      <p class="text-caption2 text-ink-hero">• 대한법률구조공단 132</p>
    </div>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/settlement`)">
        돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
