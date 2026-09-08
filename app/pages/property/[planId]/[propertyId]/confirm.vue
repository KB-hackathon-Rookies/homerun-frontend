<script setup lang="ts">
import { useConsultationApi, type Consultation } from '~/api/consultation';
import { usePropertyApi } from '~/api/property';
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
const saving = ref(false);
/** 저장 실패는 따로 담는다. `error` 에 넣으면 확정 카드가 사라져 무엇을 확정하려던 건지 안 보인다. */
const saveError = ref('');

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

/**
 * 확정을 서버에 남기고 3루로 넘어간다.
 *
 * 화면에 "확정된 조건" 을 그려 놓고 넘어가기만 하면, 3루가 계약 초안을
 * 만들 때 확정을 찾지 못해 거기서 막힌다. 실패하면 넘어가지 않는다 —
 * 넘어간 뒤에 막히면 어디서 잘못됐는지 알 수 없다.
 */
async function proceed() {
  if (!settled.value || saving.value) return;

  saving.value = true;
  saveError.value = '';
  try {
    await usePropertyApi().decide(planId, propertyId, settled.value.consultationId);
    await navigateTo(`/contract/${planId}/visit`);
  } catch (cause) {
    saveError.value = messageFrom(cause, '확정을 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}

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
      <CoachTip
        >계약금은 대출 신청 전에 내는 거야. 순서가 바뀌면 곤란해지니 지금 확인해두자</CoachTip
      >

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

    <footer class="px-gutter-tight flex shrink-0 flex-col gap-2 pt-2.5 pb-cta-pad">
      <p v-if="saveError" class="text-label2 text-danger">{{ saveError }}</p>

      <AppButton variant="strong" :disabled="pending || saving || !settled" @click="proceed">
        3루 진행 (부동산 계약)
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
