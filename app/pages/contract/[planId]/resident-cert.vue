<script setup lang="ts">
import { useContractApi, type ContractEntry } from '~/api/contract';
import { needsResidentCert } from '~/components/contract/labels';
import { messageFrom } from '~/utils/error';
import { THIRD_BASE_STEPS } from '~/components/contract/steps';

/**
 * 3루 8 · 전입세대확인서 (D-12).
 *
 * **다가구·단독 + 안심전세일 때만** 필요하다. 다세대면 건너뛴다 — 한
 * 건물에 세대가 여럿인 집만 앞선 임차인을 확인해야 하기 때문이다.
 *
 * 이 서류만 온라인 발급이 안 된다. 주민센터를 꼭 가야 한다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const STEPS = [
  '정부24에서 사전 신청 (대기 없이)',
  '주민센터 방문',
  '지참물: 신분증 + 임대차계약서 원본',
  '수수료 300원 · 5분 소요',
];

const entry = ref<ContractEntry | null>(null);
const pending = ref(true);
const error = ref('');
const checked = ref<Record<string, boolean>>({});

const applies = computed(() =>
  needsResidentCert(entry.value?.houseType ?? null, entry.value?.collateralMethod ?? null),
);

onMounted(async () => {
  try {
    entry.value = await useContractApi().prefill(planId);
  } catch (cause) {
    error.value = messageFrom(cause, '계약 정보를 불러오지 못했어요.');
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <StageShell brand base="3루">
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="THIRD_BASE_STEPS" :current="2" />

      <p class="text-caption1 text-ink-label font-medium">3루 · 서류</p>

      <h1 class="text-question text-ink-card">D-12 전입세대확인서</h1>
      <p v-if="pending" class="text-label2 text-ink-muted">불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <template v-else-if="!applies">
        <div class="bg-surface-brand rounded-field flex flex-col gap-1.5 p-4">
          <p class="text-label2 text-ink-hero font-semibold">이 단계는 건너뛰어도 돼요</p>
          <p class="text-caption2 text-ink-hero-body">
            전입세대확인서는 다가구·단독주택을 안심전세(HUG) 담보로 받을 때만 필요해요.
          </p>
        </div>
      </template>

      <template v-else>
        <div class="bg-warning-strong rounded-field flex flex-col gap-1 p-3.5">
          <p class="text-label2 font-bold text-white">⚠️ 다가구·단독주택 + 안심전세일 때만</p>
          <p class="text-micro text-white">다세대주택이면 이 단계는 건너뛰어도 돼요</p>
        </div>

        <h2 class="text-body3 text-ink-hero font-bold">발급 절차</h2>

        <CheckItem v-for="step in STEPS" :key="step" v-model="checked[step]">{{ step }}</CheckItem>

        <p class="bg-surface-brand rounded-chip text-micro text-ink-hero-body p-3">
          💡 다가구면 확정일자 부여현황도 같이 받으세요
        </p>

        <DetailLink @open="navigateTo(`/contract/${planId}/resident-cert-detail`)">
          발급 방법·요청 문구 상세보기
        </DetailLink>
      </template>
    </div>

    <template #footer>
      <footer class="px-gutter-tight flex shrink-0 gap-2 pt-2.5 pb-cta-pad">
        <div class="w-28 shrink-0">
          <AppButton variant="white" @click="navigateTo(`/contract/${planId}/docs`)">
            이전
          </AppButton>
        </div>
        <AppButton
          variant="strong"
          :disabled="pending"
          @click="navigateTo(`/contract/${planId}/loan-apply`)"
        >
          {{ applies ? '발급 완료 처리' : '다음 단계로' }}
        </AppButton>
      </footer>
    </template>
  </StageShell>
</template>
