<script setup lang="ts">
import { useJeonsePolicies } from '~/composables/useJeonsePolicies';

/**
 * 1-4 내 스펙.
 *
 * 앞 화면에서 통과한 카드를 금액으로 다시 본다. 여기서 나오는 한도는 상품
 * 기준 최대치라 은행이 더 낮게 안내할 수 있다 — 그 사실을 숫자 밑에 반드시
 * 남긴다. 실제 한도는 2루 상담 결과가 들어오면 덮어쓴다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const { pending, error, cards } = useJeonsePolicies(planId);
</script>

<template>
  <PhoneFrame>
    <StageBar title="스펙 매칭 확인" base="1루" @back="navigateTo(`/result/${planId}/match`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3.5 py-4">
      <CoachTip>네 스펙은 입력값으로 계산한 거야. 숫자를 눌러보면 계산 근거를 보여줄게</CoachTip>

      <h2 class="text-headline1 text-ink-hero">받을 수 있는 대출을 모두 찾았어요</h2>

      <p v-if="pending" class="text-label2 text-ink-muted">판정 결과를 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <SpecPolicyCard v-for="card in cards" :key="card.code" :card="card" />

      <AppCard v-if="cards.length" class="text-caption2 text-ink-hero-body">
        ⚠️ 여기 나온 한도는 상품 기준 최대치예요. 실제로는 은행이 더 낮게 안내할 수 있어요 — 은행이
        한도를 다 내주면 연체·사고 시 영업점이 책임지기 때문이에요. 2루 은행 상담 결과가 입력되면 이
        카드 값은 은행이 안내한 한도로 덮어써져요.
      </AppCard>

      <AppCard v-if="cards.length" class="flex flex-col gap-2.5">
        <p class="text-label2 text-ink-muted font-bold">⚾ 코치 TIME</p>
        <p class="text-caption2 text-ink-hero-body">
          스펙이 나왔지? 이제 이 조건에 맞는 집을 찾으러 가자. 바로 부동산으로 달려가기보다
          온라인으로 어느 정도 파악한 후에 가는 게 좋아. 찾았으면 2루에서 그 집이 안전한지
          확인해볼게.
        </p>
      </AppCard>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton
        variant="strong"
        :disabled="pending || !cards.length"
        @click="navigateTo(`/property/${planId}`)"
      >
        매물 찾으러 가기
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
