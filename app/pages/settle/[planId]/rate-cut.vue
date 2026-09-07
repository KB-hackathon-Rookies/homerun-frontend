<script setup lang="ts">
import { usePolicyApi, type PreferentialRateChange } from '~/api/policy';
import { usePropertyApi } from '~/api/property';

/**
 * 홈 4-6 · 금리인하요구권.
 *
 * 은행 자체 대출을 받은 사람만 해당된다. 버팀목은 국토부 고시 금리라
 * 은행이 깎아 줄 권한 자체가 없다 — 대신 연장 시점에 우대금리 조건을
 * 더 채웠는지를 본다.
 *
 * 그래서 이 화면은 내 상품이 무엇이냐를 먼저 말하고 시작한다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const product = ref<string | null>(null);
/** 새로 채운 우대금리 조건. 기금대출 쪽의 대안이다. */
const changes = ref<PreferentialRateChange[]>([]);

const eligible = computed(() => (product.value === null ? null : product.value === 'BANK_LOAN'));

const TRIGGERS = [
  '취업 (무직에서 재직으로)',
  '승진·이직으로 소득 증가',
  '신용점수 상승',
  '다른 대출 상환으로 부채 감소',
];

const METHODS = [
  { name: '기금대출 (버팀목)', how: '우대금리 조건 추가 충족 (연장 시)' },
  { name: '은행 자체 대출', how: '금리인하요구권 신청' },
];

onMounted(() => {
  usePropertyApi()
    .decision(planId)
    .then((found) => (product.value = found.consultation?.loanProduct ?? null))
    .catch(() => {});

  usePolicyApi()
    .preferentialRateChanges(planId)
    .then((found) => (changes.value = found))
    .catch(() => {});
});
</script>

<template>
  <PhoneFrame>
    <StageBar title="금리인하요구권" base="홈" @back="navigateTo(`/settle/${planId}`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>
        은행 대출을 받은 사람만 해당돼. 버팀목은 국토부 고시 금리라 은행이 깎아줄 권한이 없어
      </CoachTip>

      <div
        v-if="eligible !== null"
        class="bg-surface-brand rounded-field flex flex-col gap-1 p-3.5"
      >
        <p class="text-caption-tight text-ink-hero-body font-normal">
          내 상품 · {{ eligible ? '은행 자체 대출' : '기금대출 (버팀목)' }}
        </p>
        <p class="text-card-title font-bold" :class="eligible ? 'text-safe' : 'text-danger-deep'">
          {{ eligible ? '금리인하요구권 대상' : '금리인하요구권 비대상' }}
        </p>
        <p class="text-step text-ink-hero-body font-normal">
          {{
            eligible
              ? '아래 사유가 생겼다면 은행에 바로 신청하세요'
              : '대신 연장 시점에 우대금리 항목 추가 충족을 확인해드려요'
          }}
        </p>
      </div>

      <!-- 기금대출 쪽 대안. 새로 채운 조건이 있을 때만 뜬다. -->
      <AppCard v-if="changes.length" class="flex flex-col gap-1.5">
        <p class="text-row text-ink-hero">새로 채운 우대금리 조건</p>
        <p
          v-for="change in changes"
          :key="change.code"
          class="text-caption-tight text-ink-hero font-normal"
        >
          • {{ change.label }} · {{ change.rateBonus }}%p
        </p>
      </AppCard>

      <h2 class="text-card-title text-ink-hero font-bold">상품별 금리 인하 방법</h2>

      <AppCard class="flex flex-col gap-2">
        <div v-for="row in METHODS" :key="row.name" class="flex flex-col gap-0.5">
          <p class="text-caption-tight text-ink-hero font-bold">{{ row.name }}</p>
          <p class="text-step text-ink-hero-body font-normal">→ {{ row.how }}</p>
        </div>
      </AppCard>

      <h2 class="text-card-title text-ink-hero font-bold">은행 대출 · 요구권 신청 시점</h2>

      <p
        v-for="trigger in TRIGGERS"
        :key="trigger"
        class="bg-surface border-line rounded-chip text-caption-tight text-ink-hero border px-3.5 py-2.5 font-normal"
      >
        · {{ trigger }}
      </p>

      <p class="bg-surface-info rounded-chip text-micro text-ink-hero-body p-2.5">
        영업점·인터넷뱅킹·앱으로 신청해요. 횟수 제한은 없지만 심사에 따라 반영되지 않을 수도 있어요
      </p>

      <DetailLink @open="navigateTo(`/settle/${planId}/rate-cut-detail`)">
        금리인하요구권 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight bg-surface flex shrink-0 pt-2.5 pb-6">
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}`)">확인</AppButton>
    </footer>
  </PhoneFrame>
</template>
