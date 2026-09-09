<script setup lang="ts">
import type { ConditionBasis, LoanCard } from '~/api/policy';
import { matchBadge } from '~/components/result/badge';

/**
 * 1-3 매칭 확인 카드.
 *
 * 카드가 길어지면 상품을 비교하기 어려워진다. 이미 통과한 조건은 배지에 맡기고,
 * 사용자가 직접 확인해야 하는 조건만 먼저 보여 준다.
 */
const { card, basis } = defineProps<{ card: LoanCard; basis: ConditionBasis[] }>();

const badge = computed(() => matchBadge(card));

/**
 * `null` 은 아직 확인하지 못한 조건이다. 통과한 조건을 되풀이하지 않아야 여러
 * 상품을 한 화면에서 비교할 수 있다. 통과 조건까지 포함한 전체 목록은 접어 둔다.
 */
const confirmationConditions = computed(() =>
  basis.filter((condition) => condition.isMet === null),
);
const visibleConfirmationConditions = computed(() => confirmationConditions.value.slice(0, 3));
const collapsedConditions = computed(() => {
  const visibleCodes = new Set(
    visibleConfirmationConditions.value.map((condition) => condition.code),
  );
  return basis.filter((condition) => !visibleCodes.has(condition.code));
});

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

    <ul v-if="visibleConfirmationConditions.length" class="flex flex-col gap-2">
      <li
        v-for="condition in visibleConfirmationConditions"
        :key="condition.code"
        class="flex items-start gap-2"
      >
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

    <details v-if="collapsedConditions.length" class="text-caption2 text-ink-muted">
      <summary class="cursor-pointer font-semibold">
        전체 조건 {{ collapsedConditions.length }}개 보기
      </summary>
      <ul class="mt-2 flex flex-col gap-2">
        <li
          v-for="condition in collapsedConditions"
          :key="condition.code"
          class="flex items-start gap-2"
        >
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
    </details>

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
