<script setup lang="ts">
import { useJeonsePolicies } from '~/composables/useJeonsePolicies';

/**
 * 1-3 매칭 확인.
 *
 * 1루 판정 결과를 처음 보여주는 화면이다. 여기서는 **금액을 말하지 않는다** —
 * 조건을 통과했는지만 본다. 숫자를 먼저 띄우면 조건을 안 읽고 한도만 믿는다.
 * 금액은 다음 화면(내 스펙)의 몫이다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const { pending, error, cards, basisOf } = useJeonsePolicies(planId);
</script>

<template>
  <PhoneFrame>
    <StageBar title="스펙 매칭 확인" base="1루" @back="navigateTo(`/diagnosis/${planId}`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-5 py-4">
      <h2 class="text-headline1 text-ink-hero">조건에 맞는 대출을 모두 확인했어요</h2>

      <p v-if="pending" class="text-label2 text-ink-muted">판정 결과를 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <MatchPolicyCard v-for="card in cards" :key="card.code" :card="card" :basis="basisOf(card)" />
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-6">
      <AppButton
        variant="strong"
        :disabled="pending || !cards.length"
        @click="navigateTo(`/result/${planId}/spec`)"
      >
        내 스펙 확인하러 가기
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
