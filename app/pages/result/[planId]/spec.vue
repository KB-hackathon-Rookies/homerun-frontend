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

/**
 * 1루 안착 축하(시안 1루 6).
 *
 * 스펙이 다 나온 순간이 1루를 밟은 순간이다. 시안은 여기서 딤을 덮고 다음
 * 목적지(2루 · 검증)를 알려준다.
 *
 * 한 번 보고 나면 다시 띄우지 않는다. 매물 화면에 갔다 돌아올 때마다 축하가
 * 다시 뜨면 축하가 아니라 방해다. 계획마다 따로 기억하고, 탭을 닫으면 잊는다 —
 * 서버에 남길 만한 값이 아니다.
 */
const CELEBRATED_KEY = `homerun:first-base-settled:${planId}`;

const celebrating = ref(false);

function dismissCelebration() {
  celebrating.value = false;
  try {
    sessionStorage.setItem(CELEBRATED_KEY, '1');
  } catch {
    // 시크릿 모드 등으로 저장이 막혀도 축하를 닫는 것 자체는 되어야 한다.
  }
}

onMounted(() => {
  let seen = false;
  try {
    seen = sessionStorage.getItem(CELEBRATED_KEY) === '1';
  } catch {
    // 읽지 못하면 처음 보는 것으로 친다.
  }
  if (seen) return;

  // 카드가 실제로 나온 뒤에만 축하한다. 판정이 비면 축하할 일이 아니다.
  // 조회는 이 화면이 붙은 뒤에 끝나므로 immediate 는 쓰지 않는다 — 즉시 실행하면
  // stop 이 아직 없는 채로 불린다.
  const stop = watch([pending, cards], ([loading, list]) => {
    if (loading) return;
    if (list.length) celebrating.value = true;
    stop();
  });
});
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

    <!-- 시안(1루 5)은 이전·2루로를 하단 CTA 줄에 나란히 둔다. -->
    <footer class="px-gutter-tight flex shrink-0 gap-2.5 pt-2.5 pb-cta-pad">
      <div class="w-28 shrink-0">
        <AppButton variant="white" @click="navigateTo(`/result/${planId}/match`)">이전</AppButton>
      </div>

      <div class="flex-1">
        <AppButton
          variant="strong"
          :disabled="pending || !cards.length"
          @click="navigateTo(`/property/${planId}`)"
        >
          매물 찾으러 가기
        </AppButton>
      </div>
    </footer>

    <!-- 1루 안착 축하(시안 1루 6). 흐름을 잠깐 멈추고 다음 목적지만 말한다. -->
    <DimOverlay v-if="celebrating" @close="dismissCelebration">
      <div class="flex flex-col items-center gap-2 text-center">
        <p class="text-caption1 text-primary-strong">1루 안착!</p>
        <h2 class="text-headline1 text-ink-hero">받을 수 있는 대출, 다 찾았어</h2>
        <p class="text-caption2 text-ink-hero-body">
          네 조건으로 가능한 대출과 한도가 나왔어. 이제 이 스펙에 맞는 집을 찾으러 가자
        </p>

        <p class="bg-surface-info rounded-chip text-caption1 text-primary-strong mt-1 px-3 py-1.5">
          ⚾ 다음은 2루 · 검증
        </p>

        <div class="mt-3 w-full">
          <AppButton variant="strong" @click="dismissCelebration">스펙 확인하기</AppButton>
        </div>
      </div>
    </DimOverlay>
  </PhoneFrame>
</template>
