<script setup lang="ts">
import { useContractApi, type ContractEntry } from '~/api/contract';
import { COLLATERAL_LABEL, includesReturnGuarantee } from '~/components/contract/labels';
import { messageFrom } from '~/utils/error';
import { COACH_TIME } from '~/components/contract/coachSheets';

/**
 * 3루 12 · 잔금일 이후 상세.
 *
 * 반환보증이 무엇이고 왜 지금 해야 하는지를 푼다. **전입신고 전에는
 * 신청 자체가 안 되고**, 보증료 지원은 예산 선착순이라 늦으면 못 받는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const BRANCHES = [
  { code: 'HUG_SAFE_JEONSE', next: '반환보증 이미 포함 → 보증료 지원 신청만', done: true },
  { code: 'HF', next: '반환보증 따로 가입 → 그다음 보증료 지원', done: false },
  { code: 'SGI', next: '반환보증 따로 가입 → 그다음 보증료 지원', done: false },
  { code: 'CLAIM_TRANSFER', next: '반환보증 따로 가입 → 그다음 보증료 지원', done: false },
] as const;

const entry = ref<ContractEntry | null>(null);
const error = ref('');

const mine = computed(() => entry.value?.collateralMethod ?? null);

onMounted(async () => {
  try {
    entry.value = await useContractApi().prefill(planId);
  } catch (cause) {
    error.value = messageFrom(cause, '계약 정보를 불러오지 못했어요.');
  }
});
</script>

<template>
  <GuideFrame
    :coach-sheets="[COACH_TIME.moveInCheck]"
    title="잔금일 이후 상세"
    @back="navigateTo(`/contract/${planId}/after-settlement`)"
  >
    <h2 class="text-option text-ink-hero px-1 pt-2">지금 어디까지 왔나요</h2>

    <AppCard class="flex flex-col gap-1">
      <div class="flex items-center gap-2.5 p-2">
        <span class="text-body3 text-success font-bold" aria-hidden="true">✓</span>
        <span class="text-label2 text-ink-hero flex-1 font-semibold">잔금 송금 완료</span>
      </div>
      <div class="flex items-center gap-2.5 p-2">
        <span class="text-body3 text-success font-bold" aria-hidden="true">✓</span>
        <span class="text-label2 text-ink-hero flex-1 font-semibold">이사 · 전입신고 완료</span>
      </div>
      <div class="flex items-center gap-2.5 p-2">
        <span class="text-body3 text-ink-muted font-bold" aria-hidden="true">○</span>
        <span class="text-label2 text-ink-muted flex-1 font-semibold">
          반환보증 가입 · 보증료 지원 신청 (지금 이 단계)
        </span>
      </div>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">반환보증이 뭔가요?</h2>

    <AppCard class="flex flex-col gap-2.5">
      <p class="text-caption2 text-ink-hero">
        전세 만기 때 임대인이 보증금을 못 돌려주면(파산·잠수·다음 세입자 못 구함 등) 보증기관이 대신
        지급해주는 안전망이에요.
      </p>
      <div class="bg-badge-warning rounded-field flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption2 text-warning-strong font-semibold">없으면 어떻게 되냐면</p>
        <p class="text-caption2 text-ink-hero">
          내용증명 → 임차권등기명령 → 소송 → 경매까지 직접 밟아야 해요. 몇 개월~몇 년 걸림.
        </p>
      </div>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">내 담보로 뭘 해야 하나요?</h2>

    <p v-if="error" class="text-label2 text-danger">{{ error }}</p>

    <AppCard class="flex flex-col gap-1 p-2.5">
      <div
        v-for="branch in BRANCHES"
        :key="branch.code"
        class="border-line-soft flex items-center gap-2.5 border-b p-2.5 last:border-b-0"
        :class="branch.code === mine ? 'bg-surface-info rounded-chip border-b-0' : ''"
      >
        <span
          class="rounded-chip text-micro shrink-0 px-2 py-0.5 font-semibold"
          :class="
            includesReturnGuarantee(branch.code)
              ? 'bg-badge-success text-success'
              : 'bg-badge-warning text-warning-strong'
          "
        >
          {{ COLLATERAL_LABEL[branch.code] }}
        </span>
        <span class="text-caption2 text-ink-hero flex-1 font-semibold">{{ branch.next }}</span>
      </div>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">언제까지 해야 하나요?</h2>

    <AppCard class="flex flex-col gap-2.5">
      <p class="text-label2 text-ink-hero font-semibold">전입신고 마친 뒤 곧바로</p>

      <div class="bg-surface-info rounded-field flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption2 text-primary-strong font-semibold">
          이유 1 · 그 전에는 신청 자체가 안 돼요
        </p>
        <p class="text-caption2 text-ink-hero">
          가입 조건에 대항력 + 확정일자가 들어가요. 전입신고 안 하면 창구에서 반려돼요.
        </p>
      </div>

      <div class="bg-badge-warning rounded-field flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption2 text-warning-strong font-semibold">
          이유 2 · 보증료 지원 예산은 선착순
        </p>
        <p class="text-caption2 text-ink-hero">
          지자체별 예산이 정해져 있고 소진되면 그해 마감. 늦으면 최대 40만원을 못 받아요.
        </p>
      </div>
    </AppCard>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/after-settlement`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
