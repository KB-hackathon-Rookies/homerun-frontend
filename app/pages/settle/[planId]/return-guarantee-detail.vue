<script setup lang="ts">
import {
  COLLATERAL_EFFECT,
  JOIN_DOCUMENTS,
  JOIN_ROUTES,
  RETURN_GUARANTEE_COLLATERALS,
  collateralName,
  includedInCollateral,
} from '~/components/settle/guarantee';

/**
 * 홈 4-1 상세 · 반환보증 가입.
 *
 * 본 화면은 "내 담보가 뭐고 그래서 뭘 해야 하나" 만 말한다. 여기는 왜
 * 그런지와 언제·어디서·무엇을 들고 가는지다.
 *
 * 제3자 정보제공 동의를 크게 다룬다. 여기서 한 번 동의해 두면 다음 단계인
 * 보증료 지원 신청에서 서류가 아홉 장에서 두 장으로 줄어든다 — 안 하면
 * 등본부터 소득금액증명까지 전부 다시 뗀다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
</script>

<template>
  <GuideFrame title="반환보증 가입 상세" @back="navigateTo(`/settle/${planId}/return-guarantee`)">
    <h2 class="text-section text-ink-hero px-1 pt-2">내 담보에 따라 갈려요</h2>

    <AppCard class="flex flex-col gap-0 p-2.5">
      <div
        v-for="(code, index) in RETURN_GUARANTEE_COLLATERALS"
        :key="code"
        class="flex items-center gap-2.5 px-2.5 py-3"
        :class="index ? 'border-line-soft border-t' : ''"
      >
        <StatusBadge
          :tone="includedInCollateral(code) ? 'safe' : 'caution'"
          :fill="includedInCollateral(code) ? 'soft' : 'solid'"
        >
          {{ collateralName(code) }}
        </StatusBadge>
        <span class="text-caption-tight text-ink-hero flex-1 font-semibold">
          {{ COLLATERAL_EFFECT[code] }}
        </span>
      </div>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">가입 시기 · 경로</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-row text-ink-hero">전입신고·확정일자가 끝난 뒤 바로</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        가입 조건에 대항력·확정일자가 들어가서 입주 전에는 신청 자체가 안 돼요.
      </p>
    </AppCard>

    <AppCard class="flex flex-col gap-2">
      <p class="text-row text-ink-hero">가입 경로</p>
      <p
        v-for="line in JOIN_ROUTES"
        :key="line"
        class="text-caption-tight text-ink-hero font-normal"
      >
        {{ line }}
      </p>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">필요 서류</h2>

    <AppCard class="flex flex-col gap-2">
      <p class="text-row text-ink-hero">준비 서류 4가지</p>
      <p
        v-for="line in JOIN_DOCUMENTS"
        :key="line"
        class="text-caption-tight text-ink-hero font-normal"
      >
        {{ line }}
      </p>

      <div class="bg-surface-info rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-primary-strong font-semibold">
          3루에서 뗀 서류 재활용 가능
        </p>
        <p class="text-caption-tight text-ink-hero font-normal">
          대출용은 1개월, 보증료 지원용은 3개월 유효해요. 3개월 이내면 그대로 씁니다.
        </p>
      </div>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">가입할 때 꼭 체크할 것</h2>

    <!--
      동의 하나로 다음 단계 서류가 아홉에서 둘로 줄어든다. 되돌리려면 전부
      다시 떼야 해서 경고 테두리를 둘렀다.
    -->
    <div class="bg-surface border-danger-deep rounded-field flex flex-col gap-2 border p-3.5">
      <p class="text-row text-danger-deep">제3자 정보제공 · 반드시 동의</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        동의하면 다음 단계인 보증료 지원 신청에서 서류가 9개 → 2개로 줄어요. 동의하지 않으면
        등본부터 소득금액증명까지 전부 다시 발급해야 해요.
      </p>
    </div>

    <h2 class="text-section text-ink-hero px-1 pt-2">이런 집이면 예외</h2>

    <div class="bg-surface border-danger-deep rounded-field flex flex-col gap-1.5 border p-3.5">
      <p class="text-row text-danger-deep">등록임대사업자의 임대주택</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        이 경우엔 임대사업자에게 보증 가입 의무가 있어요. 임차인이 직접 가입했다면 임대인에게
        보증료를 청구할 수 있어요.
      </p>
      <p class="text-step text-ink-meta font-normal">근거 · 민간임대주택법 제49조 제7항 제3호</p>
    </div>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/return-guarantee`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
