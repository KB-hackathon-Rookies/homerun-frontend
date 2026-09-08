<script setup lang="ts">
import type { ConditionBasis, LoanCard } from '~/api/policy';
import { matchBadge } from '~/components/result/badge';

/**
 * 1-3 매칭 확인 카드.
 *
 * 통과했다는 말만 하지 않는다. 어떤 조건을 무엇 때문에 통과했는지 한 줄씩
 * 편다 — 나중에 은행에서 다른 말을 들었을 때 어디가 어긋났는지 짚을 수
 * 있어야 한다.
 */
const { card, basis } = defineProps<{ card: LoanCard; basis: ConditionBasis[] }>();

const badge = computed(() => matchBadge(card));

/**
 * 확인하지 못한 조건은 회색 점으로 둔다. 체크로 그리면 통과한 것처럼 읽히고,
 * 가위표로 그리면 떨어진 것처럼 읽힌다. 둘 다 사실이 아니다.
 */
const MARK: Record<'met' | 'unmet' | 'unknown', { glyph: string; tone: string }> = {
  met: { glyph: '✓', tone: 'text-success' },
  unmet: { glyph: '✕', tone: 'text-danger' },
  unknown: { glyph: '·', tone: 'text-ink-subtle' },
};

const markOf = (condition: ConditionBasis) => {
  if (condition.isMet === null) return MARK.unknown;
  return condition.isMet ? MARK.met : MARK.unmet;
};
</script>

<template>
  <AppCard radius="button" class="flex flex-col gap-3">
    <PolicyCardHead :title="card.name" :badge="badge" />

    <ul v-if="basis.length" class="flex flex-col gap-3">
      <li v-for="condition in basis" :key="condition.code" class="flex items-start gap-2">
        <span class="text-body2 w-3.5 shrink-0 font-bold" :class="markOf(condition).tone">
          {{ markOf(condition).glyph }}
        </span>
        <p class="text-label2 text-ink-hero">
          {{ condition.label }}
          <span v-if="condition.requiredText" class="text-ink-muted">
            {{ condition.requiredText }}
          </span>
        </p>
      </li>
    </ul>

    <!--
      시안 1루 4 는 조건 목록이 있는 카드에 회색 상자를 두지 않는다. 상담 안내처럼
      판정할 조건이 없는 카드만 이 상자로 말한다.
    -->
    <p
      v-if="card.notice"
      class="bg-surface-muted rounded-button text-caption2 text-ink-card-body p-4"
    >
      {{ card.notice }}
    </p>
  </AppCard>
</template>
