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

/**
 * 코치 TIME(시안 1루 4 모달 · 자주 묻는 질문).
 *
 * 판정을 보고 나면 "나는 왜 안 되지" 가 먼저 온다. 시안은 그 질문들을 모달에
 * 모아 둔다. 한 줄짜리 코치 팁만으로는 답이 안 되는 것들이라 따로 편다.
 *
 * 내용은 시안 문구 그대로다. 지어내지 않는다.
 */
const COACH = {
  title: '자주 묻는 질문',
  intro: '판정 결과 보면서 자주 나오는 질문들이야. 네 상황에 걸리는 게 있으면 여기서 확인해',
  qa: [
    {
      q: '부모님이 집을 가지고 있으면?',
      a: '버팀목은 세대 전원 무주택이라 부모님과 같은 세대면 걸려. 분가하면 내 세대 기준으로 봐. 서울시 이자지원은 신청인 기준이라 부모님 주택과 무관해',
    },
    {
      q: '신용대출이 있는데 전세대출이 돼?',
      a: '돼. 중복 금지는 기금대출·일반 전세대출·주택담보대출 같은 주택 관련 대출끼리만이야. 신용대출, 마이너스통장, 학자금, 자동차 할부는 괜찮아. 다만 부채가 많으면 은행 심사에서 한도가 줄 수 있어',
    },
    {
      q: '만 35세인데 청년 상품이 없어?',
      a: '두 가지 길이 있어. 버팀목은 병역 이행 + 중소·중견 재직이면 만 39세까지, HF 청년특례는 2026년 10월부터 조건 없이 만 39세까지 확대돼',
    },
    {
      q: '소득이 5천만원을 넘어서 버팀목이 안 돼',
      a: '은행 대출로 갈 수 있어. HF 청년특례 보증은 소득 7천만원 이하, 일반 보증은 소득 제한이 없어. 금리는 버팀목보다 높지만 한도는 더 클 수 있어',
    },
  ],
};

const coachOpen = ref(false);
</script>

<template>
  <PhoneFrame v-model:coach-open="coachOpen" :coach-sheets="[COACH]">
    <StageBar title="스펙 매칭 확인" base="1루" @back="navigateTo(`/diagnosis/${planId}`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-5 py-4">
      <!-- 코치 팁 전체가 코치 TIME 을 여는 자리다. 오른쪽 아래 코치 FAB 과 같은 시트를 연다. -->
      <button type="button" class="w-full text-left" @click="coachOpen = true">
        <CoachTip label="⚾ 코치 TIME · 눌러서 자세히 보기"
          >네 조건에 맞는 정책을 자동으로 매칭했어. 왜 되는지·안 되는지 근거도 같이 볼 수
          있어</CoachTip
        >
      </button>

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

    <!-- 시안(1루 4)은 이전·내 스펙 보기를 하단 CTA 줄에 나란히 둔다. -->
    <footer class="px-gutter-tight flex shrink-0 gap-2.5 pt-2.5 pb-cta-pad">
      <div class="w-28 shrink-0">
        <AppButton variant="white" @click="navigateTo(`/diagnosis/${planId}`)">이전</AppButton>
      </div>

      <div class="flex-1">
        <AppButton
          variant="strong"
          :disabled="pending || !cards.length"
          @click="navigateTo(`/result/${planId}/spec`)"
        >
          내 스펙 보기
        </AppButton>
      </div>
    </footer>
  </PhoneFrame>
</template>
