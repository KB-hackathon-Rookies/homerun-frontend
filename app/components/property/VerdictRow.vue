<script setup lang="ts">
import type { PropertyPolicyVerdict } from '~/api/property';

/**
 * 상품 하나가 이 매물로 되는지 한 줄.
 *
 * 왼쪽 상품 이름, 오른쪽 판정. `NEED_INFO` 는 아직 못 정한 것이지 되는 것도
 * 안 되는 것도 아니라 파랑으로 따로 둔다.
 */
const { verdict } = defineProps<{ verdict: PropertyPolicyVerdict }>();

const RESULT = {
  PASS: { label: '가능', tone: 'text-success' },
  NEED_INFO: { label: '진행중', tone: 'text-primary-strong' },
  FAIL: { label: '불가', tone: 'text-danger' },
} as const;

const result = computed(() => RESULT[verdict.status]);
</script>

<template>
  <div class="flex items-center justify-between gap-2 py-2">
    <span class="text-body3 text-ink-hero-body font-medium">{{ verdict.policyName }}</span>
    <span class="text-body3 shrink-0 font-bold" :class="result.tone">{{ result.label }}</span>
  </div>
</template>
