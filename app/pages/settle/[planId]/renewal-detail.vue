<script setup lang="ts">
import {
  RENEWAL_ALTERNATIVES,
  RENEWAL_DOCUMENTS,
  RENEWAL_RECHECKS,
  RENEWAL_TERMS,
  RENEWAL_WAYS,
} from '~/components/settle/lifecycle';

/**
 * 홈 4-9 상세 · 갱신 판정.
 *
 * 갱신은 집만의 문제가 아니다. 2년 뒤에도 그 대출을 쓸 자격이 남아 있는지를
 * 다시 본다 — 사회초년생은 연봉이 기준을 넘기거나 저축이 쌓여 순자산 기준에
 * 걸리기 쉽다.
 *
 * 보증금이 오르면 증액분만 확정일자를 새로 받아야 한다. 그 사이 근저당이
 * 생겼으면 증액분은 후순위가 된다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const WAY_TONE = { CLAIM: 'info', IMPLIED: 'safe', AGREED: 'caution' } as const;
</script>

<template>
  <GuideFrame title="갱신 판정 상세" @back="navigateTo(`/settle/${planId}/renewal`)">
    <h2 class="text-section text-ink-hero px-1 pt-2">갱신 3가지 방법</h2>

    <AppCard v-for="way in RENEWAL_WAYS" :key="way.code" class="flex flex-col gap-1.5">
      <StatusBadge
        :tone="WAY_TONE[way.code]"
        :fill="way.code === 'AGREED' ? 'solid' : 'soft'"
        class="self-start"
      >
        {{ way.name }}
      </StatusBadge>
      <p class="text-card-title text-ink-hero font-semibold">{{ way.headline }}</p>
      <p class="text-caption-tight text-ink-hero font-normal">{{ way.note }}</p>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">연장할 때 자격을 다시 봐요</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p
        v-for="line in RENEWAL_RECHECKS"
        :key="line"
        class="text-caption-tight text-ink-hero font-normal"
      >
        {{ line }}
      </p>

      <div class="bg-surface-caution rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-caution-deep font-semibold">
          2년 뒤엔 조건이 바뀔 수 있어요
        </p>
        <p class="text-caption-tight text-ink-hero font-normal">
          사회초년생은 2년 뒤 연봉이 5천만을 넘길 수 있고, 적금·저축이 늘어 순자산 기준을 초과할
          수도 있어요.
        </p>
      </div>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">연장 조건</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p
        v-for="line in RENEWAL_TERMS"
        :key="line"
        class="text-caption-tight text-ink-hero font-normal"
      >
        {{ line }}
      </p>
      <p class="text-step text-ink-meta font-normal">
        중소기업 우대금리를 받았으면 1회차 연장은 면제예요.
      </p>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">연장 불가면 대안 상품</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p
        v-for="line in RENEWAL_ALTERNATIVES"
        :key="line"
        class="text-caption-tight text-ink-hero font-normal"
      >
        {{ line }}
      </p>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">보증금이 오르면</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-row text-ink-hero">추가 대출 한도</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        기존 대출금 잔액 + 추가 대출 ≤ 새 보증금의 70%. 청년·신혼·2자녀 이상은 80%.
      </p>
      <p class="text-step text-ink-meta font-normal">
        호당 대출한도 이내이고 횟수 제한은 없어요. 신청 기한은 갱신일로부터 3개월 이내.
      </p>

      <div class="bg-surface-caution rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-caution-deep font-semibold">예외</p>
        <p class="text-caption-tight text-ink-hero font-normal">
          전세금안심대출보증서로 받은 대출은 추가대출이 제한될 수 있어요.
        </p>
      </div>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">증액분은 확정일자를 새로 받아야 해요</h2>

    <div class="bg-surface border-danger-deep rounded-field flex flex-col gap-1.5 border p-3.5">
      <p class="text-row text-danger-deep">증액분만 새 확정일자, 기존 부분은 유지</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        기존 보증금은 기존 확정일자를 유지하고, 증액분만 새 확정일자가 필요해요 (그 날짜 기준으로
        순위가 잡혀요).
      </p>
      <p class="text-caption-tight text-ink-hero font-normal">
        그 사이 근저당이 생겼다면 증액분은 후순위가 돼요. 갱신 계약서를 쓰면 바로 확정일자를
        받으세요.
      </p>
    </div>

    <h2 class="text-section text-ink-hero px-1 pt-2">갱신 시 준비물</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p
        v-for="line in RENEWAL_DOCUMENTS"
        :key="line"
        class="text-caption-tight text-ink-hero font-normal"
      >
        {{ line }}
      </p>

      <div class="bg-surface-caution rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-caution-deep font-semibold">유효기간 주의</p>
        <p class="text-caption-tight text-ink-hero font-normal">
          대출용은 1개월 기준이라 보증료 지원 때 쓴 서류(3개월용)는 못 써요.
        </p>
      </div>
    </AppCard>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/renewal`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
