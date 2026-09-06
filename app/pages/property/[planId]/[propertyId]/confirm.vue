<script setup lang="ts">
import { useConsultationApi, type Consultation } from '~/api/consultation';
import { collateralLabel, productLabel } from '~/components/property/consultation';
import { useProperty } from '~/composables/useProperty';
import { messageFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';

/**
 * 2루-7 최종 확정.
 *
 * 여기 적힌 값은 전부 **은행에서 들은 말**이지 판정 결과가 아니다. 앞 화면의
 * 예상 한도와 다를 수 있고, 다르면 이쪽이 맞다 — 실제로 심사할 곳이 은행이다.
 *
 * "가능" 을 들은 상담이 여럿이면 먼저 들은 것을 쓴다. 은행을 고르는 화면은
 * 아직 없다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

const { property, title } = useProperty(planId, propertyId);

const settled = ref<Consultation | null>(null);
const pending = ref(true);
const error = ref('');

const rows = computed(() => {
  const item = settled.value;
  if (!item) return [];

  return [
    { label: '매물', value: property.value?.roadAddress ?? '—' },
    { label: '상품', value: productLabel(item.loanProduct) },
    {
      label: '은행',
      value: item.branchName ? `${item.bankName} ${item.branchName}` : item.bankName,
    },
    { label: '담보', value: collateralLabel(item.collateralMethod) },
    {
      label: '한도',
      value: item.approvedLimit === null ? '못 들음' : formatKoreanMoney(item.approvedLimit),
      strong: item.approvedLimit !== null,
    },
    {
      label: '금리',
      value: item.quotedRate === null ? '못 들음' : `연 ${item.quotedRate}%`,
      strong: item.quotedRate !== null,
    },
    { label: '기한', value: '잔금일 1개월 전까지 신청' },
  ];
});

onMounted(async () => {
  try {
    const list = await useConsultationApi().list(planId, propertyId);
    settled.value = list.find((item) => item.resultStatus === 'POSSIBLE') ?? null;
  } catch (cause) {
    error.value = messageFrom(cause, '상담 기록을 불러오지 못했어요.');
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="이걸로 진행할게요"
      base="2루"
      @back="navigateTo(`/property/${planId}/${propertyId}/consultations`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 py-4">
      <div class="bg-surface-info rounded-field flex flex-col gap-1 p-4">
        <p class="text-body3 text-primary-strong font-bold">축하해!</p>
        <p class="text-label2 text-ink-hero-body">
          상담 완료! 확정된 조건으로 3루(계약+대출 실행)를 진행하자
        </p>
      </div>

      <p v-if="pending" class="text-label2 text-ink-muted">상담 기록을 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>
      <p v-else-if="!settled" class="text-label2 text-ink-muted">
        아직 "가능" 을 들은 은행이 없어요. 상담 결과를 먼저 입력해주세요.
      </p>

      <AppCard v-else class="flex flex-col gap-3 p-5">
        <h2 class="text-body3 text-ink-hero font-bold">확정된 조건</h2>

        <div v-for="row in rows" :key="row.label" class="flex items-center py-1">
          <span class="text-label2 text-ink-hero-body w-24 shrink-0">{{ row.label }}</span>
          <span
            class="text-body3 flex-1 font-bold"
            :class="row.strong ? 'text-primary-strong' : 'text-ink-hero'"
          >
            {{ row.value }}
          </span>
        </div>
      </AppCard>

      <p class="bg-surface-brand rounded-chip text-caption2 text-ink-hero-body p-3">
        서류를 다 낸 후에도 조건이 달라질 수 있어요. 계약서 특약을 꼭 확인하세요
      </p>

      <p class="text-caption2 text-ink-muted">{{ title }}</p>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-6">
      <AppButton
        variant="strong"
        :disabled="pending || !settled"
        @click="navigateTo(`/property/${planId}`)"
      >
        3루 진행 (부동산 계약)
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
