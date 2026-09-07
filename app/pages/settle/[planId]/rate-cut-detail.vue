<script setup lang="ts">
/**
 * 홈 4-6 상세 · 금리인하요구권.
 *
 * 상품별로 금리를 낮추는 방법이 아예 다르다는 게 이 화면의 요지다.
 * 기금대출에 요구권을 신청하려고 은행에 가면 헛걸음이 된다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const PRODUCTS = [
  { badge: '기금 · 청년/일반 버팀목', tone: 'caution', text: '비대상 · 신청 자체가 없음' },
  { badge: '은행 자체 대출', tone: 'safe', text: '대상 · 금리인하요구권 신청 가능' },
] as const;
</script>

<template>
  <GuideFrame title="금리인하요구권 상세" @back="navigateTo(`/settle/${planId}/rate-cut`)">
    <h2 class="text-section text-ink-hero px-1 pt-2">상품별 대상 여부</h2>

    <AppCard class="flex flex-col gap-0 p-2.5">
      <div
        v-for="(row, index) in PRODUCTS"
        :key="row.badge"
        class="flex items-center gap-2.5 px-2.5 py-3"
        :class="index ? 'border-line-soft border-t' : ''"
      >
        <StatusBadge :tone="row.tone" :fill="row.tone === 'safe' ? 'soft' : 'solid'">
          {{ row.badge }}
        </StatusBadge>
        <span class="text-caption-tight text-ink-hero flex-1 font-semibold">{{ row.text }}</span>
      </div>
    </AppCard>

    <div class="bg-surface-info rounded-cta px-3.5 py-3">
      <p class="text-caption-tight text-ink-hero font-normal">
        기금대출은 국토부 고시 금리라 은행이 깎아 줄 권한이 없어요. 대신 우대금리 조건을 더 채우면
        연장할 때 반영돼요 (상한 0.5%p).
      </p>
    </div>

    <h2 class="text-section text-ink-hero px-1 pt-2">신청할 만한 때</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-caption-tight text-ink-hero font-normal">• 취업 (무직에서 재직으로)</p>
      <p class="text-caption-tight text-ink-hero font-normal">• 승진·이직으로 소득 증가</p>
      <p class="text-caption-tight text-ink-hero font-normal">• 신용점수 상승</p>
      <p class="text-caption-tight text-ink-hero font-normal">• 다른 대출 상환으로 부채 감소</p>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">신청 방법</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-caption-tight text-ink-hero font-normal">• 영업점 방문</p>
      <p class="text-caption-tight text-ink-hero font-normal">• 인터넷뱅킹</p>
      <p class="text-caption-tight text-ink-hero font-normal">• 모바일 앱</p>
      <p class="text-step text-ink-meta font-normal">
        횟수 제한은 없지만 은행 심사에 따라 반영되지 않을 수도 있어요.
      </p>
    </AppCard>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/rate-cut`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
