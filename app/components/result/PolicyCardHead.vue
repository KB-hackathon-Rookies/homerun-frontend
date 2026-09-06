<script setup lang="ts">
/**
 * 결과 카드의 머리.
 *
 * 이름 왼쪽, 뱃지 오른쪽. 두 화면이 같은 카드 목록을 다른 눈으로 보기 때문에
 * 뱃지는 화면이 정한다 — 매칭 확인은 "됐나", 내 스펙은 "쓸 만한가" 를 말한다.
 * 댈 잣대가 없는 카드는 뱃지 없이 이름만 둔다.
 */
import type { Badge } from '~/components/result/badge';

defineProps<{ title: string; badge: Badge | null }>();
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <h3 class="text-body2 text-ink-hero font-bold">{{ title }}</h3>
    <AppBadge v-if="badge" :tone="badge.tone" fill="solid">{{ badge.label }}</AppBadge>
  </div>
</template>
