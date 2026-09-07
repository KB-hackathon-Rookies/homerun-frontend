<script setup lang="ts">
import { usePolicyApi } from '~/api/policy';
import { usePropertyApi, type PropertyDecision } from '~/api/property';
import {
  JOIN_ROUTES,
  RETURN_GUARANTEE_COLLATERALS,
  collateralName,
  includedInCollateral,
} from '~/components/settle/guarantee';
import { collateralLabel } from '~/utils/labels';
import { settlePath } from '~/utils/settle';

/**
 * 홈 4-1 · 반환보증 가입.
 *
 * 전세대출을 받으려면 반환보증이 있어야 하는데, 그게 담보에 딸려 오느냐
 * 따로 드느냐가 갈린다. 안심전세로 받았으면 이 화면은 건너뛰어도 된다 —
 * 그 사실을 맨 위에서 먼저 말한다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const decision = ref<PropertyDecision | null>(null);
/** 내 집 기준으로 어느 기관에 들 수 있는지. 판정을 못 받아도 표는 남는다. */
const joinable = ref<string[] | null>(null);

const collateral = computed(() => decision.value?.consultation?.collateralMethod ?? null);
const included = computed(() => !!collateral.value && includedInCollateral(collateral.value));

onMounted(async () => {
  try {
    decision.value = await usePropertyApi().decision(planId);
  } catch {
    return;
  }

  const propertyId = decision.value?.property?.propertyId;
  if (!propertyId) return;

  try {
    const verdicts = await usePolicyApi().evaluateReturnGuarantees(planId, propertyId);
    joinable.value = verdicts.results
      .filter((result) => result.verdict === 'PASS')
      .map((result) => result.policyName);
  } catch {
    joinable.value = null;
  }
});
</script>

<template>
  <PhoneFrame>
    <StageBar title="반환보증 가입" base="홈" @back="navigateTo(`/settle/${planId}`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>
        전세대출을 받으려면 반환보증이 필요해. HUG 가 공짜로 되는 게 아니라, 보증료를 내고
        지원사업으로 돌려받는 구조야
      </CoachTip>

      <!--
        내 담보가 무엇이냐로 이 화면의 쓸모가 갈린다. 담보를 아직 모르면
        단정하지 않고 표만 보여준다.
      -->
      <div
        v-if="collateral"
        class="rounded-field flex flex-col gap-1 p-4"
        :class="included ? 'bg-safe' : 'bg-caution-deep'"
      >
        <p class="text-caption-tight text-on-brand font-normal">
          내 담보 · {{ collateralLabel(collateral) }}
        </p>
        <p class="text-section text-on-brand font-bold">
          {{ included ? '반환보증 이미 포함' : '반환보증 따로 가입 필요' }}
        </p>
        <p class="text-step text-on-brand font-normal">
          {{
            included
              ? '이 화면은 건너뛰고 바로 보증료 지원 신청으로 가세요'
              : '아래 경로로 가입한 뒤 보증료 지원을 신청하세요'
          }}
        </p>
      </div>

      <h2 class="text-card-title text-ink-hero font-bold">담보별 가입 필요 여부</h2>

      <AppCard class="flex flex-col gap-2">
        <div
          v-for="code in RETURN_GUARANTEE_COLLATERALS"
          :key="code"
          class="flex items-center gap-2 py-1.5"
        >
          <span class="text-row text-ink-hero flex-1">{{ collateralName(code) }}</span>
          <StatusBadge :tone="includedInCollateral(code) ? 'safe' : 'caution'">
            {{ includedInCollateral(code) ? '포함' : '따로 가입' }}
          </StatusBadge>
        </div>

        <p
          v-if="joinable?.length"
          class="text-step text-ink-hero-body border-line-soft border-t pt-2 font-normal"
        >
          내 집 기준으로는 {{ joinable.join(' · ') }}에 들 수 있어요
        </p>
      </AppCard>

      <div class="bg-surface-brand rounded-field flex flex-col gap-1 p-3.5">
        <p class="text-caption-tight text-ink-hero font-bold">가입 경로 (해당 시)</p>
        <p v-for="line in JOIN_ROUTES" :key="line" class="text-micro text-ink-hero-body">
          {{ line }}
        </p>
      </div>

      <DetailLink @open="navigateTo(`/settle/${planId}/return-guarantee-detail`)">
        반환보증 가입 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight bg-surface flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton
        variant="strong"
        :disabled="!settlePath('fee-support', planId)"
        @click="navigateTo(settlePath('fee-support', planId)!)"
      >
        보증료 지원 신청으로 가기
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
