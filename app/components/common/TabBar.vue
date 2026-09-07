<script setup lang="ts">
import type { IconName } from '~/components/common/AppIcon.vue';

/**
 * 하단 탭바.
 *
 * 홈과 마이가 같이 쓴다. 탐색·준비는 계획이 있어야 갈 곳이 정해지므로,
 * 계획을 모르면 눌리지 않게 둔다 — 눌러 놓고 아무 일도 안 일어나는 것보다 낫다.
 */
export type TabKey = 'home' | 'explore' | 'prep' | 'my';

const { active, planId = null } = defineProps<{
  active: TabKey;
  planId?: number | null;
}>();

const TABS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'home', label: '홈', icon: 'home' },
  { key: 'explore', label: '탐색', icon: 'search' },
  { key: 'prep', label: '준비', icon: 'document' },
  { key: 'my', label: '마이', icon: 'persons' },
];

function pathOf(key: TabKey) {
  if (key === 'home') return '/home';
  if (key === 'my') return '/my';
  if (!planId) return null;
  return key === 'explore' ? `/property/${planId}` : `/contract/${planId}/schedule`;
}
</script>

<template>
  <nav
    class="h-tabbar border-line bg-surface sticky bottom-0 flex shrink-0 items-center border-t pt-2 pb-5"
  >
    <button
      v-for="tab in TABS"
      :key="tab.key"
      type="button"
      class="flex flex-1 flex-col items-center justify-center gap-1"
      :class="tab.key === active ? 'text-primary-strong' : 'text-ink-muted'"
      :disabled="!pathOf(tab.key)"
      :aria-current="tab.key === active ? 'page' : undefined"
      @click="navigateTo(pathOf(tab.key)!)"
    >
      <AppIcon :name="tab.icon" class="size-icon" />
      <span class="text-caption1">{{ tab.label }}</span>
    </button>
  </nav>
</template>
