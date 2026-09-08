<script setup lang="ts">
import { useContractApi, type ContractEntry } from '~/api/contract';
import { COLLATERAL_LABEL, includesReturnGuarantee } from '~/components/contract/labels';
import { messageFrom } from '~/utils/error';
import { THIRD_BASE_STEPS } from '~/components/contract/steps';

/**
 * 3루 12 · 잔금일 이후, 그리고 3루 13 · 안착.
 *
 * **담보가 무엇이냐로 남은 할 일이 갈린다.** 안심전세는 반환보증이 이미
 * 들어 있어 보증료 지원만 신청하면 되고, 나머지는 반환보증부터 따로
 * 가입해야 한다.
 *
 * 잔금일 화면에서 3루를 마치고 넘어왔을 때만 안착 축하를 올린다(`?done=1`).
 * 나중에 이 화면을 다시 열었을 때마다 축하가 뜨면 안내가 아니라 방해가 된다.
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

/** 3루를 방금 마쳤을 때만 축하한다. 잔금일 화면이 완료 뒤에 붙여 보낸다. */
const celebrating = ref(route.query.done === '1');
const dismissCelebration = () => {
  celebrating.value = false;
};

onMounted(async () => {
  try {
    entry.value = await useContractApi().prefill(planId);
  } catch (cause) {
    error.value = messageFrom(cause, '계약 정보를 불러오지 못했어요.');
  }
});
</script>

<template>
  <StageShell brand base="3루">
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="THIRD_BASE_STEPS" :current="4" />

      <p class="text-caption1 text-ink-label font-medium">3루 · 잔금일</p>

      <h1 class="text-question text-ink-card">반환보증 안내</h1>

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

    <template #footer>
      <footer class="px-gutter-tight flex shrink-0 gap-2 pt-2.5 pb-cta-pad">
        <div class="w-28 shrink-0">
          <AppButton variant="white" @click="navigateTo(`/contract/${planId}/settlement`)">
            이전
          </AppButton>
        </div>
        <AppButton variant="strong" @click="navigateTo(`/settle/${planId}`)">정착 시작</AppButton>
      </footer>
    </template>

    <!-- 3루 안착 축하(시안 3루 13). 흐름을 잠깐 멈추고 다음 목적지만 말한다. -->
    <DimOverlay v-if="celebrating" @close="dismissCelebration">
      <div class="flex flex-col items-center gap-2 text-center">
        <p class="text-caption1 text-primary-strong">3루 안착!</p>
        <h2 class="text-headline1 text-ink-hero">잔금까지 무사히 끝났어</h2>
        <p class="text-caption2 text-ink-hero-body">
          계약, 서류, 대출 실행, 잔금 송금까지 마쳤어. 이제 홈에서 정착을 챙기자
        </p>

        <p class="bg-surface-info rounded-chip text-caption1 text-primary-strong mt-1 px-3 py-1.5">
          ⚾ 다음은 홈 · 정착
        </p>

        <div class="mt-3 w-full">
          <AppButton variant="strong" @click="dismissCelebration">남은 할 일 보기</AppButton>
        </div>
      </div>
    </DimOverlay>
  </StageShell>
</template>
