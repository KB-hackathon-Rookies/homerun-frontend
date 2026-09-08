<script setup lang="ts">
import { useJeonsePolicies } from '~/composables/useJeonsePolicies';
import { useResultGuard } from '~/composables/useResultGuard';

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

const { pending, error, cards, results, basisOf } = useJeonsePolicies(planId);

/*
 * 판정이 다 떨어졌으면 여기서 멈추지 않고 왜 막혔는지 말해 주는 화면으로
 * 보낸다. 결과가 나온 뒤에만 보므로 평소 흐름은 그대로다.
 */
const { ruleChanged, eligibilityEnding, allPoliciesFailed, inspect } = useResultGuard(planId);

watch(pending, (loading) => {
  if (!loading && !error.value) inspect(results.value, cards.value);
});
</script>

<template>
  <PhoneFrame>
    <StageBar title="스펙 매칭 확인" base="1루" @back="navigateTo(`/diagnosis/${planId}`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-5 py-4">
      <CoachTip
        >네 조건에 맞는 정책을 자동으로 매칭했어. 왜 되는지·안 되는지 근거도 같이 볼 수
        있어</CoachTip
      >

      <h2 class="text-headline1 text-ink-hero">
        {{
          allPoliciesFailed
            ? '지금 되는 정책은 없지만, 은행 상담으로 이어갈 수 있어요'
            : '조건에 맞는 대출을 모두 확인했어요'
        }}
      </h2>

      <p v-if="pending" class="text-label2 text-ink-muted">판정 결과를 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <!--
        정책이 다 떨어졌다. 결과 화면을 막지 않고 왜 막혔는지 볼 길만 열어 둔다.
        no-policy 로 자동 이동하지 않으므로 여기서 눌러 들어가도 루프가 생기지 않는다.
      -->
      <StatusNotice
        v-if="allPoliciesFailed"
        tone="danger"
        @open="navigateTo(`/status/${planId}/no-policy`)"
      >
        조건에 맞는 정책이 없어요. 왜 막혔는지 확인해보세요
      </StatusNotice>

      <StatusNotice v-if="ruleChanged" @open="navigateTo(`/status/${planId}/rule-changed`)">
        지침이 개정돼 다시 판정해야 하는 정책이 있어요
      </StatusNotice>

      <StatusNotice
        v-if="eligibilityEnding"
        tone="danger"
        @open="navigateTo(`/status/${planId}/eligibility-ending`)"
      >
        자격 기한이 다가온 조건이 있어요
      </StatusNotice>

      <MatchPolicyCard v-for="card in cards" :key="card.code" :card="card" :basis="basisOf(card)" />
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
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
