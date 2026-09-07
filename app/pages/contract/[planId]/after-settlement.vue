<script setup lang="ts">
import { useContractApi, type ContractEntry } from '~/api/contract';
import { COLLATERAL_LABEL, includesReturnGuarantee } from '~/components/contract/labels';
import { messageFrom } from '~/utils/error';

/**
 * 3루 11 · 잔금일 이후.
 *
 * **담보가 무엇이냐로 남은 할 일이 갈린다.** 안심전세는 반환보증이 이미
 * 들어 있어 보증료 지원만 신청하면 되고, 나머지는 반환보증부터 따로
 * 가입해야 한다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const BRANCHES = [
  { code: 'HUG_SAFE_JEONSE', next: '반환보증 포함, 보증료 지원만 신청' },
  { code: 'HF', next: '반환보증 따로 가입 필요' },
  { code: 'SGI', next: '반환보증 따로 가입 필요' },
  { code: 'CLAIM_TRANSFER', next: '반환보증 따로 가입 필요' },
] as const;

const entry = ref<ContractEntry | null>(null);
const error = ref('');

const mine = computed(() => entry.value?.collateralMethod ?? null);
const included = computed(() => includesReturnGuarantee(mine.value));

onMounted(async () => {
  try {
    entry.value = await useContractApi().prefill(planId);
  } catch (cause) {
    error.value = messageFrom(cause, '계약 정보를 불러오지 못했어요.');
  }
});
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="반환보증 안내"
      base="3루"
      @back="navigateTo(`/contract/${planId}/settlement`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3.5 py-4">
      <CoachTip>잔금·전입신고 완료! 어떤 보증서로 받았느냐에 따라 할 일이 하나 더 있어</CoachTip>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>

      <div v-else class="bg-surface-info rounded-field flex flex-col gap-1 p-3.5">
        <p class="text-caption2 text-ink-hero-body">내 담보</p>
        <p class="text-option text-primary-strong">
          {{ mine ? COLLATERAL_LABEL[mine] : '아직 확정되지 않았어요' }}
        </p>
        <p class="text-caption2 text-ink-hero-body">
          {{
            included
              ? '반환보증이 이미 포함되어 있어요 · 바로 보증료 지원 신청으로!'
              : '반환보증을 따로 가입한 뒤 보증료 지원을 신청해요'
          }}
        </p>
      </div>

      <AppCard class="flex flex-col gap-2">
        <p class="text-label2 text-ink-hero font-bold">담보별 다음 단계</p>
        <div
          v-for="branch in BRANCHES"
          :key="branch.code"
          class="rounded-chip flex items-center gap-2 px-3 py-2"
          :class="branch.code === mine ? 'bg-surface-info' : ''"
        >
          <span
            class="text-caption2 w-28 shrink-0 font-bold"
            :class="branch.code === mine ? 'text-primary-strong' : 'text-ink-hero'"
          >
            {{ COLLATERAL_LABEL[branch.code] }}
          </span>
          <span class="text-micro text-ink-hero-body flex-1">{{ branch.next }}</span>
        </div>
      </AppCard>

      <p class="bg-surface-brand rounded-chip text-micro text-ink-hero-body p-3">
        ⚠️ 보증료 지원은 예산 소진 시 조기 마감. 반환보증 가입 직후 바로 신청하세요
      </p>

      <DetailLink @open="navigateTo(`/contract/${planId}/after-settlement-detail`)">
        담보별 표·사후자산심사 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-6">
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}`)">
        보증료 지원 신청하러 (홈)
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
