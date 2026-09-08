<script setup lang="ts">
import { useContractApi } from '~/api/contract';
import { TERMS } from '~/components/contract/terms';
import {
  OWNER_OPTIONS,
  PRESENCE_NOW_OPTIONS,
  useRegistrySnapshot,
} from '~/composables/useRegistrySnapshot';
import { messageFrom } from '~/utils/error';

/**
 * 3루 2 · 계약.
 *
 * 특약 네 개가 이 화면의 전부다. **계약서에 안 적히면 없는 것**이라,
 * 무엇을 적어야 하는지부터 보여준다.
 *
 * 계약 때 등기부도 여기서 남긴다(CONTRACT_SIGNING). 이 기준이 있어야 잔금일에
 * 서버가 계약 때와 대조해 SAFE 를 판정할 수 있다. 기준을 남기지 않으면 잔금일
 * 대조가 늘 NEED_INFO 에 걸린다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const { owner, seizure, leasehold, auction, trust, seniorDebt, mortgageCount, answered, facts } =
  useRegistrySnapshot();

const saving = ref(false);
const error = ref('');

const today = () => new Date().toISOString().slice(0, 10);

/**
 * 계약 때 등기부를 기준으로 남기고 다음으로 넘어간다.
 *
 * 스냅샷 저장은 계약이 있어야 하므로 먼저 초안을 확정(prefill)한다 — 3루에서
 * 넣은 값은 건드리지 않는다. 저장에 실패하면 넘어가지 않는다.
 */
async function proceed() {
  if (!answered.value || saving.value) return;

  saving.value = true;
  error.value = '';
  try {
    const api = useContractApi();
    await api.prefill(planId);
    await api.recordRegistry(planId, 'CONTRACT_SIGNING', today(), facts.value);
    await navigateTo(`/contract/${planId}/fixed-date`);
  } catch (cause) {
    error.value = messageFrom(cause, '등기부를 기록하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <PhoneFrame>
    <StageBar title="계약" base="3루" @back="navigateTo(`/contract/${planId}/visit`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>
        계약 시 전세보증금의 5~10% 계약금 지불. 영수증 꼭 챙기고 특약이 제일 중요해
      </CoachTip>

      <h2 class="text-body3 text-ink-hero font-bold">필수 특약 4종</h2>

      <AppCard v-for="(term, index) in TERMS" :key="term.title" class="flex flex-col gap-1">
        <p class="text-label2 text-ink-hero font-bold">{{ index + 1 }}. {{ term.title }}</p>
        <p class="text-caption2 text-ink-hero-body">{{ term.short }}</p>
      </AppCard>

      <p class="bg-surface-brand rounded-chip text-caption2 text-ink-hero-body p-3">
        ⚠️ 계약금은 등기부상 소유자 명의 계좌로만 송금. 이체확인증 필수 보관
      </p>

      <h2 class="text-body3 text-ink-hero font-bold">계약 때 등기부 기록</h2>
      <p class="text-caption2 text-ink-hero-body">
        지금 뗀 등기부를 남겨두면, 잔금일에 서버가 계약 때와 대조해 달라진 위험을 잡아줘요
      </p>

      <AppCard class="flex flex-col gap-3">
        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">소유자가 계약 상대와 같나요</p>
          <PillGroup v-model="owner" :options="OWNER_OPTIONS" />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">압류·가압류가 있나요</p>
          <PillGroup v-model="seizure" :options="PRESENCE_NOW_OPTIONS" />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">전세권이 설정돼 있나요</p>
          <PillGroup v-model="leasehold" :options="PRESENCE_NOW_OPTIONS" />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">경매·공매가 진행 중인가요</p>
          <PillGroup v-model="auction" :options="PRESENCE_NOW_OPTIONS" />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">신탁 등기가 있나요</p>
          <PillGroup v-model="trust" :options="PRESENCE_NOW_OPTIONS" />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">채권최고액 (만 원)</p>
          <input
            v-model="seniorDebt"
            inputmode="numeric"
            placeholder="모르면 비워두세요"
            class="bg-canvas rounded-chip text-body3 text-ink-hero placeholder:text-ink-muted h-11 px-3.5 outline-none"
          />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label2 text-ink-hero font-semibold">근저당 건수</p>
          <input
            v-model="mortgageCount"
            inputmode="numeric"
            placeholder="모르면 비워두세요"
            class="bg-canvas rounded-chip text-body3 text-ink-hero placeholder:text-ink-muted h-11 px-3.5 outline-none"
          />
        </div>
      </AppCard>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>

      <DetailLink @open="navigateTo(`/contract/${planId}/sign-detail`)">
        특약·계약 체크·중개보수 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton variant="strong" :disabled="!answered || saving" @click="proceed">
        {{ saving ? '기록 중…' : '확정일자 받기' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
