<script setup lang="ts">
import type { BadgeTone } from '~/components/settle/StatusBadge.vue';

/**
 * 지금 해야 할 일 한 줄.
 *
 * 왼쪽 배지가 급한 정도다. 갈 화면이 아직 없으면 눌리지 않는다.
 */
defineProps<{ pill: string; tone: BadgeTone; title: string; to: string | null }>();
</script>

<template>
  <button
    type="button"
    class="bg-surface border-line rounded-cta flex items-center gap-2.5 border px-3.5 py-3 text-left disabled:opacity-40"
    :disabled="!to"
    @click="navigateTo(to!)"
  >
    <StatusBadge :tone="tone">{{ pill }}</StatusBadge>
    <span class="text-row text-ink-hero flex-1">{{ title }}</span>
    <AppIcon name="chevron-right" class="text-ink-meta size-4 shrink-0" />
  </button>
</template>
