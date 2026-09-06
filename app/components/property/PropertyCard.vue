<script setup lang="ts">
import type { PropertyCandidate, PropertyPolicyVerdict } from '~/api/property';
import { trafficTone } from '~/components/property/trafficLight';

/**
 * 목록의 매물 카드.
 *
 * 머리에 매물 이름과 신호등, 그 아래 상품별 판정. 신호등이 RED 면 백엔드가
 * 상품을 아예 내려주지 않는다 — 대출이 막힌 매물에 상품 목록을 보여주면
 * 아직 길이 있는 것처럼 읽힌다.
 */
defineProps<{
  property: PropertyCandidate;
  label: string;
  verdicts: PropertyPolicyVerdict[];
}>();
</script>

<template>
  <AppCard class="flex flex-col gap-1 pb-3">
    <div class="flex items-center justify-between gap-2 pb-2">
      <div class="min-w-0">
        <h3 class="text-option text-ink-hero">{{ label }}</h3>
        <p class="text-label2 text-ink-muted truncate">{{ property.roadAddress }}</p>
      </div>
      <AppBadge :tone="trafficTone(property.trafficLight)" fill="solid">
        {{ property.trafficLightLabel ?? '확인 중' }}
      </AppBadge>
    </div>

    <div class="bg-line h-px" />

    <VerdictRow
      v-for="verdict in verdicts"
      :key="verdict.policyCode ?? verdict.policyName ?? ''"
      :verdict="verdict"
    />

    <p v-if="!verdicts.length" class="text-label2 text-ink-muted py-2">
      {{
        property.trafficLight === 'RED'
          ? '대출이 막힌 매물이라 상품을 보여주지 않아요.'
          : '아직 상품 판정이 없어요. 매물 진단을 끝내면 여기에 쌓여요.'
      }}
    </p>
  </AppCard>
</template>
